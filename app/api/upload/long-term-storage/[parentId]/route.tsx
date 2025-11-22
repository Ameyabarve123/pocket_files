import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }>}
) {
  try {
    // Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
      
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "No name provided" }, { status: 400 });
    }

    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const bucket = "user_files";
    const bucketPath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

    // Handle NULL parent_id
    let { parentId } = await params;
    let parent_Id: string | null = parentId;
    
    if (parentId === 'NULL') {
      parent_Id = null;
    }

    // 1. Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(bucketPath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Insert metadata
    const { data, error } = await supabase
      .from("storage_nodes")
      .insert({
        uid: user.id, 
        name: name, 
        description: description, 
        type: "file",
        parent_id: parent_Id, 
        bucket,
        bucket_path: bucketPath,
        mime_type: file.type,
        file_size: file.size
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}