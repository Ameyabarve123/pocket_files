import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }> } // Remove | null, it's a string in the URL
) {
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Await params and get parentId
    const { parentId } = await params;

    // Handle NULL string or 'root' as null
    const actualParentId = parentId === 'NULL' || parentId === 'root' ? null : parentId;

    // Get all items in this folder
    const { data, error } = await supabase
      .from("storage_nodes")
      .select("*")
      .eq("uid", user.id)
      .is("parent_id", actualParentId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }); // Wrap in object for consistency

  } catch (error) {
    console.error("Get error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}