import React from 'react'

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const duration = formData.get("duration") as string;
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!duration || isNaN(parseInt(duration))) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Get current storage used
    const { data: profile } = await supabase
      .from("profiles")
      .select("storage_used")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ storage_used: profile?.storage_used || 0 }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}