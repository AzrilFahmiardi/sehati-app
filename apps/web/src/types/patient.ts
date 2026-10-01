export type AgeGroup = "child" | "adolescent" | "adult" | "elderly";
export type Sex = "male" | "female";

export interface Patient {
  id: string;
  medicalRecordNumber: string; // NIK or Rekam Medis
  name: string;
  dateOfBirth: string;
  age: number;
  ageGroup: AgeGroup;
  sex: Sex;
  phone: string;
  email?: string;
  address?: string;
  symptoms: string[];
  riskFactors: string[];
  medicalHistory: string[];
  createdAt: string;
  lastScreeningDate?: string;
  lastRiskLevel?: "low" | "moderate" | "high" | "inconclusive";
}
