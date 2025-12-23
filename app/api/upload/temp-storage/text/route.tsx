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
    const text = formData.get("text") as string;
    const duration = formData.get("duration") as string;
    console.log("Uploading text:", text, "for duration:", duration);
    
    // Validate inputs
    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!duration || isNaN(parseInt(duration))) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const byteSize = new Blob([text]).size;

    // Get current storage used
    const { data: profile } = await supabase
      .from("profiles")
      .select("storage_used, max_storage")
      .eq("id", user.id)
      .single();

    const currentStorage = profile?.storage_used || 0;
    const maxStorage = profile?.max_storage;
    const newStorage = currentStorage + byteSize;

    if (newStorage > maxStorage) {
      return NextResponse.json({ error: "Can't add new data. Storage limit exceeded" }, { status: 400 });
    }

    // Insert into database
    const expiresAt = new Date(Date.now() + parseInt(duration) * 60000).toISOString(); // duration in minutes
    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: "text",
        file_size: byteSize,
        file_type: "text",
        data: text, 
        in_bucket: 0,
        expires_at: expiresAt,
        bucket_file_path: null
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
      database: dbInsert,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}