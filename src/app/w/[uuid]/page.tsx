import { getSupabaseServer } from "@/lib/supabaseServer";
import type { TemplateData } from "@/lib/types";
import { notFound } from "next/navigation";
import ShareableTemplate from "./ShareableTemplate";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ShareablePage({ params }: PageProps) {
  const { uuid } = await params;
  const supabase = getSupabaseServer();

  const { data: template, error } = await supabase
    .from("projects")
    .select("data, is_published")
    .eq("id", uuid)
    .eq("is_published", true)
    .single();

  if (error || !template) {
    notFound();
  }

  const templateData = template.data as TemplateData;

  // Clean up any stale local photo paths — only keep http(s) URLs
  if (templateData.memories) {
    templateData.memories = templateData.memories.map(m => ({
      ...m,
      photo: m.photo && m.photo.startsWith("http") ? m.photo : "",
    }));
  }

  return <ShareableTemplate data={templateData} />;
}
