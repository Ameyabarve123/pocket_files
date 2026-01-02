// app/api/view-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { gunzipSync } from 'fflate';
import { apiAj } from "@/lib/arcjet-api";

// No authentication middleware - publicly accessible
export async function GET(req: NextRequest) {
  const decision = await apiAj.protect(req, { requested: 2 });
    
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return Response.json({ error: "Rate limit hit" }, { status: 429 });
    }
    
    if (decision.reason.isBot()) {
      return Response.json({ error: "Bot detected" }, { status: 403 });
    }
    
    // Fallback for other denial reasons
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return redirect("/login");
    }

    const signedUrl = req.nextUrl.searchParams.get('url');
    const contentType = req.nextUrl.searchParams.get('type') || 'image/jpeg';

    if (!signedUrl) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    // Fetch from the signed URL - anyone can do this if they have the URL
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Link expired or invalid' }, { status: response.status });
    }

    const compressedBlob = await response.blob();
    const compressedBuffer = new Uint8Array(await compressedBlob.arrayBuffer());
    const decompressed = gunzipSync(compressedBuffer);

    return new NextResponse(Buffer.from(decompressed), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}