import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  let dbRecordDeleted = false;
  let originalStorageUsed = 0;

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Await and validate params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Get file metadata and verify ownership
    const { data: fileData, error: fetchError } = await supabase
      .from('temp_storage')
      .select('file_size, uid, in_bucket')
      .eq('id', trimmedId)
      .eq('uid', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("File fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to retrieve record information" },
        { status: 500 }
      );
    }

    if (!fileData) {
      return NextResponse.json(
        { error: "Record not found or access denied" },
        { status: 404 }
      );
    }

    // Double-check ownership (defense in depth)
    if (fileData.uid !== user.id) {
      console.error(`Authorization violation: User ${user.id} attempted to delete record owned by ${fileData.uid}`);
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const fileSize = fileData.file_size || 0;

    // Validate file size is reasonable
    if (fileSize < 0) {
      return NextResponse.json(
        { error: "Invalid file size" },
        { status: 400 }
      );
    }

    // Verify this is a text record (in_bucket should be 0 for text)
    if (fileData.in_bucket !== 0) {
      console.error(`Invalid operation: Attempting to delete non-text record ${trimmedId} with in_bucket=${fileData.in_bucket}`);
      return NextResponse.json(
        { error: "This endpoint only handles text records" },
        { status: 400 }
      );
    }

    // Get current storage before deletion
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("storage_used")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to retrieve user profile" },
        { status: 500 }
      );
    }

    originalStorageUsed = profile?.storage_used || 0;

    // Delete record from temp_storage
    const { error: deleteError } = await supabase
      .from('temp_storage')
      .delete()
      .eq('id', trimmedId)
      .eq('uid', user.id);

    if (deleteError) {
      console.error("Database deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete record" },
        { status: 500 }
      );
    }

    dbRecordDeleted = true;

    // Update storage usage in profile
    if (fileSize > 0) {
      const newStorage = Math.max(0, originalStorageUsed - fileSize);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used: newStorage })
        .eq("id", user.id);

      if (updateError) {
        console.error("Storage update error:", updateError);
        
        // Critical error - log for manual intervention
        console.error("CRITICAL: Storage quota not updated after deletion", {
          userId: user.id,
          recordId: trimmedId,
          originalStorage: originalStorageUsed,
          fileSize: fileSize,
          expectedNewStorage: newStorage,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: "Record deleted but storage quota update failed",
          warning: "Storage quota may be incorrect. Contact support if this persists."
        }, { status: 200 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Record deleted successfully",
      details: {
        fileSize: fileSize,
        storageFreed: fileSize
      }
    });

  } catch (error) {
    console.error("Delete error:", error);

    // If database record was deleted but storage quota wasn't updated, log critical error
    if (dbRecordDeleted && originalStorageUsed > 0) {
      console.error("CRITICAL: Database record deleted but storage quota update failed", {
        timestamp: new Date().toISOString()
      });
      // In production, you'd want a background job to reconcile storage quotas
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}