import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("temporary_storage")
      .upload(`${user.id}/${file.name}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Insert into database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +24h expiration

    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        data: uploadData?.path || null, // Storage path
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      storage: uploadData,
      database: dbInsert,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
