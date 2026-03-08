import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();
    const { uuid, email, template_code, data } = body;

    if (!uuid || !email || !template_code || !data) {
      return NextResponse.json(
        { error: "uuid, email, template_code, and data are required." },
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
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 }
      );
    }

    if (
      template.owner_email !== email ||
      template.template_code !== template_code
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Ownership verification failed." },
        { status: 403 }
      );
    }

    // Update the template data
    console.log("[template/update] Updating template", uuid, "with data keys:", Object.keys(data));
    if (data.memories) {
      console.log("[template/update] Memories:", data.memories.map((m: { text: string; photo: string }) => ({
        text: m.text?.substring(0, 30),
        photo: m.photo || "(none)",
      })));
    }
    
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", uuid);

    if (updateError) {
      console.error("[template/update] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update template." },
        { status: 500 }
      );
    }

    console.log("[template/update] Update successful for", uuid);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
