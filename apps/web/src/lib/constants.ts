export const APP_CONFIG = {
  name: "HemaVision",
  proName: "HemaVision",
  patientName: "HemaVision Pasien",
  version: "1.0.0-foundation",
  safetyNotice:
    "HemaVision adalah sistem pendukung skrining (Screening Support System). Aplikasi ini TIDAK memberikan diagnosis medis definitif. Selalu lakukan tes konfirmasi laboratorium untuk diagnosis Hb resmi.",
  sites: [
    { id: "conjunctiva", name: "Mata / Konjungtiva", description: "Pengambilan gambar area konjungtiva mata bawah" },
    { id: "nail", name: "Jari / Kuku", description: "Pengambilan gambar bantalan kuku (nailbed)" },
    { id: "palm", name: "Telapak Tangan", description: "Pengambilan gambar telapak tangan pasien" },
  ] as const,
};
