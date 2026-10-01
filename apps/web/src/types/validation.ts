export type ValidationStatus = "awaiting_validation" | "confirmed" | "needs_review";

export const DISAGREEMENT_REASONS = [
  "Hasil AI tidak sesuai dengan observasi klinis",
  "Kualitas citra kurang meyakinkan",
  "Data pasien perlu diperbarui",
  "Memerlukan pemeriksaan/konfirmasi lebih lanjut",
  "Alasan lainnya",
] as const;

export type DisagreementReason = (typeof DISAGREEMENT_REASONS)[number];

export interface OriginalAiSnapshot {
  whoCategory: string;
  whoCategoryTitle: string;
  decision: string;
  hbGdl: number;
  confidenceLabel: string;
  recommendationTitle?: string;
  recommendationBody?: string;
  siteCount: number;
  passedQcCount: number;
}

export interface ClinicalValidationRecord {
  status: "confirmed" | "needs_review";
  reviewerName: string;
  reviewerRole: string;
  reviewerId?: string;
  validatedAt: string; // ISO date string
  formattedTimestamp: string;
  reason?: DisagreementReason | string;
  notes?: string;
  originalAiResult: OriginalAiSnapshot;
}
