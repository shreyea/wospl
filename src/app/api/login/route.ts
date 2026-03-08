import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json();
    const { email, template_code } = body;

    if (!email || !template_code) {
      return NextResponse.json(
        { error: "Email and template_code are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, owner_email, template_code")
      .eq("owner_email", email)
      .eq("template_code", template_code)
      .eq("template_type", "women")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid email or template code." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      uuid: data.id, // Return as uuid for frontend compatibility
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
