"use client";

import React from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function PatientEntryPage() {
  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between items-center relative overflow-hidden px-6 py-8">
      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-light/30 to-transparent pointer-events-none" />

      {/* Top Brand Header */}
      <div className="z-10 pt-4 flex items-center justify-center gap-2">
        <img
          src="/sehati-logo.png"
          alt="SEHATI Logo"
          className="w-7 h-7 object-contain drop-shadow-sm"
        />
        <span className="text-primary font-bold text-lg tracking-tight">
          SEHATI
        </span>
      </div>

      {/* Main Hero & Mascot Illustration */}
      <div className="z-10 flex flex-col items-center text-center my-auto space-y-8 max-w-sm">
        {/* Mascot Graphic with Glow Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-tertiary-muted/20 to-error-light/20 blur-xl transform scale-90" />
          <img
            src="/sehati-logo.png"
            alt="SEHATI Mascot"
            className="w-56 h-56 sm:w-64 sm:h-64 object-contain relative z-10 animate-bounce-subtle drop-shadow-md"
          />
        </div>

        {/* Hero Text */}
        <div className="space-y-3 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-snug tracking-tight">
            Kenali Risiko Anemia Lebih Awal
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Akses hasil skrining, riwayat pemeriksaan, dan rekomendasi tindak lanjut Anda dalam satu tempat.
          </p>
        </div>
      </div>

      {/* Bottom Action Area & Disclaimer */}
      <div className="z-10 w-full max-w-sm space-y-5 pb-6">
        <div className="space-y-3">
          <Link
            href={ROUTES.PUBLIC.LOGIN_PASIEN}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center cursor-pointer"
          >
            Masuk
          </Link>

          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="w-full py-3.5 bg-white border border-outline text-primary hover:bg-surface-container-low active:scale-95 font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer"
          >
            Daftar Akun
          </Link>
        </div>

        <p className="text-xs text-on-surface-variant/80 text-center leading-normal px-2">
          SEHATI merupakan alat bantu skrining awal dan tidak menggantikan diagnosis tenaga kesehatan.
        </p>
      </div>
    </div>
  );
}
