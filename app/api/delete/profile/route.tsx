import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Configuration constants
const BATCH_SIZE = 100; // Process deletions in batches
const ALLOWED_BUCKETS = ['long_term_storage', 'temporary_storage', 'profile_images'];
const MAX_ITERATIONS = 100; // Prevent infinite loops (100 * 100 = 10,000 files max per iteration)

interface DeletionError {
  step: string;
  message: string;
  critical: boolean;
}

export async function DELETE(req: NextRequest) {
  const errors: DeletionError[] = [];
  let authUserDeleted = false;

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }
    
    console.log(`Starting account deletion for user: ${userId}`);

    // STEP 1: Delete all long-term storage files (paginated to handle large amounts)
    try {
      let hasMoreFiles = true;
      let iteration = 0;

      while (hasMoreFiles && iteration < MAX_ITERATIONS) {
        const { data: files, error: fetchError } = await supabase
          .from("storage_nodes")
          .select("bucket, bucket_path, type")
          .eq("uid", userId)
          .eq("type", "file")
          .limit(BATCH_SIZE);

        if (fetchError) {
          errors.push({
            step: "fetch_storage_files",
            message: `Failed to fetch storage files: ${fetchError.message}`,
            critical: false
          });
          break;
        }

        if (!files || files.length === 0) {
          hasMoreFiles = false;
          break;
        }

        // Validate and group files by bucket
        const filesByBucket: Record<string, string[]> = {};
        
        for (const file of files) {
          // Validate bucket name
          if (!file.bucket || !ALLOWED_BUCKETS.includes(file.bucket)) {
            errors.push({
              step: "validate_bucket",
              message: `Invalid or unauthorized bucket: ${file.bucket}`,
              critical: false
            });
            continue;
          }

          // Validate bucket path format
          if (!file.bucket_path || typeof file.bucket_path !== 'string') {
            continue;
          }

          // Ensure path starts with user ID for security
          if (!file.bucket_path.startsWith(`${userId}/`)) {
            errors.push({
              step: "validate_path",
              message: `Path doesn't belong to user: ${file.bucket_path}`,
              critical: false
            });
            continue;
          }

          filesByBucket[file.bucket] = filesByBucket[file.bucket] || [];
          filesByBucket[file.bucket].push(file.bucket_path);
        }

        // Delete files from storage buckets
        for (const [bucket, paths] of Object.entries(filesByBucket)) {
          const { error } = await supabase.storage.from(bucket).remove(paths);
          
          if (error) {
            errors.push({
              step: "delete_storage_files",
              message: `Failed to delete batch from ${bucket}: ${error.message}`,
              critical: false
            });
          }
        }

        // Delete the database records for this batch
        const fileIds = files.map(f => f.bucket_path).filter(Boolean);
        if (fileIds.length > 0) {
          const { error: dbError } = await supabase
            .from("storage_nodes")
            .delete()
            .eq("uid", userId)
            .eq("type", "file")
            .in("bucket_path", fileIds);

          if (dbError) {
            errors.push({
              step: "delete_storage_nodes_batch",
              message: `Failed to delete storage nodes batch: ${dbError.message}`,
              critical: false
            });
          }
        }

        iteration++;
        
        // If we got fewer files than batch size, we're done
        if (files.length < BATCH_SIZE) {
          hasMoreFiles = false;
        }
      }

      if (iteration >= MAX_ITERATIONS) {
        errors.push({
          step: "storage_file_limit",
          message: `Reached maximum iterations (${MAX_ITERATIONS}). User may have excessive files.`,
          critical: true
        });
      }
    } catch (e) {
      errors.push({
        step: "delete_storage_files",
        message: `Exception during storage file deletion: ${e instanceof Error ? e.message : 'Unknown error'}`,
        critical: false
      });
    }

    // STEP 2: Delete temporary storage files (paginated)
    try {
      let hasMoreTempFiles = true;
      let iteration = 0;

      while (hasMoreTempFiles && iteration < MAX_ITERATIONS) {
        const { data: tempFiles, error: fetchError } = await supabase
          .from("temp_storage")
          .select("id, bucket_file_path, in_bucket")
          .eq("uid", userId)
          .eq("in_bucket", 1)
          .limit(BATCH_SIZE);

        if (fetchError) {
          errors.push({
            step: "fetch_temp_files",
            message: `Failed to fetch temp files: ${fetchError.message}`,
            critical: false
          });
          break;
        }

        if (!tempFiles || tempFiles.length === 0) {
          hasMoreTempFiles = false;
          break;
        }

        const tempPaths = tempFiles
          .map(f => f.bucket_file_path)
          .filter((path): path is string => {
            if (!path || typeof path !== 'string') return false;
            // Validate path starts with user ID
            return path.startsWith(`${userId}/`);
          });

        if (tempPaths.length > 0) {
          const { error } = await supabase.storage
            .from("temporary_storage")
            .remove(tempPaths);
          
          if (error) {
            errors.push({
              step: "delete_temp_files",
              message: `Failed to delete temp storage batch: ${error.message}`,
              critical: false
            });
          }
        }

        // Delete the database records for this batch
        const tempIds = tempFiles.map(f => f.id).filter(Boolean);
        if (tempIds.length > 0) {
          const { error: dbError } = await supabase
            .from("temp_storage")
            .delete()
            .eq("uid", userId)
            .in("id", tempIds);

          if (dbError) {
            errors.push({
              step: "delete_temp_storage_batch",
              message: `Failed to delete temp storage records: ${dbError.message}`,
              critical: false
            });
          }
        }

        iteration++;

        if (tempFiles.length < BATCH_SIZE) {
          hasMoreTempFiles = false;
        }
      }

      if (iteration >= MAX_ITERATIONS) {
        errors.push({
          step: "temp_file_limit",
          message: `Reached maximum iterations for temp files (${MAX_ITERATIONS}).`,
          critical: true
        });
      }
    } catch (e) {
      errors.push({
        step: "delete_temp_files",
        message: `Exception during temp file deletion: ${e instanceof Error ? e.message : 'Unknown error'}`,
        critical: false
      });
    }

    // STEP 3: Delete profile picture
    try {
      const profilePath = `${userId}/profile`;
      const { error } = await supabase.storage
        .from("profile_images")
        .remove([profilePath]);
      
      // Profile picture might not exist, so only log actual errors
      if (error && !error.message.includes('not found')) {
        errors.push({
          step: "delete_profile_picture",
          message: `Failed to delete profile picture: ${error.message}`,
          critical: false
        });
      }
    } catch (e) {
      errors.push({
        step: "delete_profile_picture",
        message: `Exception during profile picture deletion: ${e instanceof Error ? e.message : 'Unknown error'}`,
        critical: false
      });
    }

    // STEP 4: Delete remaining database records
    // Important: Delete in correct order to respect foreign key constraints
    try {
      // Delete any remaining storage nodes (folders and any missed files)
      const { error: storageNodesError } = await supabase
        .from("storage_nodes")
        .delete()
        .eq("uid", userId);

      if (storageNodesError) {
        errors.push({
          step: "delete_storage_nodes",
          message: `Failed to delete remaining storage nodes: ${storageNodesError.message}`,
          critical: true
        });
      }

      // Delete any remaining temp storage
      const { error: tempStorageError } = await supabase
        .from("temp_storage")
        .delete()
        .eq("uid", userId);

      if (tempStorageError) {
        errors.push({
          step: "delete_temp_storage",
          message: `Failed to delete remaining temp storage records: ${tempStorageError.message}`,
          critical: true
        });
      }

      // Delete profile (parent record)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        errors.push({
          step: "delete_profile",
          message: `Failed to delete profile: ${profileError.message}`,
          critical: true
        });
      }
    } catch (e) {
      errors.push({
        step: "delete_database_records",
        message: `Exception during database deletion: ${e instanceof Error ? e.message : 'Unknown error'}`,
        critical: true
      });
    }

    // Check for critical errors before deleting auth user
    const hasCriticalErrors = errors.some(e => e.critical);
    if (hasCriticalErrors) {
      console.error(`Critical errors during account deletion for ${userId}:`, errors);
      return NextResponse.json({
        error: "Account deletion incomplete due to critical errors",
        details: errors.filter(e => e.critical).map(e => e.message),
        warnings: errors.filter(e => !e.critical).map(e => e.message)
      }, { status: 500 });
    }

    // STEP 5: Delete auth user (point of no return)
    try {
      const adminClient = createAdminClient();
      
      if (!adminClient) {
        throw new Error("Admin client not available");
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error(`CRITICAL: Failed to delete auth user ${userId}:`, deleteError);
        console.error("Previous steps completed:", {
          storageFilesDeleted: true,
          tempFilesDeleted: true,
          profilePictureDeleted: true,
          databaseRecordsDeleted: true
        });
        
        return NextResponse.json({
          error: "Failed to delete authentication account",
          critical: "User data was deleted but authentication account remains. Contact support.",
          details: errors.map(e => e.message)
        }, { status: 500 });
      }

      authUserDeleted = true;
      console.log(`Successfully deleted account for user: ${userId}`);

    } catch (e) {
      console.error(`CRITICAL: Exception deleting auth user ${userId}:`, e);
      return NextResponse.json({
        error: "Failed to complete account deletion",
        critical: "User data was deleted but authentication account may remain. Contact support.",
        details: errors.map(e => e.message)
      }, { status: 500 });
    }

    // Success response
    const response: any = { success: true };
    
    if (errors.length > 0) {
      response.warnings = errors.map(e => ({
        step: e.step,
        message: e.message
      }));
      console.warn(`Account deleted for ${userId} but with warnings:`, errors);
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    
    return NextResponse.json({
      error: "An unexpected error occurred during account deletion",
      authUserDeleted: authUserDeleted ? "Auth account was deleted" : "Auth account not deleted"
    }, { status: 500 });
  }
}