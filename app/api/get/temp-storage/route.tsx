import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

const MAX_SIGNED_URL_DURATION = 60 * 24; // 24 hours in minutes
const DEFAULT_DURATION = 5; // 5 minutes

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

    const { data: dbRows, error: dbError } = await supabase
      .from("temp_storage")
      .select("*")
      .eq("uid", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to fetch storage items" }, { status: 500 });
    }

    // For each DB row, generate a signed URL for the file
    const results = await Promise.all(
      dbRows.map(async (row) => {
        if (row.in_bucket === 1) {
          try {
            // Validate the bucket path belongs to this user
            if (!row.data.startsWith(`${user.id}/`)) {
              console.error(`Security violation: User ${user.id} attempted to access path ${row.data}`);
              return {
                ...row,
                data: null,
                error: "Access denied"
              };
            }

            // Validate and sanitize duration
            let durationMinutes = Number(row.duration);
            if (isNaN(durationMinutes) || durationMinutes <= 0) {
              durationMinutes = DEFAULT_DURATION;
            }
            if (durationMinutes > MAX_SIGNED_URL_DURATION) {
              durationMinutes = MAX_SIGNED_URL_DURATION;
            }

            const { data: signed, error: signedError } = await supabase.storage
              .from("temporary_storage")
              .createSignedUrl(row.data, 60 * durationMinutes);

            if (signedError) {
              console.error(`Failed to generate signed URL for row ${row.id}:`, signedError);
              return {
                ...row,
                data: null,
                error: "Failed to generate URL"
              };
            }

            return {
              ...row,
              data: signed.signedUrl,
            };
          } catch (error) {
            console.error(`Error processing row ${row.id}:`, error);
            return {
              ...row,
              data: null,
              error: "Processing error"
            };
          }
        }

        return row;
      })
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Get temp storage error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}