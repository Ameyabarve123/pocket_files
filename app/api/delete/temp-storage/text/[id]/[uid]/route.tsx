import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string} }
) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  // Delete record from temp_storage and file from storage
  const { id } = await params;
  
  const { data: deleteData, error: deleteError } = await supabase
  .from('temp_storage')
  .delete()
  .eq('id', id)
  .eq('uid', user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Record deleted" });
}
