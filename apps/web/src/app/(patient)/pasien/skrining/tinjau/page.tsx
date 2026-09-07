"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Hand,
  Sparkles,
  BarChart2,
  Loader2,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { submitRealScreening, SubmitUpload } from "@/services/screening";

const SITE_META: Record<string, { title: string; icon: typeof Eye }> = {
  conjunctiva: { title: "Mata (Konjungtiva)", icon: Eye },
  nail: { title: "Kuku Jari", icon: Sparkles },
  palm: { title: "Telapak Tangan", icon: Hand },
};

const SITE_ORDER = ["conjunctiva", "nail", "palm"];

export default function ImageAnalysisReadinessPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const screeningId = sessionStorage.getItem("hv_screening_id");
    const storedPreviews = sessionStorage.getItem("hv_screening_previews");
    if (!screeningId || !storedPreviews) {
      router.push(ROUTES.PATIENT.SKRINING_PERSIAPAN);
      return;
    }
    setPreviews(JSON.parse(storedPreviews));
  }, [router]);

  const capturedSites = SITE_ORDER.filter((site) => previews[site]);

  const handleStartAnalysis = async () => {
    setSubmitError(null);
    setIsAnalyzing(true);
    try {
      const screeningId = sessionStorage.getItem("hv_screening_id");
      const organizationId = sessionStorage.getItem("hv_screening_org");
      const stored = sessionStorage.getItem("hv_screening_submit_uploads");
      if (!screeningId || !organizationId || !stored) {
        throw new Error("Konteks sesi skrining tidak lengkap");
      }
      const uploads: SubmitUpload[] = JSON.parse(stored);
      await submitRealScreening(screeningId, organizationId, uploads);
      router.push(ROUTES.PATIENT.SKRINING_PROSES);
    } catch {
      setSubmitError("Gagal mengirim citra untuk dianalisis, silakan coba lagi.");
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface via-surface-container-low to-surface font-sans pb-24 select-none">
      
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 w-full h-[64px] px-4 bg-surface/90 backdrop-blur-md border-b border-outline flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.PATIENT.SKRINING_CAPTURE}
            className="p-2 rounded-full hover:bg-black/5 active:scale-95 text-on-surface-variant transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-primary text-2xl font-bold font-sans tracking-tight">
              SEHATI
            </h1>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
        </div>

        {/* Profile Avatar Badge */}
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 shadow-xs hover:scale-110 transition-transform cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="Profil Pasien"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[640px] mx-auto px-4 py-8 space-y-8">
        
        {/* Title & Description Header with Animated Sparkle Icon */}
        <div className="space-y-3 text-center animate-pop-in">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-semibold tracking-wide uppercase shadow-xs">
            <Zap className="w-3.5 h-3.5 text-primary animate-bounce" />
            <span>Kualitas Citra Optimal</span>
          </div>
          <h2 className="text-on-surface text-2xl sm:text-3xl font-bold leading-tight">
            Citra Siap Dianalisis
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg font-normal leading-relaxed max-w-md mx-auto">
            Pastikan semua citra memenuhi standar sebelum memulai proses analisis hematologi AI.
          </p>
        </div>

        {/* Captured Images Cards with Staggered Motion Animations */}
        <div className="space-y-6">
          {capturedSites.map((site, index) => {
            const meta = SITE_META[site];
            const IconComponent = meta.icon;
            return (
              <div
                key={site}
                className="bg-white rounded-2xl border border-outline p-4 shadow-sm hover:shadow-lg transition-all duration-500 space-y-4 group hover:border-primary/50 animate-pop-in relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Image Container with Dark Gradient Overlay & Scan Shine */}
                <div className="relative w-full h-[220px] sm:h-[243px] rounded-xl overflow-hidden bg-outline-variant shadow-inner group-hover:shadow-md transition-all duration-500">
                  <img
                    src={previews[site]}
                    alt={meta.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out filter brightness-95"
                  />

                  {/* Subtle Laser Scan Line Effect */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-tertiary-container to-transparent shadow-scan-line animate-scan-shine pointer-events-none" />

                  {/* Gradient Overlay & Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm drop-shadow-md">
                      <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span>{meta.title}</span>
                    </div>
                  </div>
                </div>

                {/* Quality Standard Status Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-tertiary font-semibold text-sm">
                    <div className="w-6 h-6 rounded-full bg-tertiary-container/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-tertiary animate-pulse" />
                    </div>
                    <span>Citra terunggah</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Readiness & Action Card with Motion Glow */}
        <div className="bg-white rounded-2xl border border-outline p-6 shadow-md space-y-6 transition-all duration-300 hover:shadow-xl animate-pop-in relative overflow-hidden" style={{ animationDelay: "450ms" }}>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary-alt flex-shrink-0 shadow-sm animate-float-gentle">
              <CheckCircle2 className="w-6 h-6 text-tertiary-alt" />
            </div>
            <div className="space-y-1">
              <h3 className="text-on-surface text-xl font-bold leading-snug">
                Kesiapan Analisis
              </h3>
              <p className="text-on-surface-variant text-base font-normal leading-relaxed">
                {capturedSites.length} dari 3 citra siap dikirim untuk dianalisis.
              </p>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-error font-medium text-center">{submitError}</p>
          )}

          {/* Primary Action Button with Gradient Motion & Shimmer */}
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary-bright to-primary hover:from-primary hover:to-primary-deep active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-md hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 relative overflow-hidden"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span>Memproses Analisis Hematologi...</span>
              </>
            ) : (
              <>
                <BarChart2 className="w-5 h-5 text-white animate-pulse" />
                <span>Mulai Analisis</span>
              </>
            )}
          </button>
        </div>

      </div>

    </main>
  );
}
