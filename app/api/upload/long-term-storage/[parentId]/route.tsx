import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Configuration constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'video/mp4',
  'audio/mpeg'
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }>}
) {
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
      
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 255) {
      return NextResponse.json({ error: "Name is too long (max 255 characters)" }, { status: 400 });
    }

    // Validate file
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Get parent_id and validate
    const { parentId } = await params;
    let parent_Id: string | null = null;
    
    if (parentId !== 'NULL') {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(parentId)) {
        return NextResponse.json({ error: "Invalid parent ID format" }, { status: 400 });
      }

      // Verify parent exists and belongs to user
      const { data: parentFolder, error: parentError } = await supabase
        .from("storage_nodes")
        .select("id, type")
        .eq("id", parentId)
        .eq("uid", user.id)
        .eq("type", "folder")
        .single();

      if (parentError || !parentFolder) {
        return NextResponse.json({ 
          error: "Parent folder not found or access denied" 
        }, { status: 404 });
      }

      parent_Id = parentId;
    }

    // Get current storage used
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("storage_used, max_storage")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ 
        error: "Failed to fetch user profile" 
      }, { status: 500 });
    }

    const currentStorage = profile?.storage_used || 0;
    const maxStorage = profile?.max_storage || 0;
    const newStorage = currentStorage + file.size;

    // Check storage limit
    if (newStorage > maxStorage) {
      return NextResponse.json({ 
        error: "Storage limit exceeded. Please upgrade your plan or delete some files." 
      }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${crypto.randomUUID()}-${sanitizedFileName}`;
    const bucket = "user_files";
    const bucketPath = `${user.id}/${uniqueFileName}`;

    // 1. Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(bucketPath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ 
        error: "Failed to upload file" 
      }, { status: 500 });
    }

    // 2. Insert metadata
    const { data, error: insertError } = await supabase
      .from("storage_nodes")
      .insert({
        uid: user.id, 
        name: name.trim(), 
        description: description?.trim() || null, 
        type: "file",
        parent_id: parent_Id, 
        bucket,
        bucket_path: bucketPath,
        mime_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Metadata insert error:", insertError);
      
      // Rollback: Delete uploaded file
      await supabase.storage
        .from(bucket)
        .remove([bucketPath]);

      return NextResponse.json({ 
        error: "Failed to save file metadata" 
      }, { status: 500 });
    }

    // 3. Update storage in profile (atomic operation would be better)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        storage_used: newStorage
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Storage update error:", updateError);
      // Note: File is uploaded but storage quota not updated
      // Consider implementing a cleanup job or retry mechanism
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}