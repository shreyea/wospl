import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

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

    const { data: template, error } = await supabase
      .from("projects")
      .select("data, is_published, owner_email, template_code")
      .eq("id", uuid)
      .eq("owner_email", email)
      .eq("template_code", template_code)
      .eq("template_type", "women")
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template.data,
      is_published: template.is_published,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
