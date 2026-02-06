export type BloomLevel = 'onthouden' | 'begrijpen' | 'toepassen' | 'analyseren'
export type QuestionSource = 'manual' | 'generated' | 'imported'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type DiscriminatieLevel = 'hoog' | 'gemiddeld' | 'laag' | 'geen'
export type AmbiguiteitLevel = 'geen' | 'licht' | 'hoog'

export interface QuestionOption {
  text: string
  position: number
  is_correct?: boolean
}

export interface Exam {
  id: string
  title: string
  course: string | null
  created_by: string
  learning_goals: string[]
  analysis_status: AnalysisStatus
  question_count: number
  questions_analyzed: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  exam_id: string
  position: number
  stem: string
  options: QuestionOption[]
  correct_option: number
  bloom_level: BloomLevel | null
  learning_goal: string | null
  version: number
  source: QuestionSource
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  question_id: string
  question_version: number

  // Deterministic
  tech_kwant_longest_bias: boolean | null
  tech_kwant_homogeneity_score: number | null
  tech_kwant_absolute_terms_correct: string[]
  tech_kwant_absolute_terms_distractors: string[]
  tech_kwant_negation_detected: boolean | null
  tech_kwant_negation_emphasized: boolean | null
  tech_kwant_flags: string[]

  // Betrouwbaarheid
  bet_discriminatie: DiscriminatieLevel | null
  bet_ambiguiteit: AmbiguiteitLevel | null
  bet_score: number | null
  bet_toelichting: string | null

  // Technisch Kwalitatief
  tech_kwal_stam_score: number | null
  tech_kwal_afleiders_score: number | null
  tech_kwal_score: number | null
  tech_problemen: string[]
  tech_toelichting: string | null

  // Validiteit
  val_cognitief_niveau: BloomLevel | null
  val_score: number | null
  val_toelichting: string | null

  // Verbetervoorstellen
  improvement_suggestions: { dimensie: string; suggestie: string }[]

  created_at: string
}

export interface Material {
  id: string
  uploaded_by: string
  exam_id: string | null
  filename: string
  mime_type: string
  storage_path: string
  content_text: string | null
  chunk_count: number
  created_at: string
}

export interface GenerationJob {
  id: string
  created_by: string
  material_id: string | null
  exam_id: string | null
  specification: {
    count: number
    bloom_level: BloomLevel
    learning_goal: string
    num_options: number
  }
  status: AnalysisStatus
  result_question_ids: string[]
  error_message: string | null
  created_at: string
  completed_at: string | null
}
