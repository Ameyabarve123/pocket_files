import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Configuration constants
const MAX_TEXT_SIZE = 10 * 1024 * 1024; // 10MB for text
const MAX_DURATION_MINUTES = 10080; // 7 days
const MIN_DURATION_MINUTES = 1;
const MAX_TEXT_LENGTH = 1000000; // 1 million characters

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let insertedId: string | null = null;

  try {
    // Check content length early
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_TEXT_SIZE) {
      return NextResponse.json(
        { error: "Text content too large" },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const text = formData.get("text") as string;
    const durationStr = formData.get("duration") as string;
    
    // Validate text exists and is a string
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Trim whitespace and validate non-empty
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    // Validate text length
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Calculate byte size (UTF-8 encoding)
    const byteSize = new Blob([trimmedText]).size;
    
    if (byteSize > MAX_TEXT_SIZE) {
      return NextResponse.json(
        { error: `Text size exceeds maximum of ${MAX_TEXT_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate duration
    if (!durationStr || durationStr.trim() === '') {
      return NextResponse.json(
        { error: "Duration is required" },
        { status: 400 }
      );
    }

    const duration = parseInt(durationStr, 10);
    if (isNaN(duration) || duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
      return NextResponse.json(
        { error: `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes` },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get current storage with error handling
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("storage_used, max_storage")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to retrieve user profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Validate storage limits
    const currentStorage = profile.storage_used || 0;
    const maxStorage = profile.max_storage;
    const newStorage = currentStorage + byteSize;

    // Check if storage limit exists and enforce it
    if (maxStorage !== null && maxStorage !== undefined) {
      if (typeof maxStorage !== 'number' || maxStorage < 0) {
        return NextResponse.json(
          { error: "Invalid storage configuration" },
          { status: 500 }
        );
      }

      if (newStorage > maxStorage) {
        const remainingStorage = maxStorage - currentStorage;
        return NextResponse.json(
          { 
            error: "Storage limit exceeded", 
            details: {
              required: byteSize,
              available: Math.max(0, remainingStorage),
              limit: maxStorage
            }
          },
          { status: 403 }
        );
      }
    }
    // If maxStorage is null, unlimited storage is allowed

    // Calculate expiration
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString();
    
    // Insert into database
    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: "text",
        file_size: byteSize,
        file_type: "text/plain",
        data: trimmedText,
        in_bucket: 0,
        expires_at: expiresAt,
        bucket_file_path: null
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save text" },
        { status: 500 }
      );
    }

    insertedId = dbInsert.id;

    // Update storage in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ storage_used: newStorage })
      .eq("id", user.id);

    if (updateError) {
      console.error("Storage update error:", updateError);
      
      // Rollback: Delete database entry
      await supabase
        .from("temp_storage")
        .delete()
        .eq("id", insertedId);
      
      return NextResponse.json(
        { error: "Failed to update storage quota" },
        { status: 500 }
      );
    }

    // Clear insertedId since operation succeeded
    insertedId = null;

    return NextResponse.json({
      success: true,
      text: {
        id: dbInsert.id,
        size: byteSize,
        characterCount: trimmedText.length,
        expiresAt: expiresAt
      }
    }, { status: 201 });

  } catch (err) {
    console.error("Text storage error:", err);
    
    // Cleanup database entry if it exists
    if (insertedId) {
      try {
        await supabase
          .from("temp_storage")
          .delete()
          .eq("id", insertedId);
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}