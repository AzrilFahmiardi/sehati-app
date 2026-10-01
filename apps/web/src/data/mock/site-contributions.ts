import { ScreeningSite } from "@/types/screening";

export interface SiteContribution {
  site: ScreeningSite;
  weight: number; // 0-1, sum to 1
  hbEstimate: number; // per-site Hb
  confidence: number; // per-site confidence 0-1
}

// Dummy data for initial implementation
export const MOCK_SITE_CONTRIBUTIONS: SiteContribution[] = [
  {
    site: "conjunctiva",
    weight: 0.6,
    hbEstimate: 11.2,
    confidence: 0.85,
  },
  {
    site: "nail",
    weight: 0.25,
    hbEstimate: 10.8,
    confidence: 0.72,
  },
  {
    site: "palm",
    weight: 0.15,
    hbEstimate: 11.5,
    confidence: 0.65,
  },
];
