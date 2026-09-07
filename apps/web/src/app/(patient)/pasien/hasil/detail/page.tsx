"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Sparkles,
  Hand,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getRealScreeningStatus, RealSiteResult, FusedResult } from "@/services/screening";

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

const WHO_CATEGORY_CONFIG: Record<string, { icon: typeof CheckCircle2; gradientClass: string }> = {
  non_anemic: { icon: CheckCircle2, gradientClass: "from-tertiary via-tertiary-alt to-tertiary-container" },
  mild: { icon: AlertTriangle, gradientClass: "from-warning-light via-warning-vivid to-warning-accent" },
  moderate: { icon: AlertTriangle, gradientClass: "from-warning-vivid via-warning-accent to-error" },
  severe: { icon: XCircle, gradientClass: "from-error via-error to-error" },
};

const DECISION_STATUS_LABELS: Record<string, string> = {
  non_anemic: "Keyakinan Tinggi",
  anemic: "Keyakinan Tinggi",
  inconclusive: "Belum Konklusif",
};

export default function ScreeningDetailInspectionPage() {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [screeningId, setScreeningId] = useState<string | null>(null);
  const [siteResults, setSiteResults] = useState<RealSiteResult[]>([]);
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
        setSiteResults(result.siteResults);
        setFusedResult(result.fusedResult);
      })
      .catch(() => setLoadError("Gagal memuat detail hasil skrining."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopyId = () => {
    if (!screeningId) return;
    navigator.clipboard.writeText(screeningId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleBackToResults = () => {
    router.push(ROUTES.PATIENT.HASIL);
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
        <p className="text-on-surface-variant text-base">{loadError ?? "Detail hasil tidak ditemukan."}</p>
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
  const WhoIcon = whoConfig.icon;
  const isInconclusive = fusedResult.decision === "inconclusive";

  return (
    <main className="min-h-screen w-full bg-surface font-sans pb-16 flex flex-col items-center justify-start select-none overflow-x-hidden relative">

      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-tertiary-container/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="w-full bg-surface border-b border-outline px-4 h-16 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        <div className="w-full max-w-[672px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToResults}
              className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/70 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Kembali ke Hasil"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
            <h1 className="text-primary text-xl sm:text-2xl font-bold tracking-tight">
              Detail Pemeriksaan
            </h1>
          </div>

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

        {/* Header Summary */}
        <div className="space-y-2">
          <p className="text-on-surface-variant text-base font-normal">
            Ringkasan pemeriksaan SEHATI Anda
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container text-tertiary-alt text-sm font-medium rounded-full shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-tertiary-alt" />
            <span>Pemeriksaan Selesai</span>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="w-full bg-white rounded-xl border border-outline p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">KATEGORI WHO</span>
              <p className="text-on-surface font-normal text-base">
                {WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ESTIMASI HB</span>
              <p className="text-on-surface font-normal text-base">
                {fusedResult.hbGdl != null ? `${fusedResult.hbGdl.toFixed(1)} g/dL` : "Tidak tersedia"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">SITUS DIGUNAKAN</span>
              <p className="text-on-surface font-normal text-base">
                {fusedResult.contributingSites.included.length} dari {siteResults.length}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">STATUS</span>
              <p className="text-tertiary font-normal text-base flex items-center gap-1">
                ✓ Selesai
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: AREA PEMERIKSAAN */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-on-surface text-2xl font-bold tracking-tight">Area Pemeriksaan</h2>
            <p className="text-on-surface-variant text-base font-normal">
              SEHATI menganalisis beberapa area untuk mendukung proses skrining.
            </p>
          </div>

          <div className="space-y-3">
            {siteResults.map((site) => {
              const meta = SITE_META[site.site] ?? { title: site.site, icon: Eye };
              const IconComponent = meta.icon;
              return (
                <div
                  key={site.site}
                  className="group w-full bg-white rounded-xl border border-outline hover:border-primary p-4 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-on-surface font-bold text-base group-hover:text-primary transition-colors">
                        {meta.title}
                      </h3>
                      {site.passed_qc ? (
                        <p className="text-tertiary text-xs font-normal flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                          <span>Citra Memadai</span>
                        </p>
                      ) : (
                        <p className="text-error text-xs font-normal flex items-center gap-1 pt-0.5">
                          <XCircle className="w-3.5 h-3.5 text-error" />
                          <span>Citra Tidak Memadai</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {site.hb_gdl != null && (
                    <span className="text-sm font-mono text-on-surface-variant">
                      {site.hb_gdl.toFixed(1)} g/dL
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: RINGKASAN HASIL */}
        <section className="space-y-4">
          <h2 className="text-on-surface text-2xl font-bold tracking-tight">Ringkasan Hasil</h2>

          <div className={`w-full bg-gradient-to-br ${whoConfig.gradientClass} rounded-xl p-6 sm:p-8 shadow-xl text-white space-y-4 relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                <WhoIcon className="w-4 h-4 text-white" />
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

            <h3 className="text-3xl font-extrabold leading-tight text-white uppercase">
              {WHO_CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory}
            </h3>

            {isInconclusive && (
              <div className="flex items-start gap-2.5 bg-white/15 border border-white/25 rounded-lg p-3.5">
                <HelpCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <p className="text-white text-sm leading-relaxed">
                  Hasil belum konklusif, tingkat keyakinan AI terhadap kategori ini masih rendah.
                  Sebaiknya ulangi skrining atau konsultasikan ke fasilitas kesehatan.
                </p>
              </div>
            )}

            {Object.keys(fusedResult.caveats).length > 0 && (
              <div className="p-3 bg-white/10 rounded-lg text-xs text-white flex items-start gap-2 backdrop-blur-xs">
                <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <span>{Object.values(fusedResult.caveats).map(String).join(" ")}</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: ACCORDION & ID PEMERIKSAAN */}
        <section className="space-y-4">
          <div className="w-full bg-surface-container-low border border-outline rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-full p-4 flex items-center justify-between font-bold text-on-surface text-base text-left hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span>Bagaimana SEHATI melakukan skrining?</span>
              {showHowItWorks ? (
                <ChevronUp className="w-5 h-5 text-on-surface" />
              ) : (
                <ChevronDown className="w-5 h-5 text-on-surface" />
              )}
            </button>

            {showHowItWorks && (
              <div className="p-4 border-t border-outline text-sm text-on-surface-variant space-y-2 bg-white animate-fade-in">
                <p>
                  SEHATI mengombinasikan algoritma visi komputer dan kecerdasan buatan untuk mengamati tingkat pucat (pallor) pada konjungtiva mata, kuku jari, dan lipatan telapak tangan.
                </p>
                <p>
                  Sistem mengekstrak fitur warna dan mikrostruktur vaskular permukaan untuk mengestimasi risiko kecenderungan kondisi anemia tanpa menusuk kulit atau mengambil sampel darah.
                </p>
              </div>
            )}
          </div>

          {/* ID Pemeriksaan Box */}
          <div className="w-full py-8 px-6 bg-white rounded-2xl border-2 border-dashed border-outline flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">ID PEMERIKSAAN</span>
            <p className="font-mono text-xl sm:text-2xl text-on-surface font-normal tracking-wide break-all px-2">
              {screeningId}
            </p>
            <button
              type="button"
              onClick={handleCopyId}
              className="pt-2 text-primary text-base font-normal flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              {copiedId ? (
                <>
                  <Check className="w-4 h-4 text-tertiary" />
                  <span className="text-tertiary font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-primary" />
                  <span>Salin ID</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION 4: ACTION BUTTONS */}
        <section className="pt-4 pb-6 border-t border-outline/40 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(ROUTES.PATIENT.HASIL_PENJELASAN)}
            className="w-full sm:flex-1 py-3.5 px-6 border-2 border-primary bg-white text-primary font-bold text-base rounded-xl hover:bg-primary/10 active:scale-[0.98] transition-all cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
          >
            <span>Lihat Penjelasan Hasil</span>
            <ArrowUpRight className="w-5 h-5 text-primary stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 py-3.5 px-6 bg-outline-variant text-on-surface-variant hover:bg-outline font-bold text-base rounded-xl active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Kembali
          </button>
        </section>

      </div>

    </main>
  );
}
