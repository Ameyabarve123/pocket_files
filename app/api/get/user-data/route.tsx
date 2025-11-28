import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ 
        error: "Failed to fetch profile" 
      }, { status: 500 });
    }

    // Profile not found
    if (!profile) {
      return NextResponse.json({ 
        error: "Profile not found" 
      }, { status: 404 });
    }

    // Optional: Remove sensitive fields before returning
    // const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({ 
      user_data: profile 
    }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}