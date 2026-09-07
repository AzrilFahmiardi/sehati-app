"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  CheckCircle2,
  Hourglass,
  Circle,
  Microscope,
  FlaskConical,
  Dna,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getRealScreeningStatus } from "@/services/screening";

export default function ScreeningAnalysisProcessingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(10);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const screeningId = sessionStorage.getItem("hv_screening_id");
    const organizationId = sessionStorage.getItem("hv_screening_org");
    if (!screeningId || !organizationId) {
      router.push(ROUTES.PATIENT.SKRINING_PERSIAPAN);
      return;
    }

    let cancelled = false;
    let delayMs = 2000;

    async function poll() {
      try {
        const result = await getRealScreeningStatus(screeningId as string, organizationId as string);
        if (cancelled) return;

        if (result.status === "completed") {
          setProgress(100);
          sessionStorage.setItem("hv_last_screening_id", screeningId as string);
          sessionStorage.setItem("hv_last_screening_org", organizationId as string);
          sessionStorage.removeItem("hv_screening_id");
          sessionStorage.removeItem("hv_screening_org");
          sessionStorage.removeItem("hv_screening_patient");
          sessionStorage.removeItem("hv_screening_idempotency_key");
          sessionStorage.removeItem("hv_screening_uploads");
          sessionStorage.removeItem("hv_screening_submit_uploads");
          sessionStorage.removeItem("hv_screening_previews");
          setTimeout(() => {
            if (!cancelled) router.push(ROUTES.PATIENT.SKRINING_SELESAI);
          }, 700);
          return;
        }

        if (result.status === "failed") {
          setStatusError("Analisis gagal diproses, silakan coba skrining kembali.");
          return;
        }

        setProgress((prev) => Math.min(prev + 15, 90));
        delayMs = Math.min(delayMs * 1.5, 10000);
        setTimeout(poll, delayMs);
      } catch {
        if (!cancelled) setStatusError("Gagal membaca status analisis.");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface via-surface-container-low to-surface font-sans flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
      
      {/* Top Header Glassmorphism Bar */}
      <header className="fixed top-0 inset-x-0 z-30 w-full h-[64px] px-4 sm:px-8 bg-surface/90 backdrop-blur-md border-b border-outline flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-primary text-2xl font-bold font-sans tracking-tight">
            SEHATI
          </h1>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 shadow-xs">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="Profil"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main Analysis Processing Card */}
      <div className="w-full max-w-[672px] mx-auto mt-16 bg-white rounded-2xl border border-outline p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
        
        {/* Header Titles with Floating Text Motion */}
        <div className="text-center space-y-2">
          <h2 className="text-on-surface text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            Menganalisis<br />Skrining Anda
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg font-normal leading-relaxed max-w-sm mx-auto animate-float-gentle">
            Proses ini dapat membutuhkan beberapa saat.
          </p>
        </div>

        {/* Orbiting Satellite Icons in Circle Motion */}
        <div className="relative w-full h-[280px] sm:h-[300px] flex items-center justify-center my-4">
          
          {/* Outer Orbit Circle Guide */}
          <div className="w-64 h-64 rounded-full border-2 border-dashed border-outline relative flex items-center justify-center">
            
            {/* Continuous 360 Degree Orbiting Container for 3 Satellite Icons */}
            <div className="absolute inset-0 rounded-full animate-spin-slow">
              
              {/* Satellite Icon 1: Top (Microscope) */}
              <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 w-12 h-12 bg-surface-container rounded-full border border-outline shadow-sm flex items-center justify-center text-primary hover:scale-110 transition-transform">
                <div className="animate-spin-reverse">
                  <Microscope className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Satellite Icon 2: Bottom Right (Test Tube) */}
              <div className="absolute bottom-[16px] right-[-10px] w-12 h-12 bg-surface-container rounded-full border border-outline shadow-sm flex items-center justify-center text-primary hover:scale-110 transition-transform">
                <div className="animate-spin-reverse">
                  <FlaskConical className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Satellite Icon 3: Bottom Left (DNA) */}
              <div className="absolute bottom-[16px] left-[-10px] w-12 h-12 bg-surface-container rounded-full border border-outline shadow-sm flex items-center justify-center text-primary hover:scale-110 transition-transform">
                <div className="animate-spin-reverse">
                  <Dna className="w-5 h-5 text-primary" />
                </div>
              </div>

            </div>

            {/* Center Pulsing Blue AI Core Hub */}
            <div className="w-24 h-24 bg-primary-bright rounded-full flex items-center justify-center shadow-lg relative z-10 animate-pulse">
              <div className="w-24 h-24 absolute inset-0 bg-primary-bright/30 rounded-full animate-ping pointer-events-none" />
              <BarChart2 className="w-8 h-8 text-white z-10" />
            </div>

          </div>
        </div>

        {statusError && (
          <p className="text-sm text-error font-medium text-center">{statusError}</p>
        )}

        {/* Progress Bar Container with Motion Fill */}
        <div className="w-full max-w-[448px] mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span>Menganalisis citra...</span>
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            </span>
            <span className="font-mono text-primary font-bold">{progress}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden relative shadow-inner">
            
            {/* Dynamic Progress Fill Bar */}
            <div
              className="h-full bg-gradient-to-r from-primary via-primary-bright to-tertiary-container rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Light Moving Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scan-shine" />
            </div>
          </div>
        </div>

        {/* 3 Real-time Checklist Steps */}
        <div className="w-full max-w-[448px] mx-auto space-y-3 pt-2">
          
          {/* Step 1: Memeriksa kualitas akhir */}
          <div className="flex items-center gap-3 text-base">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
            <span className="text-on-surface-variant font-normal">
              Memeriksa kualitas akhir
            </span>
          </div>

          {/* Step 2: Menganalisis citra */}
          <div className="flex items-center gap-3 text-base">
            {progress < 80 ? (
              <Hourglass className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
            )}
            <span
              className={`font-medium ${
                progress >= 35 && progress < 80
                  ? "text-on-surface font-semibold"
                  : "text-on-surface-variant"
              }`}
            >
              Menganalisis citra
            </span>
          </div>

          {/* Step 3: Menggabungkan hasil */}
          <div className="flex items-center gap-3 text-base">
            {progress >= 80 ? (
              <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
            ) : (
              <Circle className="w-5 h-5 text-outline opacity-50 flex-shrink-0" />
            )}
            <span
              className={`${
                progress >= 80
                  ? "text-on-surface font-semibold"
                  : "text-on-surface-variant opacity-60"
              }`}
            >
              Menggabungkan hasil
            </span>
          </div>

        </div>

      </div>

    </main>
  );
}
