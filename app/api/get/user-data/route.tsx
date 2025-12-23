import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

export async function GET(req: NextRequest) {
  const decision = await apiAj.protect(req, { requested: 2 });
    
  if (decision.isDenied()) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return redirect("/login");
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