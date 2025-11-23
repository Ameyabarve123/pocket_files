import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { id: theId } = await params;

    // Get the node metadata to verify ownership
    const { data: node, error: fetchError } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("id", theId)
      .eq("uid", user.id)
      .single();

    if (fetchError || !node) {
      return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    }

    let totalBytesDeleted = 0;

    // If it's a file, delete from storage bucket
    if (node.type === "file" && node.bucket && node.bucket_path) {
      const { error: storageError } = await supabase.storage
        .from(node.bucket)
        .remove([node.bucket_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
      }

      totalBytesDeleted = node.file_size || 0;
    }

    // If it's a folder, recursively delete all children
    if (node.type === "folder") {
      totalBytesDeleted = await deleteFolder(supabase, node.id, user.id);
    }

    // Delete the metadata from database
    const { error: deleteError } = await supabase
      .from("storage_nodes")
      .delete()
      .eq("id", theId)
      .eq("uid", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Update storage once at the end
    if (totalBytesDeleted > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("storage_used")
        .eq("id", user.id)
        .single();

      const currentStorage = profile?.storage_used || 0;
      const newStorage = Math.max(0, currentStorage - totalBytesDeleted);

      await supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Helper function to recursively delete folder contents
async function deleteFolder(supabase: any, folderId: string, userId: string): Promise<number> {
  let totalBytesDeleted = 0;

  // Get all children of this folder
  const { data: children, error } = await supabase
    .from("storage_nodes")
    .select("*")
    .eq("parent_id", folderId)
    .eq("uid", userId);

  if (error) {
    console.error("Error fetching folder children:", error);
    return 0;
  }

  // Delete each child
  for (const child of children || []) {
    if (child.type === "file" && child.bucket && child.bucket_path) {
      // Delete file from storage
      await supabase.storage
        .from(child.bucket)
        .remove([child.bucket_path]);
      
      totalBytesDeleted += child.file_size || 0;
    } else if (child.type === "folder") {
      // Recursively delete subfolder
      const subfolderBytes = await deleteFolder(supabase, child.id, userId);
      totalBytesDeleted += subfolderBytes;
    }

    // Delete child metadata
    await supabase
      .from("storage_nodes")
      .delete()
      .eq("id", child.id)
      .eq("uid", userId);
  }

  return totalBytesDeleted;
}