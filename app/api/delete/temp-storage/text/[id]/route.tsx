import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string}> }
) {
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
  
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    return redirect("/login");
  }

  const { id } = await params;
  
  // Get file size before deleting
  const { data: fileData, error: fetchError } = await supabase
    .from('temp_storage')
    .select('file_size')
    .eq('id', id)
    .eq('uid', user.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  const fileSize = fileData?.file_size || 0;

  // Delete record from temp_storage
  const { error: deleteError } = await supabase
    .from('temp_storage')
    .delete()
    .eq('id', id)
    .eq('uid', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
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