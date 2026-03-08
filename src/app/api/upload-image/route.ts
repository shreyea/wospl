import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uuid = formData.get("uuid") as string | null;
    const email = formData.get("email") as string | null;
    const templateCode = formData.get("template_code") as string | null;
    const currentImageCount = parseInt(
      (formData.get("image_count") as string) || "0",
      10
    );

    console.log("[upload-image] Request received:", {
      hasFile: !!file,
      uuid,
      email,
      fileType: file?.type,
      fileSize: file?.size,
      currentImageCount,
    });

    if (!file || !uuid || !email || !templateCode) {
      console.log("[upload-image] Missing required fields");
      return NextResponse.json(
        { error: "file, uuid, email, and template_code are required." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log("[upload-image] Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("[upload-image] File too large:", file.size);
      return NextResponse.json(
        { error: "File size must be under 1MB." },
        { status: 400 }
      );
    }

    // Check existing image count from data JSON (sent by frontend)
    if (currentImageCount >= MAX_IMAGES) {
      console.log("[upload-image] Max images reached:", currentImageCount);
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed.` },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: template, error: fetchError } = await supabase
      .from("projects")
      .select("id, owner_email, template_code")
      .eq("id", uuid)
      .single();

    if (fetchError || !template) {
      console.log("[upload-image] Template not found:", fetchError?.message);
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 }
      );
    }

    if (
      template.owner_email !== email ||
      template.template_code !== templateCode
    ) {
      console.log("[upload-image] Ownership verification failed");
      return NextResponse.json(
        { error: "Unauthorized. Ownership verification failed." },
        { status: 403 }
      );
    }

    // Generate unique filename using timestamp
    const filePath = `${uuid}/image-${Date.now()}.webp`;
    console.log("[upload-image] Uploading to path:", filePath);

    // Convert to Buffer for server-side Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-image] Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image: " + uploadError.message },
        { status: 500 }
      );
    }

    console.log("[upload-image] Upload success:", uploadData);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("user-images").getPublicUrl(filePath);

    console.log("[upload-image] Public URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err) {
    console.error("[upload-image] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
