import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const { data: dbRows, error: dbError } = await supabase
    .from("temp_storage")
    .select("*")
    .eq("uid", user.id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // For each DB row, generate a signed URL for the file
  const results = await Promise.all(
    dbRows.map(async (row) => {
      // If there is a file path, generate a signed URL
      let signedUrl = null;

      if (row.in_bucket === 1) {
        const durationMinutes = Number(row.duration) || 5;
        const { data: signed, error: signedError } = await supabase.storage
          .from("temporary_storage")
          .createSignedUrl(row.data, 60 * durationMinutes); // URL valid for duration in minutes

        if (signedError) {
          throw new Error(`Failed to generate signed URL: ${signedError.message}`);
        }

        return {
          ...row,
          data: signed.signedUrl,
        };
      }

      return row;
    })
  );

  return NextResponse.json(results);
}
