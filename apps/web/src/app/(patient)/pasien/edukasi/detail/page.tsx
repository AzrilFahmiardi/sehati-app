"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Info,
  Activity,
  Heart,
  Brain,
  BatteryLow,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { PatientBottomNavigation } from "@/components/patient/PatientBottomNavigation";

export default function EducationDetailPage() {
  const router = useRouter();

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
            <h1 className="text-on-surface text-lg font-bold tracking-tight">
              Pusat Edukasi
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-8 relative z-10">
        
        {/* Main Article Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-primary text-2xl sm:text-3xl font-bold leading-tight">
            Mengenal Anemia
          </h2>
          <p className="text-on-surface-variant text-base font-normal leading-relaxed">
            Pahami kondisi tubuh Anda, peran hemoglobin, dan mengapa deteksi dini sangat penting untuk kesehatan sirkulasi darah.
          </p>
        </div>

        {/* Hero Image Card Banner */}
        <div className="w-full bg-white rounded-xl border border-outline p-2 shadow-xs overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="w-full h-48 sm:h-60 rounded-lg overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
              alt="Sel Darah Merah & Hemoglobin"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>

        {/* Card 1: Apa itu Anemia? */}
        <div className="w-full bg-gradient-to-br from-surface-container-low to-white rounded-xl border border-outline p-5 shadow-2xs space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center gap-2 text-on-surface font-bold text-base">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <h3>Apa itu Anemia?</h3>
          </div>
          <p className="text-on-surface-variant text-base font-normal leading-relaxed">
            Kondisi medis di mana tubuh kekurangan sel darah merah yang sehat untuk membawa oksigen yang cukup ke jaringan tubuh. Hal ini seringkali menyebabkan perasaan lelah dan lemah secara terus-menerus.
          </p>
        </div>

        {/* SECTION 2: CARA KERJANYA */}
        <section className="space-y-4">
          <h2 className="text-on-surface text-2xl font-bold tracking-tight">
            Cara Kerjanya
          </h2>

          <div className="w-full bg-white rounded-xl border border-outline p-5 space-y-4 shadow-2xs">
            {/* Item 1: Peran Hemoglobin */}
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-primary-bright text-surface-tint rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                <Activity className="w-6 h-6 text-surface-tint" />
              </div>
              <div className="space-y-1">
                <h3 className="text-primary font-bold text-lg">
                  Peran Hemoglobin (Hb)
                </h3>
                <p className="text-on-surface-variant text-base font-normal leading-relaxed">
                  Hemoglobin adalah protein utama dalam sel darah merah. Fungsinya sangat vital: mengikat oksigen dari paru-paru dan mengantarkannya ke seluruh tubuh.
                </p>
              </div>
            </div>

            <div className="border-t border-outline/60 my-2" />

            {/* Item 2: Saat Hb Rendah */}
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-error-container text-error-dark rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                <AlertTriangle className="w-6 h-6 text-error-dark" />
              </div>
              <div className="space-y-1">
                <h3 className="text-on-surface font-bold text-lg">
                  Saat Hb Rendah
                </h3>
                <p className="text-on-surface-variant text-base font-normal leading-relaxed">
                  Jika kadar Hb rendah, organ-organ tubuh kekurangan suplai oksigen yang bertindak sebagai &ldquo;bahan bakar&rdquo; utama mereka.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: DAMPAK TERHADAP TUBUH */}
        <section className="space-y-4">
          <h2 className="text-on-surface text-2xl font-bold tracking-tight">
            Dampak Terhadap Tubuh
          </h2>

          <div className="space-y-3">
            {/* Card 1: Kelelahan Ekstrem */}
            <div className="w-full bg-white rounded-xl border border-outline p-4 flex items-center gap-4 hover:border-primary hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant flex-shrink-0 group-hover:scale-110 transition-transform">
                <BatteryLow className="w-6 h-6 text-on-surface-variant" />
              </div>
              <div className="space-y-1">
                <h3 className="text-on-surface font-bold text-base group-hover:text-primary transition-colors">
                  Kelelahan Ekstrem
                </h3>
                <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                  Kekurangan energi untuk aktivitas sehari-hari, merasa lemas meski sudah beristirahat.
                </p>
              </div>
            </div>

            {/* Grid Row 2 Cards: Beban Jantung & Fokus Menurun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card A: Beban Jantung */}
              <div className="w-full bg-white rounded-xl border border-outline p-4 space-y-2 hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary-alt group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-tertiary-alt" />
                </div>
                <h3 className="text-on-surface font-bold text-base group-hover:text-primary transition-colors">
                  Beban Jantung
                </h3>
                <p className="text-on-surface-variant text-xs font-normal leading-relaxed">
                  Jantung bekerja lebih keras memompa oksigen.
                </p>
              </div>

              {/* Card B: Fokus Menurun */}
              <div className="w-full bg-white rounded-xl border border-outline p-4 space-y-2 hover:border-primary hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-warning-accent rounded-full flex items-center justify-center text-warning-container-lowest group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5 text-warning-container-lowest" />
                </div>
                <h3 className="text-on-surface font-bold text-base group-hover:text-primary transition-colors">
                  Fokus Menurun
                </h3>
                <p className="text-on-surface-variant text-xs font-normal leading-relaxed">
                  Otak kekurangan suplai oksigen optimal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: TAHUKAH ANDA? CALLOUT BOX */}
        <div className="w-full bg-surface-container-high border-l-4 border-primary rounded-r-xl p-5 flex items-start gap-3.5 shadow-xs hover:shadow-md transition-shadow">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-on-surface">Tahukah Anda?</h4>
            <p className="text-on-surface-variant text-base font-normal leading-relaxed">
              Jenis yang paling umum adalah{" "}
              <strong className="font-semibold text-on-surface">Anemia Defisiensi Besi</strong>
              , yang terjadi karena tubuh kekurangan zat besi yang sangat dibutuhkan untuk memproduksi hemoglobin.
            </p>
          </div>
        </div>

        {/* SECTION 5: ACTION BUTTONS STACK */}
        <div className="space-y-3 pt-4">
          <Link
            href={ROUTES.PATIENT.SKRINING_KONDISI}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            <FileCheck2 className="w-5 h-5 text-white" />
            <span>Cek Gejala Anemia Anda</span>
          </Link>

          <Link
            href={ROUTES.PATIENT.EDUKASI}
            className="w-full py-3.5 px-6 border border-outline bg-white hover:bg-surface active:scale-[0.99] text-primary font-bold text-sm sm:text-base rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            <span>Pelajari Faktor Risiko</span>
          </Link>
        </div>

      </div>

      {/* Bottom Navigation Bar */}
      <PatientBottomNavigation />

    </main>
  );
}
