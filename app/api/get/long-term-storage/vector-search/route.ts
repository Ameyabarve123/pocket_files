import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {

  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return redirect("/login");
    }

    // Extract text from ?query=...
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Missing 'query' parameter" },
        { status: 400 }
      );
    }

    // Generate embedding
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: query,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      },
    });

    const embeddingValues = result?.embeddings?.[0]?.values;
    // console.log("Generated embedding:", embeddingValues);

    if (!embeddingValues) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    const vectorString = JSON.stringify(embeddingValues);

    const { data: documents, error } = await supabase.rpc('match_documents2', {
      query_embedding: vectorString, 
      match_threshold: 0.3, 
      match_count: 10, 
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: documents });
  } catch (error) {
    console.error("Get error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
