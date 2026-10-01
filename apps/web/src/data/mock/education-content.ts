export interface EducationArticle {
  id: string;
  whoCategories: string[];
  title: string;
  summary: string;
  badge: string;
  accentColor: "tertiary" | "warning" | "error";
  recommendations: string[];
}

export const PERSONALIZED_EDUCATION_DATA: EducationArticle[] = [
  {
    id: "edu-non-anemic",
    whoCategories: ["non_anemic"],
    title: "Menjaga Kadar Hemoglobin Tetap Optimal",
    summary:
      "Hasil skrining Anda menunjukkan kisaran normal. Pertahankan kecukupan mikronutrien harian agar stamina tetap terjaga.",
    badge: "Pencegahan",
    accentColor: "tertiary",
    recommendations: [
      "Konsumsi variasi protein hewani dan nabati kaya zat besi secara teratur.",
      "Sertakan sumber vitamin C saat makan untuk memaksimalkan penyerapan nutrisi.",
      "Lakukan skrining berkala untuk memantau status kesehatan darah.",
    ],
  },
  {
    id: "edu-mild",
    whoCategories: ["mild"],
    title: "Langkah Penyesuaian Nutrisi untuk Anemia Ringan",
    summary:
      "Terdeteksi kecenderungan anemia ringan. Intervensi pola makan terarah dan istirahat cukup dapat membantu perbaikan.",
    badge: "Perhatian",
    accentColor: "warning",
    recommendations: [
      "Tingkatkan porsi sayuran hijau gelap, hati ayam, dan daging merah tanpa lemak.",
      "Hindari minum teh atau kopi berdekatan dengan waktu makan utama.",
      "Konsultasikan ke puskesmas atau fasilitas kesehatan untuk evaluasi lanjutan.",
    ],
  },
  {
    id: "edu-moderate-severe",
    whoCategories: ["moderate", "severe"],
    title: "Panduan Tindak Lanjut Indikasi Anemia Bermakna",
    summary:
      "Hasil skrining mengindikasikan risiko anemia yang membutuhkan perhatian klinis segera dari tenaga kesehatan.",
    badge: "Prioritas Klinis",
    accentColor: "error",
    recommendations: [
      "Kunjungi fasilitas pelayanan kesehatan terdekat untuk pemeriksaan darah lengkap resmi.",
      "Hindari aktivitas fisik berat yang memicu sesak atau pusing mendadak.",
      "Konsumsi suplemen penambah darah hanya atas anjuran dan resep dokter.",
    ],
  },
];
