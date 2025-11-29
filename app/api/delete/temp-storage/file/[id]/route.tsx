import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Get file info including bucket_path
  const { data: fileData, error: fetchError } = await supabase
    .from('temp_storage')
    .select('file_size, bucket_file_path')
    .eq('id', id)
    .eq('uid', user.id)
    .single();

  if (fetchError || !fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileSize = fileData?.file_size || 0;
  const bucketPath = fileData?.bucket_file_path;

  // Delete record from temp_storage
  const { error: deleteError } = await supabase
    .from('temp_storage')
    .delete()
    .eq('id', id)
    .eq('uid', user.id);
  
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Delete file from storage using bucket_path from database
  if (bucketPath) {
    const { error } = await supabase
      .storage
      .from('temporary_storage')
      .remove([bucketPath]);
    
    if (error) {
      console.error("Storage deletion error:", error);
      // Don't return error - file metadata is already deleted
    }
  }

  // Update storage usage in profile
  if (fileSize > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("storage_used")
      .eq("id", user.id)
      .single();

    const currentStorage = profile?.storage_used || 0;
    const newStorage = Math.max(0, currentStorage - fileSize);

    await supabase
      .from("profiles")
      .update({ storage_used: newStorage })
      .eq("id", user.id);
  }

  return NextResponse.json({ 
    success: true,
    message: "Record deleted successfully" 
  });
}