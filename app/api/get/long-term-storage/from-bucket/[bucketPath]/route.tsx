import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bucketPath: string }> }
) {
  const supabase = await createClient();
  const { bucketPath } = await params;

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  // Decode and validate the bucket path
  const decodedBucketPath = decodeURIComponent(bucketPath);

  // 1. Validate format: should start with user's ID
  if (!decodedBucketPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ 
      error: "Access denied - invalid path" 
    }, { status: 403 });
  }

  // 2. Prevent path traversal attacks
  if (decodedBucketPath.includes('..') || decodedBucketPath.includes('//')) {
    return NextResponse.json({ 
      error: "Invalid path format" 
    }, { status: 400 });
  }

  // 3. Verify the file exists and belongs to the user (optional but recommended)
  const { data: node } = await supabase
    .from("storage_nodes")
    .select("id")
    .eq("bucket_path", decodedBucketPath)
    .eq("uid", user.id)
    .single();

  if (!node) {
    return NextResponse.json({ 
      error: "File not found or access denied" 
    }, { status: 404 });
  }

  // 4. Create signed URL
  const { data: signed, error: signedError } = await supabase.storage
    .from("user_files")
    .createSignedUrl(decodedBucketPath, 3600);

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}