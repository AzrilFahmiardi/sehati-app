import { ScreeningResult } from "./result";

export type ScreeningSite = "conjunctiva" | "palm" | "nail";

export type ImageQuality = "good" | "acceptable" | "poor";

export type ScreeningStatus =
  | "draft"
  | "preparing"
  | "capturing"
  | "processing"
  | "completed"
  | "inconclusive";

export interface ScreeningSiteData {
  site: ScreeningSite;
  status: "pending" | "captured" | "validated";
  imageQuality?: ImageQuality;
  imageUrl?: string;
  capturedAt?: string;
  notes?: string;
}

export interface Screening {
  id: string;
  patientId: string;
  patientName?: string;
  createdAt: string;
  status: ScreeningStatus;
  sites: Record<ScreeningSite, ScreeningSiteData>;
  result?: ScreeningResult;
  healthcareWorkerId?: string;
  notes?: string;
  captureSessionId?: string;
}
