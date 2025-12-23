import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }> } 
) {
  const decision = await apiAj.protect(req, { requested: 2 });
    
  if (decision.isDenied()) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return redirect("/login");
    }

    // Await params and get parentId
    const { parentId } = await params;

    // Handle NULL string or 'root' as null
    const actualParentId = parentId === 'NULL' || parentId === 'root' ? null : parentId;

    // Get all items in this folder
    const { data, error } = await supabase
      .from("storage_nodes")
      .select("id, name, type, parent_id, bucket, bucket_path, mime_type, file_size, created_at, description")
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