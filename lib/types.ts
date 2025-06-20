export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  plan_type: "free" | "pro" | "premium"
  word_count_limit: number
  documents_limit: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  file_name?: string
  file_size?: number
  file_type?: string
  word_count: number
  char_count: number
  language: string
  created_at: string
  updated_at: string
}

export interface CarouselProject {
  id: string
  user_id: string
  title: string
  description?: string
  template_id?: string
  document_id?: string
  template_type?: "NEWS" | "STORY" | "PRODUCT"
  status: "draft" | "in_progress" | "completed" | "archived"
  target_audience?: string
  platform_settings?: Record<string, any>
  created_at: string
  updated_at: string
  slides?: Slide[]
  brand_voice_templates?: BrandVoiceTemplate
  documents?: Document
}

export interface Slide {
  id: string
  project_id: string
  slide_number: number
  title?: string
  content: string
  char_count: number
  tone?: string
  hashtags?: string[]
  image_description?: string
  variations?: string | any[] // JSON string or parsed array of content variations
  selectedVariationId?: string
  created_at: string
  updated_at: string
}

export interface BrandVoiceTemplate {
  id: string
  created_by: string
  name: string
  description?: string
  voice_profile: {
    tone: string
    style: string
    guidelines: string[]
    max_chars?: number
    hashtag_count?: number
  }
  is_public: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  preferences: {
    theme?: "light" | "dark"
    language?: string
    auto_save?: boolean
    spell_check?: boolean
  }
  notification_settings: {
    email_notifications?: boolean
    push_notifications?: boolean
    weekly_reports?: boolean
  }
  created_at: string
  updated_at: string
}

export interface ReadabilityScore {
  score: number
  level: string
  suggestions: string[]
}

export interface GrammarIssue {
  id: string
  type: "grammar" | "spelling" | "style"
  severity: "low" | "medium" | "high"
  message: string
  start: number
  end: number
  originalText: string
  suggestions: string[]
  explanation?: string
}

export interface GrammarCheckResponse {
  issues: GrammarIssue[]
  correctedText?: string
  summary: {
    totalIssues: number
    grammarIssues: number
    spellingIssues: number
    styleIssues: number
  }
}

export interface StyleSuggestion {
  id: string
  type: "emphasis" | "hashtag" | "emoji" | "mention" | "structure"
  suggestion: string
  original: string
  reason: string
  confidence: number
  position?: { start: number; end: number }
}
