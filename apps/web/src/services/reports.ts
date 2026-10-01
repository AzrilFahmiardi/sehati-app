import { MOCK_SCREENINGS } from "@/data/mock/screenings";

export interface ClinicalReportSummary {
  totalScreenings: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  highRiskCount: number;
  inconclusiveCount: number;
  averageEstimatedHb: number;
}

export async function getReportSummary(): Promise<ClinicalReportSummary> {
  const total = MOCK_SCREENINGS.length;
  let low = 0,
    mod = 0,
    high = 0,
    inc = 0,
    sumHb = 0;

  MOCK_SCREENINGS.forEach((s) => {
    if (s.result) {
      if (s.result.riskLevel === "low") low++;
      if (s.result.riskLevel === "moderate") mod++;
      if (s.result.riskLevel === "high") high++;
      if (s.result.riskLevel === "inconclusive") inc++;
      sumHb += s.result.estimatedHb;
    }
  });

  return Promise.resolve({
    totalScreenings: total,
    lowRiskCount: low,
    moderateRiskCount: mod,
    highRiskCount: high,
    inconclusiveCount: inc,
    averageEstimatedHb: total > 0 ? Number((sumHb / total).toFixed(1)) : 0,
  });
}
