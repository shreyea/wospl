export interface TemplateStat {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  emoji: string;
  color: string;
  displayText?: string;
}

export interface TemplateSuperpower {
  text: string;
  icon: string;
}

export interface TemplateMemory {
  text: string;
  doodle: string;
  photo: string;
}

export interface TemplateData {
  herName: string;
  heroHeadline: string;
  heroSubtext: string;
  heroLoading: string;
  heroPhotos?: string[];
  stats: TemplateStat[];
  superpowers: TemplateSuperpower[];
  memories: TemplateMemory[];
  appreciationResult: string;
  finalMessage: string;
  personalNote: string;
}

export interface TemplateRow {
  id: string;
  uuid: string;
  owner_email: string;
  template_code: string;
  data: TemplateData;
  is_published: boolean;
  slug: string | null;
  template_type: string;
  created_at: string;
  updated_at: string;
}
