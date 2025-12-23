import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { apiAj } from "@/lib/arcjet-api";

export async function DELETE(req: NextRequest) {
  try {
    const decision = await apiAj.protect(req, { requested: 2 });
    
    if (decision.isDenied()) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return redirect("/login");
    }

    // 1. Get all user's files to delete from storage
    const { data: files } = await supabase
      .from("storage_nodes")
      .select("bucket, bucket_path")
      .eq("uid", user.id)
      .eq("type", "file");

    // 2. Delete all files from storage buckets
    if (files && files.length > 0) {
      const filesByBucket: { [key: string]: string[] } = {};
      
      files.forEach(file => {
        if (file.bucket && file.bucket_path) {
          if (!filesByBucket[file.bucket]) {
            filesByBucket[file.bucket] = [];
          }
          filesByBucket[file.bucket].push(file.bucket_path);
        }
      });

      for (const [bucket, paths] of Object.entries(filesByBucket)) {
        await supabase.storage.from(bucket).remove(paths);
      }
    }

    // 3. Delete all storage_nodes records
    await supabase
      .from("storage_nodes")
      .delete()
      .eq("uid", user.id);

    // 4. Delete temp storage files
    const { data: tempFiles } = await supabase
      .from("temp_storage")
      .select("bucket_file_path")
      .eq("uid", user.id)
      .eq("in_bucket", 1);

    if (tempFiles && tempFiles.length > 0) {
      const tempPaths = tempFiles.map(f => f.bucket_file_path).filter(Boolean);
      if (tempPaths.length > 0) {
        await supabase.storage.from("temporary_storage").remove(tempPaths);
      }
    }

    // 5. Delete temp storage records
    await supabase
      .from("temp_storage")
      .delete()
      .eq("uid", user.id);

    // 6. Delete profile
    await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // 7. Delete profile picture
    const filePath = `${user.id}/profile`;
    const { data, error } = await supabase
      .storage
      .from("profile_images")
      .remove([filePath])
    
    if (error) {
      return NextResponse.json({ error: "Failed to delete pfp" }, { status: 500});
    }

    // 8. Delete auth user using admin client
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}