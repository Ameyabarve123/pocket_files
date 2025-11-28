import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Configuration constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION_MINUTES = 10080; // 7 days
const MIN_DURATION_MINUTES = 1;
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/zip', 'application/json',
  'video/mp4', 'audio/mpeg'
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  let uploadedPath: string | null = null;

  try {
    // Read form data with size limit check
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed size" },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const durationStr = formData.get("duration") as string;
    
    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Sanitize filename - remove path traversal attempts and dangerous characters
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, 255);

    if (!sanitizedFileName) {
      return NextResponse.json(
        { error: "Invalid filename" },
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
    const newStorage = currentStorage + file.size;

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
              required: file.size,
              available: Math.max(0, remainingStorage),
              limit: maxStorage
            }
          },
          { status: 403 }
        );
      }
    }
    // If maxStorage is null, unlimited storage is allowed

    // Generate secure file path with UUID
    const fileId = crypto.randomUUID();
    const bucketFilePath = `${user.id}/${fileId}-${sanitizedFileName}`;
    uploadedPath = bucketFilePath;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("temporary_storage")
      .upload(bucketFilePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString();
    
    // Insert into database with transaction-like behavior
    const { data: dbInsert, error: dbError } = await supabase
      .from("temp_storage")
      .insert({
        uid: user.id,
        file_name: sanitizedFileName,
        file_size: file.size,
        file_type: file.type,
        data: uploadData.path,
        in_bucket: 1,
        expires_at: expiresAt,
        bucket_file_path: bucketFilePath
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      
      // Rollback: Delete uploaded file
      await supabase.storage
        .from("temporary_storage")
        .remove([bucketFilePath]);
      
      return NextResponse.json(
        { error: "Failed to save file metadata" },
        { status: 500 }
      );
    }

    // Update storage in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ storage_used: newStorage })
      .eq("id", user.id);

    if (updateError) {
      console.error("Storage update error:", updateError);
      
      // Rollback: Delete file and database entry
      await supabase.storage
        .from("temporary_storage")
        .remove([bucketFilePath]);
      
      await supabase
        .from("temp_storage")
        .delete()
        .eq("id", dbInsert.id);
      
      return NextResponse.json(
        { error: "Failed to update storage quota" },
        { status: 500 }
      );
    }

    // Clear the uploadedPath since operation succeeded
    uploadedPath = null;

    return NextResponse.json({
      success: true,
      file: {
        id: dbInsert.id,
        name: sanitizedFileName,
        size: file.size,
        type: file.type,
        expiresAt: expiresAt
      }
    }, { status: 201 });

  } catch (err) {
    console.error("Upload error:", err);
    
    // Cleanup uploaded file if it exists
    if (uploadedPath) {
      try {
        await supabase.storage
          .from("temporary_storage")
          .remove([uploadedPath]);
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