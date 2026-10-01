export type ExplanationAudience = "nakes" | "pasien";
export type ExplanationStatus = "generated" | "fallback" | "unavailable";

export interface ScreeningExplanationContent {
  headline: string;
  summary: string;
  what_this_means: string;
  evidence: string[];
  next_steps: string[];
  warning_signs: string[];
  questions_for_healthcare_worker: string[];
  limitations: string[];
  clinical_note?: string;
}

export interface ScreeningExplanation {
  screeningId: string;
  audience: ExplanationAudience;
  locale: string;
  status: ExplanationStatus;
  model: string | null;
  promptVersion: string;
  content: ScreeningExplanationContent;
  generatedAt: string;
}
