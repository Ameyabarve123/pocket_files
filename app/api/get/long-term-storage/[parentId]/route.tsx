import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Configuration constants
const VALID_PARENT_ALIASES = ['NULL', 'root', 'null'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }> }
) {
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await params and get parentId
    const resolvedParams = await params;
    const { parentId } = resolvedParams;

    // Validate parentId format
    if (!parentId || typeof parentId !== 'string') {
      return NextResponse.json(
        { error: "Invalid parent ID" },
        { status: 400 }
      );
    }

    const trimmedParentId = parentId.trim();

    // Check for empty string
    if (trimmedParentId === '') {
      return NextResponse.json(
        { error: "Parent ID cannot be empty" },
        { status: 400 }
      );
    }

    // Handle NULL string or 'root' as null
    const isRootRequest = VALID_PARENT_ALIASES.includes(trimmedParentId);
    const actualParentId = isRootRequest ? null : trimmedParentId;

    // If not root request, validate UUID format
    if (!isRootRequest) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(trimmedParentId)) {
        return NextResponse.json(
          { error: "Invalid parent ID format" },
          { status: 400 }
        );
      }

      // Verify the parent folder exists and belongs to the user
      const { data: parentFolder, error: parentError } = await supabase
        .from("storage_nodes")
        .select("id, uid, type")
        .eq("id", actualParentId)
        .eq("uid", user.id)
        .maybeSingle();

      if (parentError) {
        console.error("Parent folder check error:", parentError);
        return NextResponse.json(
          { error: "Failed to verify parent folder" },
          { status: 500 }
        );
      }

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found or access denied" },
          { status: 404 }
        );
      }

      // Verify it's actually a folder
      if (parentFolder.type !== 'folder') {
        return NextResponse.json(
          { error: "Parent ID does not refer to a folder" },
          { status: 400 }
        );
      }
    }

    // Get all items in this folder
    const { data, error } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("uid", user.id)
      .is("parent_id", actualParentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve folder contents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      metadata: {
        count: data?.length || 0,
        parentId: actualParentId,
        isRoot: isRootRequest
      }
    });

  } catch (error) {
    console.error("Get folder contents error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}