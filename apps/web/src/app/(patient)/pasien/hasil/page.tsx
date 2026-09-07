"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getRealScreeningStatus, FusedResult } from "@/services/screening";

const WHO_CATEGORY_LABELS: Record<string, string> = {
  non_anemic: "Tidak Anemia",
  mild: "Anemia Ringan",
  moderate: "Anemia Sedang",
  severe: "Anemia Berat",
};

const WHO_CATEGORY_CONFIG: Record<
  string,
  { title: string; icon: typeof CheckCircle2; gradientClass: string; description: string }
> = {
  non_anemic: {
    title: "TIDAK TERINDIKASI ANEMIA",
    icon: CheckCircle2,
    gradientClass: "from-tertiary via-tertiary-alt to-tertiary-container",
    description: "Hasil menunjukkan kadar hemoglobin dalam batas normal. Ini merupakan hasil skrining, bukan diagnosis anemia.",
  },
  mild: {
    title: "ANEMIA RINGAN",
    icon: AlertTriangle,
    gradientClass: "from-warning-light via-warning-vivid to-warning-accent",
    description: "Hasil menunjukkan indikasi anemia ringan. Ini merupakan hasil skrining, bukan diagnosis anemia.",
  },
  moderate: {
    title: "ANEMIA SEDANG",
    icon: AlertTriangle,
    gradientClass: "from-warning-vivid via-warning-accent to-error",
    description: "Hasil menunjukkan indikasi anemia sedang. Ini merupakan hasil skrining, bukan diagnosis anemia.",
  },
  severe: {
    title: "ANEMIA BERAT",
    icon: XCircle,
    gradientClass: "from-error via-error to-error",
    description: "Hasil menunjukkan indikasi anemia berat. Segera konsultasikan ke fasilitas kesehatan.",
  },
};

const DECISION_STATUS_LABELS: Record<string, string> = {
  non_anemic: "Keyakinan Tinggi",
  anemic: "Keyakinan Tinggi",
  inconclusive: "Belum Konklusif",
};

export default function PatientScreeningResultOverviewPage() {
  const router = useRouter();
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

  const handleFollowUpRecommendation = () => {
    router.push(ROUTES.PATIENT.TINDAK_LANJUT);
  };

  const handleGoToDetail = () => {
    router.push(ROUTES.PATIENT.HASIL_DETAIL);
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

  const config = WHO_CATEGORY_CONFIG[fusedResult.whoCategory] ?? WHO_CATEGORY_CONFIG.non_anemic;
  const IconComponent = config.icon;
  const isInconclusive = fusedResult.decision === "inconclusive";

  return (
    <main className="min-h-screen w-full bg-surface font-sans pb-28 flex flex-col items-center justify-start select-none overflow-x-hidden">

      {/* Main Container */}
      <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-6">

        {/* FACILITY LOCATION & DATE BADGE */}
        <div className="w-full bg-white rounded-xl border border-outline p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-on-surface font-bold text-base">Skrining Mandiri</h1>
              <p className="text-on-surface-variant text-xs font-normal font-mono">{screeningId}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container/30 text-tertiary-alt text-xs font-semibold rounded-full border border-tertiary-container">
            <CheckCircle2 className="w-3.5 h-3.5 text-tertiary-alt" />
            <span>Selesai</span>
          </div>
        </div>

        {/* HERO RESULT CARD */}
        <div className={`w-full bg-gradient-to-br ${config.gradientClass} rounded-2xl p-6 sm:p-8 shadow-xl text-white space-y-6 relative overflow-hidden group`}>

          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold uppercase tracking-wider text-white">
              <IconComponent className="w-4 h-4 text-white" />
              <span>HASIL SKRINING</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                isInconclusive ? "bg-white/25 text-white" : "bg-white/15 text-white/90"
              }`}
            >
              {isInconclusive && <HelpCircle className="w-3.5 h-3.5" />}
              <span>{DECISION_STATUS_LABELS[fusedResult.decision] ?? fusedResult.decision}</span>
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight uppercase">
              {config.title}
            </h2>
            {fusedResult.hbGdl != null && (
              <p className="text-white/90 text-lg font-semibold">
                Estimasi Hb: {fusedResult.hbGdl.toFixed(1)} g/dL
              </p>
            )}
          </div>

          {isInconclusive && (
            <div className="flex items-start gap-2.5 bg-white/15 border border-white/25 rounded-lg p-3.5 relative z-10">
              <HelpCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <p className="text-white text-sm leading-relaxed">
                Hasil di atas belum konklusif, tingkat keyakinan AI terhadap kategori ini masih rendah.
                Sebaiknya ulangi skrining atau konsultasikan ke fasilitas kesehatan untuk pemeriksaan lebih lanjut.
              </p>
            </div>
          )}

          <p className="text-warning-container-lowest text-base sm:text-lg font-normal leading-relaxed max-w-lg relative z-10">
            {config.description}
          </p>

          <div className="w-full space-y-3 pt-2 relative z-10">
            <button
              type="button"
              onClick={handleFollowUpRecommendation}
              className="group/btn w-full py-4 px-6 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Rekomendasi Tindak Lanjut</span>
              <ExternalLink className="w-5 h-5 text-white stroke-[2.5] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleGoToDetail}
              className="w-full py-3.5 px-6 bg-white/20 hover:bg-white/30 active:scale-[0.99] border border-white/30 text-white font-bold text-sm sm:text-base rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Lihat Detail Hasil</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

        </div>

        {Object.keys(fusedResult.caveats).length > 0 && (
          <div className="w-full bg-warning-container-lowest border border-warning-accent/40 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-warning-darkest">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{Object.values(fusedResult.caveats).map(String).join(" ")}</p>
          </div>
        )}

        {/* MEDICAL DISCLAIMER CARD */}
        <div className="w-full bg-surface-container-high border border-outline/60 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-on-surface-variant">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Pemeriksaan ini memanfaatkan teknologi visi komputer non-invasif. Konsultasikan ke fasilitas pelayanan kesehatan terdekat untuk mendapatkan pemeriksaan konfirmasi Hb resmi.
          </p>
        </div>

      </div>

    </main>
  );
}
