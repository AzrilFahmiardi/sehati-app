import { Screening } from "@/types/screening";

export const MOCK_SCREENINGS: Screening[] = [
  {
    id: "scr-2026-001",
    patientId: "p-001",
    patientName: "Budi Santoso",
    createdAt: "2026-07-20T10:15:00Z",
    status: "completed",
    sites: {
      conjunctiva: { site: "conjunctiva", status: "validated", imageQuality: "good" },
      nail: { site: "nail", status: "validated", imageQuality: "good" },
      palm: { site: "palm", status: "validated", imageQuality: "acceptable" },
    },
    result: {
      riskLevel: "moderate",
      estimatedHb: 10.8,
      confidence: 0.89,
      recommendation: "Disarankan pemeriksaan laboratorium Hb lengkap dan konsultasi nutrisi kaya zat besi.",
      clinicalInterpretation: "Estimasi Hb menunjukkan tingkat risiko sedang untuk anemia defisiensi besi. Memerlukan konfirmasi spesimen darah.",
      requiresConfirmation: true,
      healthcareDecision: "confirmed_lab_needed",
      decisionNotes: "Pasien dirujuk ke laboratorium Puskesmas untuk pemeriksaan Darah Lengkap (CBC).",
      evaluatedAt: "2026-07-20T10:18:00Z",
    },
    healthcareWorkerId: "nakes-101",
    notes: "Pengambilan gambar berjalan lancar pada ketiga lokasi citra.",
  },
  {
    id: "scr-2026-002",
    patientId: "p-002",
    patientName: "Siti Rahmawati",
    createdAt: "2026-07-22T14:20:00Z",
    status: "completed",
    sites: {
      conjunctiva: { site: "conjunctiva", status: "validated", imageQuality: "acceptable" },
      nail: { site: "nail", status: "validated", imageQuality: "good" },
      palm: { site: "palm", status: "validated", imageQuality: "good" },
    },
    result: {
      riskLevel: "high",
      estimatedHb: 8.4,
      confidence: 0.92,
      recommendation: "Pemeriksaan konfirmasi Hb canggih dan konsultasi dokter penanggung jawab segera.",
      clinicalInterpretation: "Estimasi Hb secara signifikan di bawah batas normal. Berisiko anemia berat.",
      requiresConfirmation: true,
      healthcareDecision: "immediate_referral",
      decisionNotes: "Diberikan rujukan cepat dan resep suplemen besi darurat.",
      evaluatedAt: "2026-07-22T14:22:00Z",
    },
    healthcareWorkerId: "nakes-101",
  },
];
