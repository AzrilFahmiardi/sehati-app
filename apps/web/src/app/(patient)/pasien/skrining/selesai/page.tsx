"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  FileEdit,
  ChevronRight,
  Sparkles,
  Edit3,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function ScreeningSuccessPage() {
  const router = useRouter();

  const handleUpdateHealthData = () => {
    router.push(ROUTES.PATIENT.SKRINING_KONDISI);
  };

  const handleGoToResults = () => {
    router.push(ROUTES.PATIENT.HASIL);
  };

  return (
    <main className="min-h-screen w-full bg-surface font-sans pb-24 flex flex-col items-center justify-between select-none overflow-hidden">
      
      {/* Container Frame */}
      <div className="w-full max-w-[448px] mx-auto px-4 py-8 flex flex-col items-center justify-between space-y-8 animate-pop-in">
        
        {/* Top Hero Animation Section */}
        <div className="relative w-full py-6 flex flex-col items-center text-center space-y-4 overflow-hidden">
          
          {/* Radial Cyan Glow Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_68%_73%_at_50%_50%,rgba(134,242,228,0.25)_0%,rgba(134,242,228,0)_70%)] pointer-events-none" />

          {/* Multi-Layered Animated Success Icon */}
          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            
            {/* Concentric Outer Circle 1 (Ping Aura) */}
            <div className="absolute inset-0 border-2 border-tertiary/20 rounded-full animate-ping [animation-duration:3s]" />
            
            {/* Concentric Middle Circle 2 (Pulse Glow) */}
            <div className="absolute inset-4 border-4 border-tertiary/15 rounded-full animate-pulse" />

            {/* Center Cyan Badge with Pop-in Effect */}
            <div className="relative w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center shadow-md animate-pop-in">
              <Check className="w-12 h-12 text-tertiary-alt stroke-[3.5] drop-shadow-xs" />
            </div>

            {/* Sparkle Floating Deco */}
            <Sparkles className="w-5 h-5 text-primary absolute top-2 right-4 animate-float-gentle" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2 relative z-10 px-2">
            <h1 className="text-on-surface text-2xl sm:text-3xl font-semibold leading-snug">
              Skrining Berhasil Dilakukan
            </h1>
            <p className="text-on-surface-variant text-base font-normal leading-relaxed max-w-xs mx-auto">
              Data citra Anda telah berhasil dikirim untuk dianalisis oleh sistem AI SEHATI.
            </p>
          </div>

        </div>

        {/* Card: Bantu Akurasi Analisis */}
        <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          
          {/* Card Header Row */}
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-primary-bright/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
              <FileEdit className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-primary text-sm font-bold leading-tight">
                Bantu Akurasi Analisis
              </h2>
              <p className="text-on-surface-variant text-base font-normal leading-relaxed">
                Informasi tambahan mengenai kondisi Anda saat ini dapat membantu memberikan konteks yang lebih baik pada hasil skrining.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            
            {/* Primary Button: Perbarui Data Kesehatan */}
            <button
              onClick={handleUpdateHealthData}
              className="w-full py-4 px-4 bg-primary hover:bg-primary-deep active:scale-[0.98] text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Perbarui Data Kesehatan</span>
            </button>

            {/* Secondary Link: Lanjut ke Hasil Skrining */}
            <button
              onClick={handleGoToResults}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-surface active:scale-[0.98] text-primary font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Lanjut ke Hasil Skrining</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>

          </div>

        </div>

        {/* AI Status Banner Pill */}
        <div className="w-full py-2.5 px-4 bg-surface-container-high rounded-full border border-outline/30 shadow-2xs flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 bg-tertiary rounded-full animate-ping" />
          <span className="text-on-surface-variant text-sm italic font-medium">
            Sistem AI sedang memproses...
          </span>
        </div>

      </div>

    </main>
  );
}
