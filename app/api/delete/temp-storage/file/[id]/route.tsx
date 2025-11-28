import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  let dbRecordDeleted = false;
  let originalStorageUsed = 0;

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await and validate params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Get file info to verify ownership and get metadata
    const { data: fileData, error: fetchError } = await supabase
      .from('temp_storage')
      .select('file_size, bucket_file_path, in_bucket, uid')
      .eq('id', trimmedId)
      .eq('uid', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("File fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to retrieve file information" },
        { status: 500 }
      );
    }

    if (!fileData) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // Double-check ownership (defense in depth)
    if (fileData.uid !== user.id) {
      console.error(`Authorization violation: User ${user.id} attempted to delete file owned by ${fileData.uid}`);
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const fileSize = fileData.file_size || 0;
    const bucketPath = fileData.bucket_file_path;
    const inBucket = fileData.in_bucket;

    // Validate file size is reasonable
    if (fileSize < 0) {
      return NextResponse.json(
        { error: "Invalid file size" },
        { status: 400 }
      );
    }

    // Get current storage before deletion
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("storage_used")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to retrieve user profile" },
        { status: 500 }
      );
    }

    originalStorageUsed = profile?.storage_used || 0;

    // Delete record from temp_storage first
    const { error: deleteError } = await supabase
      .from('temp_storage')
      .delete()
      .eq('id', trimmedId)
      .eq('uid', user.id);
    
    if (deleteError) {
      console.error("Database deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file record" },
        { status: 500 }
      );
    }

    dbRecordDeleted = true;

    // Delete file from storage bucket if it exists
    if (inBucket === 1 && bucketPath) {
      // Validate bucket path format
      if (typeof bucketPath !== 'string' || bucketPath.trim() === '') {
        console.error("Invalid bucket path:", bucketPath);
      } else {
        // Ensure path starts with user ID for security
        if (!bucketPath.startsWith(`${user.id}/`)) {
          console.error(`Security violation: Bucket path ${bucketPath} doesn't belong to user ${user.id}`);
        } else {
          const { error: storageError } = await supabase
            .storage
            .from('temporary_storage')
            .remove([bucketPath]);
          
          if (storageError) {
            console.error("Storage deletion error:", storageError);
            // Continue - database record is already deleted
            // Log for cleanup job to handle orphaned files
            console.error("ORPHANED FILE:", {
              userId: user.id,
              bucketPath: bucketPath,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    // Update storage usage in profile
    if (fileSize > 0) {
      const newStorage = Math.max(0, originalStorageUsed - fileSize);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id);

      if (updateError) {
        console.error("Storage update error:", updateError);
        
        // Critical error - log for manual intervention
        console.error("CRITICAL: Storage quota not updated after deletion", {
          userId: user.id,
          fileId: trimmedId,
          originalStorage: originalStorageUsed,
          fileSize: fileSize,
          expectedNewStorage: newStorage
        });

        return NextResponse.json({
          success: true,
          message: "File deleted but storage quota update failed",
          warning: "Storage quota may be incorrect. Contact support if this persists."
        }, { status: 200 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "File deleted successfully",
      details: {
        fileSize: fileSize,
        storageFreed: fileSize
      }
    });

  } catch (error) {
    console.error("Delete error:", error);

    // If database record was deleted but storage quota wasn't updated, try to fix it
    if (dbRecordDeleted && originalStorageUsed > 0) {
      console.error("CRITICAL: Attempting to rollback storage quota after error");
      // Note: We can't easily restore the deleted record, but we should at least log this
      // In a production system, you'd want a background job to reconcile storage quotas
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}