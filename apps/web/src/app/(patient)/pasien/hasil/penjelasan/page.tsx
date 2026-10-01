"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  Activity,
  Eye,
  Sparkles,
  Hand,
  ChevronDown,
  ChevronUp,
  Microscope,
  HelpCircle,
  Printer,
  Share2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { PatientBottomNavigation } from "@/components/patient/PatientBottomNavigation";
import { getRealScreeningStatus, RealSiteResult, FusedResult } from "@/services/screening";
import { QC_REASON_LABELS } from "@/lib/qc-labels";

const SITE_META: Record<string, { title: string; icon: typeof Eye }> = {
  conjunctiva: { title: "Mata", icon: Eye },
  nail: { title: "Kuku / Jari", icon: Sparkles },
  palm: { title: "Telapak Tangan", icon: Hand },
};

const WHO_CATEGORY_LABELS: Record<string, string> = {
  non_anemic: "Tidak Anemia",
  mild: "Anemia Ringan",
  moderate: "Anemia Sedang",
  severe: "Anemia Berat",
};

const WHO_CATEGORY_CONFIG: Record<
  string,
  {
    headline: string;
    icon: typeof CheckCircle2;
    barClass: string;
    textClass: string;
    description: string;
  }
> = {
  non_anemic: {
    headline: "TIDAK TERINDIKASI ANEMIA",
    icon: CheckCircle2,
    barClass: "bg-tertiary",
    textClass: "text-tertiary",
    description:
      "Hasil skrining menunjukkan kadar hemoglobin dalam batas normal. Ini merupakan hasil skrining, bukan diagnosis medis.",
  },
  mild: {
    headline: "ANEMIA RINGAN",
    icon: AlertTriangle,
    barClass: "bg-warning-bright",
    textClass: "text-warning-bright-dark",
    description:
      "Hasil skrining menunjukkan indikasi anemia ringan dan dapat memerlukan pemeriksaan lebih lanjut.",
  },
  moderate: {
    headline: "ANEMIA SEDANG",
    icon: AlertTriangle,
    barClass: "bg-warning-bright",
    textClass: "text-warning-bright-dark",
    description:
      "Hasil skrining menunjukkan indikasi anemia sedang dan perlu diperhatikan dengan pemeriksaan lebih lanjut.",
  },
  severe: {
    headline: "ANEMIA BERAT",
    icon: XCircle,
    barClass: "bg-error",
    textClass: "text-error",
    description:
      "Hasil skrining menunjukkan indikasi anemia berat. Segera konsultasikan ke fasilitas kesehatan.",
  },
};

function clampHbPercent(hbGdl: number): number {
  const clamped = Math.min(16, Math.max(4, hbGdl));
  return ((clamped - 4) / (16 - 4)) * 100;
}

