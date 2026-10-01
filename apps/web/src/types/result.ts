export type AnemiaRisk = "low" | "moderate" | "high" | "inconclusive";

export type HealthcareDecision =
  | "confirmed_lab_needed"
  | "monitoring_only"
  | "immediate_referral"
  | "routine_followup";

export interface ScreeningResult {
  riskLevel: AnemiaRisk;
  /** Estimated Hb value in g/dL derived from AI screening model. NOT a laboratory diagnosis. */
  estimatedHb: number;
  confidence: number; // e.g. 0.88 for 88%
  recommendation: string;
  clinicalInterpretation: string;
  requiresConfirmation: boolean; // Flag to indicate confirmatory lab Hb testing is needed
  decisionNotes?: string;
  healthcareDecision?: HealthcareDecision;
  evaluatedAt: string;
}
