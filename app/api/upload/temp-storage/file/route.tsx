import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

export async function POST(req: NextRequest) {
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

    // Read JSON data 
    const body = await req.json();
    const { fileName, fileSize, fileType, bucketFilePath, duration } = body;
    
    // Validate inputs
    if (!bucketFilePath) {
      return NextResponse.json({ error: "No bucket path provided" }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: "No file name provided" }, { status: 400 });
    }

    if (!fileSize) {
      return NextResponse.json({ error: "No file size provided" }, { status: 400 });
    }

    if (!duration || isNaN(parseInt(duration))) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Get current storage used
    const { data: profile } = await supabase
      .from("profiles")
      .select("storage_used, max_storage")
      .eq("id", user.id)
      .single();

    const currentStorage = profile?.storage_used || 0;
    const maxStorage = profile?.max_storage;
    const newStorage = currentStorage + fileSize;

    if (newStorage > maxStorage) {
      // Delete the file from storage since it exceeds quota
      await supabase.storage.from("temporary_storage").remove([bucketFilePath]);
      return NextResponse.json({ error: "Can't add new data. Storage limit exceeded" }, { status: 400 });
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + parseInt(duration) * 60000).toISOString(); // duration in minutes
    
    // Run both operations in parallel  
    const [dbInsert, updateResult] = await Promise.all([
      // Insert into database
      supabase
        .from("temp_storage")
        .insert({
          uid: user.id,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          data: bucketFilePath, // Storage path
          in_bucket: 1,
          expires_at: expiresAt,
          bucket_file_path: bucketFilePath
        })
        .select()
        .single(),

      // Update storage in profile
      supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id)
    ]);

    if (dbInsert.error) {
      // If metadata creation fails, clean up the uploaded file
      await supabase.storage.from("temporary_storage").remove([bucketFilePath]);
      return NextResponse.json({ error: dbInsert.error.message }, { status: 500 });
    }

    if (updateResult.error) {
      console.error("Storage update failed:", updateResult.error);
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      storage: { path: bucketFilePath },
      database: dbInsert.data,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}