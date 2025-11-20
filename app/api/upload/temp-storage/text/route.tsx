import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
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

    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Insert into database
    const expiresAt = new Date(Date.now() + parseInt(duration) * 60000).toISOString(); // duration in minutes
    // TODO: HANDLE DURATION/EXPIRATION
    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: "text",
        file_size: 0,
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

    return NextResponse.json({
      database: dbInsert,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
