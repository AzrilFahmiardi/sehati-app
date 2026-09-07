"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  AlertOctagon,
  HelpCircle,
  Stethoscope,
  SquareCheck,
  Square,
  FileEdit,
  Info,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { PatientBottomNavigation } from "@/components/patient/PatientBottomNavigation";
import { getRealScreeningStatus, FusedResult } from "@/services/screening";

const WHO_CATEGORY_LABELS: Record<string, string> = {
  non_anemic: "Tidak Anemia",
  mild: "Anemia Ringan",
  moderate: "Anemia Sedang",
  severe: "Anemia Berat",
};

const SITE_LABELS: Record<string, string> = {
  conjunctiva: "Konjungtiva",
  palm: "Telapak Tangan",
  nail: "Kuku",
};

export default function ExaminationRecommendationPage() {
  const router = useRouter();
  const [openWhy, setOpenWhy] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [fusedResult, setFusedResult] = useState<FusedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("hv_last_screening_id");
    const organizationId = sessionStorage.getItem("hv_last_screening_org");
    if (!id || !organizationId) {
      setLoadError("Belum ada hasil skrining yang tersedia.");
      setIsLoading(false);
      return;
    }
    setScreeningId(id);

    getRealScreeningStatus(id, organizationId)
      .then((result) => {
        setFusedResult(result.fusedResult);
      })
      .catch(() => setLoadError("Gagal memuat hasil skrining."))
      .finally(() => setIsLoading(false));
  }, []);

  // Scroll Reveal Observer State for Timeline
  const [timelineVisible, setTimelineVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimelineVisible(true);
        } else {
          setTimelineVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  // Interactive Preparation Checklist State
  const [checklist, setChecklist] = useState({
    result: true,
    symptoms: false,
    history: false,
    meds: false,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const summaryText = fusedResult
    ? [
        `ID SKRINING: ${screeningId}.`,
        `HASIL HEMAVISION: ${(WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory).toUpperCase()}`,
        `(ESTIMASI HB ${fusedResult.hbGdl.toFixed(1)} G/DL).`,
        `DATA BERDASARKAN ANALISIS MULTI-MODALITAS AI (${fusedResult.contributingSites.included
          .map((site) => (SITE_LABELS[site] ?? site).toUpperCase())
          .join(", ")}).`,
        "MOHON EVALUASI KLINIS DAN KONFIRMASI LABORATORIUM.",
      ].join("\n")
    : "";

  const handleCopySummary = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const timelineSteps = [
    {
      title: "Diskusi",
      desc: "Menunjukkan hasil skrining SEHATI kepada tenaga medis.",
      active: true,
    },
    {
      title: "Evaluasi",
      desc: "Dokter menanyakan gejala klinis dan riwayat kesehatan Anda.",
      active: false,
    },
    {
      title: "Pemeriksaan",
      desc: "Pengambilan sampel darah untuk pemeriksaan laboratorium resmi.",
      active: false,
    },
    {
      title: "Interpretasi",
      desc: "Membaca hasil laboratorium bersama tenaga kesehatan profesional.",
      active: false,
    },
    {
      title: "Rencana",
      desc: "Pemberian saran nutrisi atau suplemen jika diperlukan.",
      active: false,
    },
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-surface font-sans flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </main>
    );
  }

  if (loadError || !fusedResult) {
    return (
      <main className="min-h-screen w-full bg-surface font-sans flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-on-surface-variant text-base">{loadError ?? "Hasil skrining tidak ditemukan."}</p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.PATIENT.BERANDA)}
          className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </main>
    );
  }

  const categoryLabel = WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory;

  return (
    <main className="min-h-screen w-full bg-surface font-sans pb-32 flex flex-col items-center justify-start select-none overflow-x-hidden relative">

      {/* Top Ambient Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-0 w-80 h-80 bg-tertiary-container/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="w-full bg-surface/90 border-b border-outline px-4 h-16 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        <div className="w-full max-w-[672px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/70 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
            <h1 className="text-primary text-xl sm:text-2xl font-bold tracking-tight">
              Rekomendasi Pemeriksaan
            </h1>
          </div>

          {/* Profile Avatar */}
          <Link
            href={ROUTES.PATIENT.PROFIL}
            className="w-8 h-8 rounded-full overflow-hidden border border-outline hover:opacity-90 transition-opacity flex-shrink-0"
            aria-label="Profil Saya"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-8 relative z-10">
        
        {/* Subtitle */}
        <p className="text-on-surface-variant text-base font-normal">
          Langkah yang disarankan berdasarkan hasil skrining Anda
        </p>

        {/* CARD 1: 1. PEMERIKSAAN Hb KONFIRMASI */}
        <div className="group w-full bg-white rounded-xl border border-outline hover:border-primary p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container text-tertiary-alt text-xs font-bold rounded-full shadow-2xs group-hover:bg-tertiary-alt group-hover:text-white transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Direkomendasikan</span>
              </div>
              <h2 className="text-primary text-2xl font-bold leading-tight group-hover:translate-x-0.5 transition-transform">
                1. PEMERIKSAAN Hb<br />KONFIRMASI
              </h2>
            </div>

            {/* Medical Bag Icon */}
            <div className="w-14 h-14 bg-primary-bright/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
          </div>

          {/* Accordion: Mengapa direkomendasikan? */}
          <div className="border-t border-outline pt-4">
            <button
              type="button"
              onClick={() => setOpenWhy(!openWhy)}
              className="w-full flex items-center justify-between font-normal text-on-surface text-base text-left hover:text-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">Mengapa direkomendasikan?</span>
              </div>
              {openWhy ? <ChevronUp className="w-5 h-5 text-on-surface" /> : <ChevronDown className="w-5 h-5 text-on-surface" />}
            </button>

            {openWhy && (
              <div className="pt-3 text-sm text-on-surface-variant space-y-2 bg-surface-container-low p-4 rounded-lg mt-2 border border-outline/40 animate-fade-in">
                <p>
                  Pemeriksaan laboratorium lanjutan disarankan untuk memastikan tingkat hemoglobin secara pasti dalam darah sebagai tindak lanjut atas temuan indikasi {categoryLabel.toLowerCase()} dari skrining ini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: TIMELINE "APA YANG MUNGKIN TERJADI SELANJUTNYA?" WITH SCROLL REVEAL MOTION */}
        <section ref={timelineRef} className="space-y-4">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <h2>APA YANG MUNGKIN TERJADI SELANJUTNYA?</h2>
          </div>

          {/* Vertical Timeline Container */}
          <div className="relative pl-8 space-y-4">
            {/* Animated Vertical Connecting Line */}
            <div
              className={`absolute left-[15px] top-3 bottom-3 w-0.5 bg-outline transition-all duration-1000 ${
                timelineVisible ? "opacity-100" : "opacity-30"
              }`}
            />

            {/* Staggered Timeline Items Appearing One-by-One on Scroll */}
            {timelineSteps.map((step, idx) => (
              <div
                key={step.title}
                style={{ transitionDelay: `${idx * 160}ms` }}
                className={`relative group transition-all duration-700 ease-out ${
                  timelineVisible
                    ? "opacity-100 translate-y-0 translate-x-0"
                    : "opacity-0 translate-y-6 -translate-x-3"
                }`}
              >
                {/* Timeline Dot Node */}
                <div
                  className={`absolute -left-[25px] top-3 w-4 h-4 rounded-full border-4 border-surface transition-all duration-500 ${
                    step.active
                      ? "bg-primary shadow-xs animate-pulse scale-110"
                      : "bg-outline group-hover:bg-primary group-hover:scale-110"
                  }`}
                />

                {/* Content Card */}
                <div
                  className={`bg-surface-container-low rounded-xl p-4 transition-all duration-300 space-y-1 ${
                    step.active
                      ? "border border-primary/40 shadow-xs"
                      : "border border-transparent group-hover:border-primary/50 group-hover:shadow-sm"
                  }`}
                >
                  <h3
                    className={`font-bold text-base transition-colors ${
                      step.active ? "text-primary" : "text-on-surface group-hover:text-primary"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CARD 3: KAPAN SEBAIKNYA DIPERIKSA? */}
        <div className="w-full bg-surface rounded-xl border border-outline p-5 shadow-xs space-y-2 hover:border-primary transition-all group">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Clock className="w-5 h-5 text-primary group-hover:animate-spin-slow" />
            <h3 className="text-on-surface-variant font-semibold text-base">Kapan Sebaiknya Diperiksa?</h3>
          </div>
          <p className="text-on-surface text-base font-normal leading-relaxed">
            Konsultasikan dengan tenaga kesehatan untuk menentukan waktu terbaik pemeriksaan.
          </p>
          <p className="text-on-surface-variant text-sm italic font-normal leading-relaxed pt-1">
            Segera periksakan jika Anda merasa sangat lelah, pusing, atau sesak napas.
          </p>
        </div>

        {/* CARD 4: YANG PERLU DISIAPKAN (INTERACTIVE CHECKLIST) */}
        <div className="w-full bg-surface-container rounded-xl border border-outline p-5 space-y-4 shadow-2xs">
          <h3 className="text-on-surface font-bold text-base">Yang Perlu Disiapkan</h3>

          <div className="space-y-3">
            {/* Checklist Item 1 */}
            <div
              onClick={() => toggleChecklist("result")}
              className="flex items-start gap-3 cursor-pointer group"
            >
              {checklist.result ? (
                <SquareCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-muted flex-shrink-0 mt-0.5 group-hover:text-primary" />
              )}
              <div className="space-y-0.5">
                <span className={`text-base font-medium transition-colors ${checklist.result ? "text-on-surface" : "text-on-surface-variant"}`}>
                  Hasil skrining SEHATI
                </span>
                <p className="text-on-surface-variant text-xs font-normal">
                  Simpan tangkapan layar atau ID riwayat
                </p>
              </div>
            </div>

            {/* Checklist Item 2 */}
            <div
              onClick={() => toggleChecklist("symptoms")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {checklist.symptoms ? (
                <SquareCheck className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-muted flex-shrink-0 group-hover:text-primary" />
              )}
              <span className={`text-base font-medium transition-colors ${checklist.symptoms ? "text-on-surface" : "text-on-surface-variant"}`}>
                Daftar Gejala yang dirasakan
              </span>
            </div>

            {/* Checklist Item 3 */}
            <div
              onClick={() => toggleChecklist("history")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {checklist.history ? (
                <SquareCheck className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-muted flex-shrink-0 group-hover:text-primary" />
              )}
              <span className={`text-base font-medium transition-colors ${checklist.history ? "text-on-surface" : "text-on-surface-variant"}`}>
                Riwayat kesehatan keluarga
              </span>
            </div>

            {/* Checklist Item 4 */}
            <div
              onClick={() => toggleChecklist("meds")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {checklist.meds ? (
                <SquareCheck className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-muted flex-shrink-0 group-hover:text-primary" />
              )}
              <span className={`text-base font-medium transition-colors ${checklist.meds ? "text-on-surface" : "text-on-surface-variant"}`}>
                Daftar Obat/suplemen rutin
              </span>
            </div>
          </div>
        </div>

        {/* CARDS 5 & 6: ACTION GUIDANCE CARDS */}
        <div className="space-y-3">
          <div className="w-full bg-surface rounded-xl border border-outline p-4 flex items-start gap-3 hover:border-primary transition-all cursor-pointer group">
            <FileEdit className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="space-y-1">
              <h4 className="text-on-surface font-semibold text-base group-hover:text-primary transition-colors">
                Catat Perubahan Gejala
              </h4>
              <p className="text-on-surface-variant text-xs font-normal leading-relaxed">
                Perhatikan jika muncul pucat pada telapak tangan atau mata.
              </p>
            </div>
          </div>

          <div className="w-full bg-surface rounded-xl border border-outline p-4 flex items-start gap-3 hover:border-primary transition-all cursor-pointer group">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="space-y-1">
              <h4 className="text-on-surface font-semibold text-base group-hover:text-primary transition-colors">
                Siapkan Informasi Kesehatan
              </h4>
              <p className="text-on-surface-variant text-xs font-normal leading-relaxed">
                Ketahui asupan harian zat besi dari makanan Anda.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 7: RINGKASAN UNTUK TENAGA KESEHATAN (BLUE CARD) */}
        <div className="w-full bg-primary rounded-xl p-6 shadow-xl text-white space-y-4 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <h3 className="text-surface-tint font-semibold text-base">
              Ringkasan untuk Tenaga Kesehatan
            </h3>
            <FileText className="w-5 h-5 text-surface-tint/80 group-hover:rotate-12 transition-transform" />
          </div>

          <div className="bg-white/10 rounded-lg p-4 font-mono text-xs sm:text-sm text-surface-tint leading-relaxed backdrop-blur-xs border border-white/20 select-all">
            {summaryText}
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full py-3.5 px-6 bg-surface-tint hover:bg-white active:scale-[0.98] text-primary font-bold text-sm rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-tertiary" />
                <span className="text-tertiary">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-primary" />
                <span>Salin Ringkasan</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 8: JIKA KONDISI MEMBURUK (EMERGENCY RED BOX) */}
        <div className="w-full bg-error-container border border-error rounded-xl p-4 flex items-center gap-4 text-error-dark shadow-xs">
          <div className="w-10 h-10 bg-error rounded-full flex items-center justify-center text-white animate-pulse flex-shrink-0 shadow-xs">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-base text-error-dark">Jika Kondisi Memburuk</h4>
            <p className="text-sm font-normal text-error-dark/90">
              Cari pertolongan medis segera di UGD terdekat.
            </p>
          </div>
        </div>

        {/* SECTION 9: ACCORDION TENTANG REKOMENDASI INI */}
        <div className="w-full bg-surface-container-low border border-outline rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenAbout(!openAbout)}
            className="w-full p-4 flex items-center justify-between font-normal text-on-surface-variant text-base text-left hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span>Tentang Rekomendasi Ini</span>
            {openAbout ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
          </button>

            {openAbout && (
              <div className="p-4 border-t border-outline text-sm text-on-surface-variant space-y-2 bg-white animate-fade-in">
                <p>
                  Rekomendasi ini disusun berdasarkan panduan penanganan awal risiko anemia dan dirancang untuk membantu komunikasi antara pasien dan tenaga medis secara efektif.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Navigation Bar */}
        <PatientBottomNavigation />

      </main>
    );
  }
