import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Await params first, then access id
    const { id: theId } = await params;

    // Get the node metadata to verify ownership and get bucket info
    const { data: node, error: fetchError } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("id", theId)
      .eq("uid", user.id) // Ensure user owns this item
      .single();

    if (fetchError || !node) {
      return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });
    }

    // If it's a file, delete from storage bucket first
    if (node.type === "file" && node.bucket && node.bucket_path) {
      const { error: storageError } = await supabase.storage
        .from(node.bucket)
        .remove([node.bucket_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue anyway to delete metadata
      }
    }

    // If it's a folder, recursively delete all children
    if (node.type === "folder") {
      await deleteFolder(supabase, node.id, user.id);
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

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Helper function to recursively delete folder contents
async function deleteFolder(supabase: any, folderId: string, userId: string) {
  // Get all children of this folder
  const { data: children, error } = await supabase
    .from("storage_nodes")
    .select("*")
    .eq("parent_id", folderId)
    .eq("uid", userId);

  if (error) {
    console.error("Error fetching folder children:", error);
    return;
  }

  // Delete each child
  for (const child of children || []) {
    if (child.type === "file" && child.bucket && child.bucket_path) {
      // Delete file from storage
      await supabase.storage
        .from(child.bucket)
        .remove([child.bucket_path]);
    } else if (child.type === "folder") {
      // Recursively delete subfolder
      await deleteFolder(supabase, child.id, userId);
    }

    // Delete child metadata
    await supabase
      .from("storage_nodes")
      .delete()
      .eq("id", child.id)
      .eq("uid", userId);
  }
}