export default function ResultExplanationPage() {
  const router = useRouter();

  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [siteResults, setSiteResults] = useState<RealSiteResult[]>([]);
  const [fusedResult, setFusedResult] = useState<FusedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openAccuracy, setOpenAccuracy] = useState(false);
  const [openWhy, setOpenWhy] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

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
        setSiteResults(result.siteResults);
        setFusedResult(result.fusedResult);
      })
      .catch(() => setLoadError("Gagal memuat penjelasan hasil skrining."))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const categoryLabel = fusedResult ? WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory : "";
    const hbText = fusedResult?.hbGdl != null ? `${fusedResult.hbGdl.toFixed(1)} g/dL` : "tidak tersedia";
    const shareText = `Hasil Skrining SEHATI Anda: ${categoryLabel} (Estimasi Hb: ${hbText})`;
    if (navigator.share) {
      navigator.share({
        title: "Hasil Skrining SEHATI",
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

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

  const whoConfig = WHO_CATEGORY_CONFIG[fusedResult.whoCategory] ?? WHO_CATEGORY_CONFIG.non_anemic;
  const categoryLabel = WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory;
  const hbPercent = fusedResult.hbGdl != null ? clampHbPercent(fusedResult.hbGdl) : null;

  return (
    <main className="min-h-screen w-full bg-surface font-sans pb-32 flex flex-col items-center justify-start select-none overflow-x-hidden relative">

      {/* Top Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-container/30 rounded-full blur-3xl pointer-events-none" />
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
            <div>
              <h1 className="text-primary text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                Penjelasan Hasil
              </h1>
              <p className="text-on-surface-variant text-xs font-normal font-mono">
                {screeningId}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-6 relative z-10">

        {/* CARD 1: HASIL SKRINING OVERVIEW */}
        <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
            HASIL SKRINING
          </span>

          <div className="flex items-center gap-3">
            <div className={`w-3 h-10 ${whoConfig.barClass} rounded-full animate-pulse shadow-xs`} />
            <h2 className={`${whoConfig.textClass} text-2xl sm:text-3xl font-bold leading-snug uppercase`}>
              RISIKO ANEMIA:<br />{categoryLabel}
            </h2>
          </div>

          <p className="text-on-surface text-base font-normal leading-relaxed pt-1">
            {whoConfig.description}
          </p>

          <div className="p-4 bg-surface-container-low border-l-4 border-on-surface-muted rounded-r-lg flex items-start gap-3 text-on-surface-variant italic text-sm">
            <Info className="w-5 h-5 text-on-surface-muted flex-shrink-0 mt-0.5" />
            <p>Ini merupakan hasil skrining awal, bukan diagnosis medis.</p>
          </div>
        </div>

        {/* CARD 2: ESTIMASI HEMOGLOBIN (HB) & ANIMATED COLOR GAUGE BAR */}
        {fusedResult.hbGdl != null && hbPercent != null && (
          <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-container rounded-full text-primary flex-shrink-0 animate-pulse">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-on-surface text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                Estimasi Hemoglobin<br />(Hb)
              </h2>
            </div>

            {/* Huge Hb Value */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-5xl sm:text-6xl font-extrabold text-on-surface tracking-tight">
                {fusedResult.hbGdl.toFixed(1).replace(".", ",")}
              </span>
              <span className="text-2xl font-semibold text-on-surface-variant">g/dL</span>
            </div>

            {/* ANIMATED COLOR GAUGE BAR */}
            <div className="space-y-2 pt-2">
              <div className="relative w-full max-w-sm h-3 bg-outline-variant rounded-full overflow-hidden flex items-center border border-gray-200 shadow-inner">
                <div className="w-[30%] h-full bg-error transition-all duration-700" />
                <div className="w-[40%] h-full bg-warning-bright border-x border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scan-shine" />
                </div>
                <div className="w-[30%] h-full bg-tertiary transition-all duration-700" />

                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
                  style={{ left: `${hbPercent}%` }}
                >
                  <div className={`w-5 h-5 ${whoConfig.barClass} rounded-full border-2 border-white shadow-md animate-ping absolute opacity-75`} />
                  <div className={`w-4 h-4 ${whoConfig.barClass} rounded-full border-2 border-white shadow-md relative z-10`} />
                </div>
              </div>

              <div className="flex justify-between max-w-sm px-1 text-[10px] font-bold text-on-surface-variant tracking-wider">
                <span>RENDAH</span>
                <span className={whoConfig.textClass}>{categoryLabel.toUpperCase()} ({fusedResult.hbGdl.toFixed(1)})</span>
                <span>NORMAL</span>
              </div>
            </div>

            {/* Explanation Text */}
            <p className="text-on-surface text-base font-normal leading-relaxed pt-1">
              Estimasi berbasis analisis SEHATI. SEHATI memperkirakan kadar Hb berada di sekitar nilai tersebut berdasarkan data skrining yang tersedia.
            </p>

            {/* AI Estimate Blue Notice Box */}
            <div className="p-4 bg-primary-bright/10 border border-primary/20 rounded-xl flex items-start gap-3 text-primary-dark text-sm font-medium leading-relaxed">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p>
                Nilai ini merupakan estimasi AI. Estimasi Hb dapat berbeda dari hasil pemeriksaan laboratorium. Gunakan hasil ini sebagai informasi skrining awal, bukan sebagai pengganti pemeriksaan Hb.
              </p>
            </div>

            {/* Accordion: Seberapa pasti estimasi ini? */}
            <div className="border-t border-outline pt-4">
              <button
                type="button"
                onClick={() => setOpenAccuracy(!openAccuracy)}
                className="w-full flex items-center justify-between font-bold text-on-surface text-sm text-left hover:text-primary transition-colors cursor-pointer"
              >
                <span>Seberapa pasti estimasi ini?</span>
                {openAccuracy ? <ChevronUp className="w-5 h-5 text-on-surface" /> : <ChevronDown className="w-5 h-5 text-on-surface" />}
              </button>
              {openAccuracy && (
                <div className="pt-3 text-sm text-on-surface-variant space-y-2 animate-fade-in">
                  <p>
                    Akurasi estimasi AI SEHATI didasarkan pada model pembelajaran mesin yang dilatih dengan ribuan citra klinis terverifikasi.
                  </p>
                  <p>
                    Tingkat kepastian bergantung pada pencahayaan, fokus kamera, dan kejernihan struktur vaskular saat pengambilan citra.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: BAGAIMANA HASIL INI DIPEROLEH? */}
        <section className="space-y-4">
          <h2 className="text-on-surface text-2xl font-bold tracking-tight leading-tight">
            Bagaimana Hasil Ini<br />Diperoleh?
          </h2>

          {/* FLOW PIPELINE BOX WITH ICON MOTIONS */}
          <div className="w-full bg-surface-container-high rounded-xl p-5 overflow-x-auto">
            <div className="min-w-[500px] flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">
                {siteResults.map((site) => {
                  const meta = SITE_META[site.site] ?? { title: site.site, icon: Eye };
                  const IconComponent = meta.icon;
                  return (
                    <div key={site.site} className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-full border border-primary shadow-2xs flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary-container transition-all duration-300">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      {site.passed_qc ? (
                        <div className="flex items-center gap-1 text-tertiary text-[10px] font-bold tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-tertiary" />
                          <span>{meta.title.toUpperCase()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-error text-[10px] font-bold tracking-wider">
                          <XCircle className="w-3 h-3 text-error" />
                          <span>{meta.title.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Animated Arrow Connector */}
              <ArrowRight className="w-6 h-6 text-primary animate-pulse" />

              {/* Output Box */}
              <div className="bg-white border-2 border-primary rounded-xl p-3.5 shadow-sm space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">OUTPUT</span>
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  <span>Estimasi Hb</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span>Risiko Anemia</span>
                </div>
              </div>

            </div>
          </div>

          {/* Area Image Quality List */}
          <div className="space-y-3">
            {siteResults.map((site) => {
              const meta = SITE_META[site.site] ?? { title: site.site, icon: Eye };
              const IconComponent = meta.icon;
              const rawFrame = site.stage_images?.raw_frame;
              const imageSrc = rawFrame
                ? rawFrame.startsWith("http")
                  ? rawFrame
                  : `data:image/png;base64,${rawFrame}`
                : null;

              return (
                <div
                  key={site.site}
                  className="w-full bg-white rounded-xl border border-outline p-4 shadow-2xs flex items-center gap-4"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={`Area ${meta.title}`}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-on-surface font-bold text-sm">{meta.title}</h3>
                    {site.passed_qc ? (
                      <p className="text-tertiary text-xs font-bold pt-0.5">Kualitas Citra: Memadai</p>
                    ) : (
                      <p className="text-error text-xs font-bold pt-0.5">
                        Kualitas Citra: Tidak Memadai
                        {site.reasons.length > 0 && (
                          <span className="font-normal">
                            {" "}
                            ({site.reasons.map((reason) => QC_REASON_LABELS[reason] ?? reason).join(", ")})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CARD 4: APA ARTI HASIL SAYA? */}
        <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs space-y-4">
          <h2 className="text-on-surface text-2xl font-bold tracking-tight">Apa Arti Hasil Saya?</h2>

          <p className="text-on-surface text-base font-normal leading-relaxed">
            Hasil skrining Anda berada pada kategori {categoryLabel.toLowerCase()}. Estimasi Hb dari SEHATI memberikan indikasi awal yang dapat digunakan bersama informasi kesehatan lainnya untuk menentukan apakah diperlukan pemeriksaan lanjutan.
          </p>

          <div className="inline-block px-4 py-2 bg-warning-container-low text-warning-darkest text-sm font-bold rounded-lg shadow-2xs">
            {categoryLabel} ≠ diagnosis anemia
          </div>

          <div className="border-t border-outline pt-4">
            <button
              type="button"
              onClick={() => setOpenWhy(!openWhy)}
              className="w-full flex items-center justify-between font-bold text-on-surface text-sm text-left hover:text-primary transition-colors cursor-pointer"
            >
              <span>Mengapa saya mendapatkan hasil ini?</span>
              {openWhy ? <ChevronUp className="w-5 h-5 text-on-surface" /> : <ChevronDown className="w-5 h-5 text-on-surface" />}
            </button>
            {openWhy && (
              <div className="pt-3 text-sm text-on-surface-variant space-y-2 animate-fade-in">
                <p>
                  Tingkat paleness (kepucatan) pada jaringan konjungtiva dan kuku terdeteksi sedikit di bawah ambang normal populasi umum.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 5: PERLU MEMASTIKAN HASIL? (PROMO CARD WITH MICROSCOPE ICON MOTION) */}
        <div className="w-full bg-primary-container rounded-2xl border border-primary/20 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Animated Microscope Icon */}
          <div className="w-14 h-14 bg-primary-bright rounded-xl flex items-center justify-center text-white shadow-md animate-bounce-slow">
            <Microscope className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-primary-darkest text-2xl font-bold tracking-tight">
              Perlu Memastikan Hasil?
            </h2>
            <p className="text-primary-dark text-base font-normal leading-relaxed">
              Pemeriksaan Hb menggunakan metode klinis/laboratorium tetap diperlukan untuk mengonfirmasi kondisi Anda apabila direkomendasikan oleh tenaga kesehatan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(ROUTES.PATIENT.TINDAK_LANJUT)}
            className="w-full py-3.5 px-6 bg-primary hover:bg-primary-deep active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <span>Lihat Rekomendasi Pemeriksaan</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* CARD 6: ACCORDION TENTANG HASIL & ACTION BUTTONS */}
        <div className="space-y-4">
          <div className="w-full bg-surface-container-low border border-outline rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenAbout(!openAbout)}
              className="w-full p-4 flex items-center justify-between font-bold text-on-surface-variant text-sm text-left hover:bg-surface-container transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-on-surface-variant" />
                <span>Tentang Hasil SEHATI</span>
              </div>
              {openAbout ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
            </button>

            {openAbout && (
              <div className="p-4 border-t border-outline text-sm text-on-surface-variant space-y-2 bg-white animate-fade-in">
                <p>
                  SEHATI adalah alat skrining pendukung keputusan klinis berbasis AI yang dirancang untuk membantu deteksi dini risiko anemia di masyarakat.
                </p>
              </div>
            )}
          </div>

          {/* Print & Share Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 border border-outline bg-white hover:bg-gray-50 active:scale-[0.98] text-on-surface font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Printer className="w-5 h-5 text-on-surface" />
              <span>Cetak Hasil</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-3 px-4 border border-outline bg-white hover:bg-gray-50 active:scale-[0.98] text-on-surface font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Share2 className="w-5 h-5 text-on-surface" />
              <span>{copiedShare ? "Tersalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <PatientBottomNavigation />

    </main>
  );
}
