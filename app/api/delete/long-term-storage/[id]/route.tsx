import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

// Configuration constants
const MAX_RECURSION_DEPTH = 50; // Prevent infinite recursion
const MAX_BATCH_SIZE = 100; // Process deletions in batches

interface StorageNode {
  id: string;
  uid: string;
  type: 'file' | 'folder';
  bucket: string | null;
  bucket_path: string | null;
  file_size: number | null;
  parent_id: string | null;
}

interface DeletionResult {
  totalBytesDeleted: number;
  filesDeleted: number;
  foldersDeleted: number;
  errors: string[];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  const supabase = await createClient();
  let storageUpdated = false;
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
    const { id: theId } = resolvedParams;

    // Validate ID format
    if (!theId || typeof theId !== 'string') {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    const trimmedId = theId.trim();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Get the node metadata to verify ownership
    const { data: node, error: fetchError } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("id", trimmedId)
      .eq("uid", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Node fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to retrieve item" },
        { status: 500 }
      );
    }

    if (!node) {
      return NextResponse.json(
        { error: "Item not found or access denied" },
        { status: 404 }
      );
    }

    // Validate node type
    if (node.type !== 'file' && node.type !== 'folder') {
      return NextResponse.json(
        { error: "Invalid item type" },
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

    // Perform deletion
    const result: DeletionResult = {
      totalBytesDeleted: 0,
      filesDeleted: 0,
      foldersDeleted: 0,
      errors: []
    };

    if (node.type === "file") {
      // Delete single file
      const fileResult = await deleteSingleFile(supabase, node, user.id);
      result.totalBytesDeleted = fileResult.bytesDeleted;
      result.filesDeleted = fileResult.success ? 1 : 0;
      if (fileResult.error) {
        result.errors.push(fileResult.error);
      }
    } else if (node.type === "folder") {
      // Delete folder and all contents recursively
      await deleteFolderRecursive(supabase, node.id, user.id, result, 0);
      
      // Delete the folder itself
      const { error: deleteError } = await supabase
        .from("storage_nodes")
        .delete()
        .eq("id", trimmedId)
        .eq("uid", user.id);

      if (deleteError) {
        console.error("Folder deletion error:", deleteError);
        result.errors.push("Failed to delete folder metadata");
      } else {
        result.foldersDeleted += 1;
      }
    }

    // Update storage quota
    if (result.totalBytesDeleted > 0) {
      const newStorage = Math.max(0, originalStorageUsed - result.totalBytesDeleted);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id);

      if (updateError) {
        console.error("Storage update error:", updateError);
        result.errors.push("Failed to update storage quota");
        
        // This is critical - log for manual intervention
        console.error("CRITICAL: Storage quota not updated", {
          userId: user.id,
          originalStorage: originalStorageUsed,
          bytesDeleted: result.totalBytesDeleted,
          expectedNewStorage: newStorage
        });
      } else {
        storageUpdated = true;
      }
    }

    // Return success with details
    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      details: {
        filesDeleted: result.filesDeleted,
        foldersDeleted: result.foldersDeleted,
        bytesFreed: result.totalBytesDeleted,
        errors: result.errors.length > 0 ? result.errors : undefined
      }
    });

  } catch (error) {
    console.error("Delete error:", error);

    // Attempt to rollback storage if it was updated but there was an error
    if (storageUpdated && originalStorageUsed > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from("profiles")
            .update({ storage_used: originalStorageUsed })
            .eq("id", user.id);
        }
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Delete a single file from storage and database
async function deleteSingleFile(
  supabase: SupabaseClient,
  node: StorageNode,
  userId: string
): Promise<{ success: boolean; bytesDeleted: number; error?: string }> {
  let bytesDeleted = 0;
  let storageError: string | undefined;

  // Delete from storage bucket if applicable
  if (node.bucket && node.bucket_path) {
    // Validate bucket name (alphanumeric, hyphens, underscores only)
    const bucketRegex = /^[a-z0-9-_]+$/;
    if (!bucketRegex.test(node.bucket)) {
      return { success: false, bytesDeleted: 0, error: "Invalid bucket name" };
    }

    const { error } = await supabase.storage
      .from(node.bucket)
      .remove([node.bucket_path]);

    if (error) {
      console.error("Storage deletion error:", error);
      storageError = `Failed to delete file from storage: ${error.message}`;
    } else {
      bytesDeleted = node.file_size || 0;
    }
  }

  // Delete metadata from database
  const { error: dbError } = await supabase
    .from("storage_nodes")
    .delete()
    .eq("id", node.id)
    .eq("uid", userId);

  if (dbError) {
    console.error("Database deletion error:", dbError);
    return {
      success: false,
      bytesDeleted: 0,
      error: storageError || "Failed to delete file metadata"
    };
  }

  return {
    success: true,
    bytesDeleted,
    error: storageError
  };
}

// Recursively delete folder contents
async function deleteFolderRecursive(
  supabase: SupabaseClient,
  folderId: string,
  userId: string,
  result: DeletionResult,
  depth: number
): Promise<void> {
  // Prevent infinite recursion
  if (depth > MAX_RECURSION_DEPTH) {
    result.errors.push(`Maximum recursion depth exceeded for folder ${folderId}`);
    return;
  }

  // Validate folderId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(folderId)) {
    result.errors.push("Invalid folder ID format in recursive deletion");
    return;
  }

  // Get all children of this folder
  const { data: children, error } = await supabase
    .from("storage_nodes")
    .select("*")
    .eq("parent_id", folderId)
    .eq("uid", userId)
    .limit(MAX_BATCH_SIZE);

  if (error) {
    console.error("Error fetching folder children:", error);
    result.errors.push(`Failed to fetch contents of folder ${folderId}`);
    return;
  }

  if (!children || children.length === 0) {
    return;
  }

  // Process children in batches
  for (const child of children) {
    // Validate child structure
    if (!child.id || !child.type || child.uid !== userId) {
      result.errors.push(`Invalid or unauthorized child item in folder ${folderId}`);
      continue;
    }

    if (child.type === "file") {
      const fileResult = await deleteSingleFile(supabase, child, userId);
      result.totalBytesDeleted += fileResult.bytesDeleted;
      if (fileResult.success) {
        result.filesDeleted += 1;
      }
      if (fileResult.error) {
        result.errors.push(fileResult.error);
      }
    } else if (child.type === "folder") {
      // Recursively delete subfolder
      await deleteFolderRecursive(supabase, child.id, userId, result, depth + 1);
      
      // Delete the subfolder metadata
      const { error: deleteError } = await supabase
        .from("storage_nodes")
        .delete()
        .eq("id", child.id)
        .eq("uid", userId);

      if (deleteError) {
        console.error("Subfolder deletion error:", deleteError);
        result.errors.push(`Failed to delete folder ${child.id}`);
      } else {
        result.foldersDeleted += 1;
      }
    }
  }

  // If we hit the batch limit, there might be more children
  if (children.length === MAX_BATCH_SIZE) {
    // Recursively call again to get next batch
    await deleteFolderRecursive(supabase, folderId, userId, result, depth);
  }
}