import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import { apiAj } from "@/lib/arcjet-api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ parentId: string }>}
) {
  const decision = await apiAj.protect(req, { requested: 2 });
    
  if (decision.isDenied()) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    // Create server Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return redirect("/login");
    }

    // Read JSON data 
    const body = await req.json();
    const { name, description, bucketPath, bucket, mimeType, fileSize } = body;
      
    // Validate inputs
    if (!bucketPath) {
      return NextResponse.json({ error: "No bucket path provided" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "No name provided" }, { status: 400 });
    }

    if (!fileSize) {
      return NextResponse.json({ error: "No file size provided" }, { status: 400 });
    }

    // Get current storage used
    const { data: profile } = await supabase
      .from("profiles")
      .select("storage_used, max_storage")
      .eq("id", user.id)
      .single();

    const currentStorage = profile?.storage_used || 0;
    const maxStorage = profile?.max_storage; 
    const newStorage = currentStorage + fileSize;

    if (newStorage > maxStorage) {
      // Delete the file from storage since it exceeds quota
      await supabase.storage.from(bucket).remove([bucketPath]);
      return NextResponse.json({ error: "Can't add new data. Storage limit exceeded" }, { status: 400 });
    }

    // Handle NULL parent_id
    let { parentId } = await params;
    let parent_Id: string | null = parentId === 'NULL' ? null : parentId;
    
    // Run both operations in parallel (file is already uploaded)
    const [insertResult, updateResult] = await Promise.all([
      // Insert metadata
      supabase.from("storage_nodes").insert({
        uid: user.id, 
        name, 
        description, 
        type: "file",
        parent_id: parent_Id, 
        bucket,
        bucket_path: bucketPath,
        mime_type: mimeType,
        file_size: fileSize,
      }).select().single(),

      // Update storage used
      supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id)
    ]);

    if (insertResult.error) {
      // If metadata creation fails, clean up the uploaded file
      await supabase.storage.from(bucket).remove([bucketPath]);
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }

    if (updateResult.error) {
      console.error("Storage update failed:", updateResult.error);
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    // Generate embeddings in background
    generateEmbeddingsAsync(insertResult.data.id, description);

    return NextResponse.json({ data: insertResult.data }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function generateEmbeddingsAsync(nodeId: string, description: string) {
  try{
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: description,
      config: { taskType: 'SEMANTIC_SIMILARITY', outputDimensionality: 768 },
    });

    const embeddingValues = result.embeddings?.[0].values;

    // Update the record with the embedding
    const supabase = await createClient();
    await supabase
      .from("storage_nodes")
      .update({ embedded_description: embeddingValues })
      .eq("id", nodeId);
  } catch (error) {
    console.error("Embedding generation failed:", error);
  }
}