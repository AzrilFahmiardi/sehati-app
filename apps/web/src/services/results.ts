import { MOCK_SCREENINGS } from "@/data/mock/screenings";
import { ScreeningResult } from "@/types/result";

export async function getLatestResultForPatient(patientId: string): Promise<ScreeningResult | null> {
  const patientScreenings = MOCK_SCREENINGS.filter(
    (s) => s.patientId === patientId && s.result
  );
  if (patientScreenings.length === 0) return Promise.resolve(null);
  return Promise.resolve(patientScreenings[0].result || null);
}
