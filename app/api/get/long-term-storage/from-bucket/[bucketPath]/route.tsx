import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ bucketPath: string }> }
) {
  console.log("GET request received for long-term storage signed URL");
  const supabase = await createClient();
  const { bucketPath } = await params;

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }
  // console.log("Generating signed URL for:", bucketPath);
  const decodedBucketPath = decodeURIComponent(bucketPath);
  const { data: signed, error: signedError } = await supabase.storage
    .from("user_files")
    .createSignedUrl(decodedBucketPath, 60); 
    
  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}