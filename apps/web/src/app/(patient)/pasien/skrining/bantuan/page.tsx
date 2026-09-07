"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ImageOff,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function ScreeningImageQualityHelpPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push(ROUTES.PATIENT.BERANDA);
  };

  const handleRetry = () => {
    router.push(ROUTES.PATIENT.SKRINING_CAPTURE);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface via-surface to-surface font-sans flex flex-col items-center justify-between pb-28 select-none overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="w-full h-[56px] px-4 bg-surface border-b border-outline/30 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-on-surface-variant text-sm font-medium">
          Bantuan Skrining
        </h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-[448px] mx-auto px-4 py-8 flex flex-col items-center space-y-8">
        
        {/* Top Hero Edge Case Icon & Description */}
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Grey Circular Icon Badge */}
          <div className="w-24 h-24 bg-surface-container rounded-full border border-outline/50 shadow-xs flex items-center justify-center text-on-surface-muted">
            <ImageOff className="w-10 h-10 stroke-[1.8]" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2 px-2">
            <h2 className="text-on-surface text-2xl sm:text-3xl font-semibold leading-snug tracking-tight">
              Kami Belum Mendapatkan<br />Citra yang Sesuai
            </h2>
            <p className="text-on-surface-variant text-base font-normal leading-relaxed max-w-sm mx-auto">
              Perbedaan kondisi pencahayaan atau karakteristik kamera memengaruhi kualitas gambar. Untuk hasil yang akurat, kami menyarankan metode alternatif.
            </p>
          </div>

        </div>

        {/* Healthcare Worker Alternative Card */}
        <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center gap-3.5 pb-3 border-b border-outline/40">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-on-surface text-lg font-semibold leading-snug">
              Skrining dengan Tenaga<br />Kesehatan
            </h3>
          </div>

          {/* 3 Benefit Items */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-on-surface-variant text-base font-normal leading-snug">
                Kondisi lingkungan dan pencahayaan terkontrol
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-on-surface-variant text-base font-normal leading-snug">
                Dibantu langsung oleh petugas medis berpengalaman
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-on-surface-variant text-base font-normal leading-snug">
                Menggunakan perangkat diagnostik terstandarisasi
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Sticky Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-surface border-t border-outline/30 p-4 z-30 flex justify-center shadow-lg">
        <div className="w-full max-w-[448px] mx-auto">
          <button
            type="button"
            onClick={handleRetry}
            className="group w-full py-3.5 px-6 bg-primary hover:bg-primary-deep active:scale-[0.98] text-white font-medium text-sm rounded-lg shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ulangi Lagi</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

    </main>
  );
}
