import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // Get node and verify ownership
    const { data: node, error: fetchError } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("id", id)
      .eq("uid", user.id)
      .maybeSingle();

    if (fetchError || !node) {
      return NextResponse.json(
        { error: "Item not found or access denied" },
        { status: 404 }
      );
    }

    // Collect all nodes to delete (DFS traversal)
    const nodesToDelete: any[] = [];
    const stack = [node];

    while (stack.length > 0) {
      const current = stack.pop()!;
      nodesToDelete.push(current);

      if (current.type === "folder") {
        const { data: children } = await supabase
          .from("storage_nodes")
          .select("*")
          .eq("parent_id", current.id)
          .eq("uid", user.id);

        if (children) {
          stack.push(...children);
        }
      }
    }

    // Calculate total bytes
    const totalBytes = nodesToDelete.reduce(
      (sum, n) => sum + (n.file_size || 0),
      0
    );

    // Delete storage files (only for actual files with storage)
    const storageDeletes = nodesToDelete
      .filter(n => n.type === "file" && n.bucket && n.bucket_path)
      .map(n => 
        supabase.storage.from(n.bucket).remove([n.bucket_path])
      );

    await Promise.allSettled(storageDeletes);

    // Delete all DB records in reverse order (children first)
    const nodeIds = nodesToDelete.reverse().map(n => n.id);
    const { error: deleteError } = await supabase
      .from("storage_nodes")
      .delete()
      .in("id", nodeIds)
      .eq("uid", user.id);

    if (deleteError) throw deleteError;

    // Update storage quota
    if (totalBytes > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("storage_used")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ storage_used: Math.max(0, (profile?.storage_used || 0) - totalBytes) })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      bytesFreed: totalBytes,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}