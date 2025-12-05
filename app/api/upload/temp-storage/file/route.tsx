import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(req: NextRequest) {
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return redirect("/login");
    }

    // Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const duration = formData.get("duration") as string;
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
    const newStorage = currentStorage + file.size;

    if (newStorage > maxStorage) {
      return NextResponse.json({ error: "Can't add new data. Storage limit exceeded" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const bucket_file_path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("temporary_storage")
      .upload(bucket_file_path, file, {
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert into database
    const expiresAt = new Date(Date.now() + parseInt(duration) * 60000).toISOString(); // duration in minutes
    
    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        data: uploadData.path, // Storage path
        in_bucket: 1,
        expires_at: expiresAt,
        bucket_file_path: bucket_file_path
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Update storage in profile
    await supabase
    .from("profiles")
    .update({ 
      storage_used: newStorage
    })
    .eq("id", user.id);

    return NextResponse.json({
      storage: uploadData,
      database: dbInsert,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}