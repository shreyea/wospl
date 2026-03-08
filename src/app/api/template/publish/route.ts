import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();
    const { uuid, email, template_code } = body;

    if (!uuid || !email || !template_code) {
      return NextResponse.json(
        { error: "uuid, email, and template_code are required." },
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

    // Publish the template
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", uuid);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to publish template." },
        { status: 500 }
      );
    }

    const shareLink = `/w/${uuid}`;

    return NextResponse.json({
      success: true,
      shareLink,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
