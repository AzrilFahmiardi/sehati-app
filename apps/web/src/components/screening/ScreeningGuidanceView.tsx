"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Hand,
  Sparkles,
  AlertTriangle,
  Info,
  ShieldCheck,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ScreeningSiteType = "conjunctiva" | "nail" | "palm";

interface SiteGuidanceDetail {
  site: ScreeningSiteType;
  stepNumber: number;
  badgeLabel: string;
  tabLabel: string;
  icon: typeof Eye;
  title: string;
  subtitle: string;
  targetDescription: string;
  imageSrc: string;
  imageAlt: string;
  imageCaption: string;
  preparationSteps: string[];
  avoidPoints: string[];
  ctaLabel: string;
  usesDarkBox: boolean;
}

const GUIDANCE_DATA: Record<ScreeningSiteType, SiteGuidanceDetail> = {
  conjunctiva: {
    site: "conjunctiva",
    stepNumber: 1,
    badgeLabel: "Situs 1 dari 3: Konjungtiva Mata",
    tabLabel: "Mata (Konjungtiva)",
    icon: Eye,
    title: "Panduan Pengambilan Citra Mata",
    subtitle:
      "Posisikan kelopak mata bawah pasien agar area konjungtiva palpebra inferior terekspos jelas dan bebas pantulan cahaya.",
    targetDescription:
      "Target analisis: Jaringan mikrovaskular pada konjungtiva palpebra inferior (bagian dalam kelopak mata bawah) untuk mendeteksi tingkat kepucatan mukosa.",
    imageSrc: "/guidance/eye-setup.jpg",
    imageAlt: "Panduan Penarikan Konjungtiva Mata",
    imageCaption:
      "Buka perlahan kelopak mata bawah pasien ke arah bawah, arahkan pandangan pasien sedikit ke atas.",
    preparationSteps: [
      "Pastikan pasien duduk dengan posisi tegak, rileks, dan kepala stabil sejajar dengan lensa smartphone.",
      "Minta pasien mengarahkan bola mata sedikit ke atas secara perlahan tanpa menegangkan otot wajah.",
      "Gunakan jari tangan yang bersih/bersarung tangan untuk menarik perlahan kelopak mata bawah ke arah bawah.",
      "Pastikan konjungtiva palpebra (jaringan kemerahan di balik kelopak bawah) terlihat luas dan jelas.",
      "Hindari kilatan cahaya langsung (glare) dari lampu ruangan atau flash yang menyilaukan mata pasien.",
      "Jaga jarak smartphone sekitar 10–15 cm agar area mata terfokus tajam di dalam bingkai panduan kamera.",
    ],
    avoidPoints: [
      "Jangan menekan bola mata pasien secara langsung atau menggunakan tekanan yang menimbulkan rasa nyeri.",
      "Hindari mengambil gambar saat mata pasien sedang berkedip, berair berlebihan, atau memejam.",
      "Jangan biarkan bayangan tangan pemeriksa atau smartphone menghalangi pencahayaan pada konjungtiva.",
      "Hindari penggunaan lampu senter tambahan yang terlalu dekat dan menimbulkan pantulan silau keras.",
    ],
    ctaLabel: "Periksa Kamera Mata",
    usesDarkBox: false,
  },
  nail: {
    site: "nail",
    stepNumber: 2,
    badgeLabel: "Situs 2 dari 3: Kuku & Dasar Jari",
    tabLabel: "Kuku & Jari",
    icon: Sparkles,
    title: "Panduan Pengambilan Citra Kuku & Jari",
    subtitle:
      "Tempatkan jari pasien mendatar pada kotak berlatar hitam matte agar dasar kuku (nail bed) terisolasi secara kontras.",
    targetDescription:
      "Target analisis: Warna dasar kuku (nail bed) dan jaringan kapiler subungual pada jari telunjuk atau jari tengah.",
    imageSrc: "/guidance/nail-setup.jpg",
    imageAlt: "Panduan Posisi Kuku dan Jari di Kotak Latar Hitam",
    imageCaption:
      "Letakkan jari mendatar di dalam kotak akuisisi berlatar hitam matte, kuku menghadap tegak lurus ke atas.",
    preparationSteps: [
      "Gunakan kotak akuisisi berlatar hitam matte terstandar yang telah disiapkan di meja pemeriksaan.",
      "Letakkan jari tangan pasien secara mendatar dan tenang di atas permukaan latar hitam.",
      "Pastikan kuku menghadap langsung ke arah lensa kamera tanpa miring ke samping.",
      "Renggangkan jari sedikit agar kuku tidak saling menutupi atau berhimpitan.",
      "Pastikan permukaan kuku bersih, kering, dan bebas dari cat kuku (kuteks), pewarna henna, atau plester luka.",
      "Posisikan smartphone sejajar secara horizontal tepat di atas kotak akuisisi dengan jarak stabil.",
    ],
    avoidPoints: [
      "Jangan biarkan pasien menekan jari terlalu keras ke alas karena dapat menyebabkan pemucatan buatan (blanching).",
      "Jangan menggunakan latar belakang berpola, bermeja kayu mengilap, atau alas berwarna terang selain hitam matte.",
      "Hindari perhiasan cincin atau aksesoris yang menutupi batas kuku dan lipatan kuku.",
      "Jangan mengambil gambar dengan kemiringan sudut ekstrem; pastikan lensa tegak lurus 90 derajat terhadap kuku.",
    ],
    ctaLabel: "Periksa Kamera Kuku",
    usesDarkBox: true,
  },
  palm: {
    site: "palm",
    stepNumber: 3,
    badgeLabel: "Situs 3 dari 3: Telapak Tangan",
    tabLabel: "Telapak Tangan",
    icon: Hand,
    title: "Panduan Pengambilan Citra Telapak Tangan",
    subtitle:
      "Buka telapak tangan menghadap atas di atas latar hitam matte untuk mengevaluasi warna garis telapak tangan (palmar creases).",
    targetDescription:
      "Target analisis: Garis telapak tangan (palmar creases) dan rona vaskular bantalan tenar/hipotenar untuk mendeteksi tanda kepucatan palmar.",
    imageSrc: "/guidance/palm-setup.jpg",
    imageAlt: "Panduan Posisi Telapak Tangan di Kotak Latar Hitam",
    imageCaption:
      "Buka seluruh permukaan telapak tangan menghadap atas di dalam kotak berlatar hitam matte, jari rileks.",
    preparationSteps: [
      "Letakkan tangan pasien di dalam kotak akuisisi dengan telapak tangan terbuka penuh menghadap ke atas.",
      "Buka seluruh jari tangan secara alami dan rileks tanpa meregangkan otot tangan secara kaku.",
      "Pastikan seluruh bagian telapak tangan hingga pangkal pergelangan tangan berada di dalam batas panduan.",
      "Pastikan pencahayaan ruangan merata menyinari permukaan telapak tanpa bayangan pekat dari smartphone.",
      "Jaga tangan pasien tetap diam dan stabil di atas permukaan datar kotak akuisisi.",
      "Pegang smartphone sejajar tepat di atas telapak tangan pada jarak yang cukup agar seluruh telapak masuk bingkai.",
    ],
    avoidPoints: [
      "Jangan biarkan pasien mengepalkan tangan, menekuk jari, atau membentuk sudut cekung saat pengambilan gambar.",
      "Hindari bayangan tubuh pemeriksa atau smartphone yang jatuh persis di atas garis-garis telapak tangan.",
      "Jangan gunakan gelang, jam tangan, atau kain lengan panjang yang menutupi pangkal telapak tangan.",
      "Hindari permukaan alas yang berdebu, bertekstur kasar berlebihan, atau memantulkan cahaya lampu.",
    ],
    ctaLabel: "Periksa Kamera Telapak",
    usesDarkBox: true,
  },
};

interface ScreeningGuidanceViewProps {
  initialSite?: ScreeningSiteType;
  sessionId: string;
  patientId?: string | null;
  organizationId?: string | null;
  onProceedToCamera: (site: ScreeningSiteType) => void;
  backHref?: string;
}

export function ScreeningGuidanceView({
  initialSite = "conjunctiva",
  onProceedToCamera,
  backHref,
}: ScreeningGuidanceViewProps) {
  const [activeSite, setActiveSite] = useState<ScreeningSiteType>(initialSite);

  // Pre-screening Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    background: true,
    lighting: true,
    targetArea: true,
    stability: true,
  });

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentGuidance = GUIDANCE_DATA[activeSite];
  const SiteIcon = currentGuidance.icon;

  const handleCtaClick = () => {
    onProceedToCamera(activeSite);
  };

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-surface border-b border-outline sticky top-0 z-30 px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className="p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Kembali ke pemilihan area"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          )}

          <div>
            <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider block">
              PERSIAPAN SKRINING KLINIS
            </span>
            <h1 className="text-base sm:text-xl font-bold text-on-surface leading-tight">
              Panduan Akuisisi Citra Terstandar
            </h1>
          </div>
        </div>

        {/* Quick Site Switcher Pills (Header) */}
        <div className="hidden md:flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline">
          {(["conjunctiva", "nail", "palm"] as ScreeningSiteType[]).map((siteKey) => {
            const isCurrent = activeSite === siteKey;
            const item = GUIDANCE_DATA[siteKey];
            const Icon = item.icon;
            return (
              <button
                key={siteKey}
                type="button"
                onClick={() => setActiveSite(siteKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Step Indicator Card (01 Persiapan -> 02 Pengambilan Citra -> 03 Analisis AI) */}
        <div className="w-full bg-white rounded-2xl border border-outline p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Langkah Alur Pemeriksaan
              </span>
              <p className="text-sm font-medium text-on-surface mt-0.5">
                Ikuti instruksi persiapan sebelum menyalakan kamera untuk menghindari pengambilan ulang.
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Step 1: Persiapan (Active) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  1
                </span>
                <span>01 Persiapan</span>
              </div>

              <div className="w-4 h-[2px] bg-outline" />

              {/* Step 2: Pengambilan Citra */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium border border-outline">
                <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs text-on-surface-muted">
                  2
                </span>
                <span>02 Pengambilan Citra</span>
              </div>

              <div className="w-4 h-[2px] bg-outline" />

              {/* Step 3: Analisis AI */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium border border-outline">
                <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs text-on-surface-muted">
                  3
                </span>
                <span>03 Analisis AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline overflow-x-auto">
          {(["conjunctiva", "nail", "palm"] as ScreeningSiteType[]).map((siteKey) => {
            const isCurrent = activeSite === siteKey;
            const item = GUIDANCE_DATA[siteKey];
            const Icon = item.icon;
            return (
              <button
                key={siteKey}
                type="button"
                onClick={() => setActiveSite(siteKey)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Guidance Hero Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <SiteIcon className="w-3.5 h-3.5 text-primary" />
            <span>{currentGuidance.badgeLabel}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {currentGuidance.title}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
            {currentGuidance.subtitle}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Visual Reference + Acquisition Box + Avoid Warnings */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Main Visual Reference Card */}
            <div className="bg-white rounded-2xl border border-outline overflow-hidden shadow-sm">
              <div className="p-3.5 bg-surface-container-low border-b border-outline flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Referensi Visual Posisi
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface text-on-surface-variant border border-outline">
                  Standar SEHATI
                </span>
              </div>

              {/* Image Preview with Medical Reticle Overlay */}
              <div className="relative w-full aspect-square sm:aspect-4/3 lg:aspect-square bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={currentGuidance.imageSrc}
                  alt={currentGuidance.imageAlt}
                  className="w-full h-full object-cover"
                />

                {/* Simulated Clinical Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-white/80 rounded-tl" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-white/80 rounded-tr" />
                  </div>

                  {/* Center Crosshair Target */}
                  <div className="self-center flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-dashed border-white/70 flex items-center justify-center backdrop-blur-xs">
                      <div className="w-2 h-2 rounded-full bg-white/90" />
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-white/80 rounded-bl" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-white/80 rounded-br" />
                  </div>
                </div>

                {/* Subtle Gradient Bottom Scrim */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-3 inset-x-3 text-center">
                  <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white/90 border border-white/20">
                    {currentGuidance.imageCaption}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/50">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-on-surface">Target Pemeriksaan: </span>
                  {currentGuidance.targetDescription}
                </p>
              </div>
            </div>

            {/* Acquisition Box Standard Callout (Shown for Nail & Palm, referenced in photos) */}
            {currentGuidance.usesDarkBox && (
              <div className="bg-white rounded-2xl border border-outline p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-on-surface">
                      Standar Alat Bantu: Kotak Latar Hitam Matte
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      Kotak kardus berlatar hitam matte non-reflektif berfungsi untuk menstandarkan latar belakang dan memaksimalkan kontras deteksi AI.
                    </p>
                  </div>
                </div>

                {/* Large Prominent Image Above Text */}
                <div className="relative w-full overflow-hidden rounded-xl border border-outline bg-slate-900 shadow-2xs group">
                  <img
                    src="/guidance/box-setup.jpg"
                    alt="Kotak pemeriksaan berlatar hitam matte"
                    className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-end justify-between">
                    <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                      Penyiapan Kotak di Meja Pemeriksaan
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-surface-container-low border border-outline/70">
                  <span className="text-xs font-bold text-on-surface block">
                    Kotak Pemeriksaan Fisik Terstandar
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Pastikan permukaan bagian dalam kotak bersih dari debu atau pantulan mengilap. Letakkan smartphone tegak lurus di atas bibir kotak saat memotret.
                  </p>
                  <span className="inline-block text-[11px] text-on-surface-muted font-medium pt-0.5">
                    * Alat bantu standarisasi pencahayaan, bukan alat diagnostik medis.
                  </span>
                </div>
              </div>
            )}

            {/* "Hindari Kesalahan Umum" Card (Proactive Error Prevention) */}
            <div className="bg-warning-container-lowest rounded-2xl border border-warning/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold tracking-tight">
                  Hindari Kesalahan Umum Berikut
                </h4>
              </div>

              <ul className="space-y-2">
                {currentGuidance.avoidPoints.map((point, index) => (
                  <li
                    key={index}
                    className="text-xs text-on-surface-variant leading-relaxed flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN: Instructions + Interactive Checklist + Quality Info + CTA */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Instruction Steps Card */}
            <div className="bg-white rounded-2xl border border-outline p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-outline pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-on-surface leading-tight">
                      Langkah Posisi & Penyiapan
                    </h3>
                    <span className="text-xs text-on-surface-variant">
                      Lakukan langkah-langkah ini sebelum menekan tombol periksa kamera
                    </span>
                  </div>
                </div>
              </div>

              {/* Numbered / Checkmark Step List */}
              <div className="space-y-3.5">
                {currentGuidance.preparationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/60 border border-outline/50 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed flex-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive "Daftar Periksa Sebelum Mulai" Card */}
            <div className="bg-white rounded-2xl border border-outline p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary stroke-[2.5]" />
                  Daftar Periksa Sebelum Mulai
                </h3>
                <span className="text-xs text-on-surface-variant font-medium">
                  Verifikasi mandiri oleh nakes
                </span>
              </div>

              <div className="space-y-2.5">
                <label
                  onClick={() => toggleChecklist("background")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline cursor-pointer select-none transition-all hover:bg-surface-container-low"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.background}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface font-medium leading-tight">
                    {currentGuidance.usesDarkBox
                      ? "Latar belakang hitam matte / kotak akuisisi sudah bersih dan siap"
                      : "Posisi duduk pasien nyaman dan kepala stabil lurus menghadap depan"}
                  </span>
                </label>

                <label
                  onClick={() => toggleChecklist("lighting")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline cursor-pointer select-none transition-all hover:bg-surface-container-low"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.lighting}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface font-medium leading-tight">
                    Pencahayaan ruangan cukup merata tanpa bayangan tajam menutupi target
                  </span>
                </label>

                <label
                  onClick={() => toggleChecklist("targetArea")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline cursor-pointer select-none transition-all hover:bg-surface-container-low"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.targetArea}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface font-medium leading-tight">
                    Area target pemeriksaan terlihat utuh dan bebas halangan aksesoris
                  </span>
                </label>

                <label
                  onClick={() => toggleChecklist("stability")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline cursor-pointer select-none transition-all hover:bg-surface-container-low"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.stability}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface font-medium leading-tight">
                    Posisi pasien dan smartphone stabil serta siap diarahkan ke bingkai kamera
                  </span>
                </label>
              </div>
            </div>

            {/* AI Automated Quality Control Callout */}
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4 sm:p-5 flex items-start gap-3.5">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Pemeriksaan Kualitas Otomatis
                </span>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  SEHATI akan memeriksa kualitas citra secara otomatis (fokus ketajaman, kecukupan cahaya, dan kesesuaian posisi) sebelum gambar digunakan untuk analisis estimasi hemoglobin.
                </p>
              </div>
            </div>

            {/* Primary Action Button Container */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCtaClick}
                rightIcon={<ArrowRight className="w-5 h-5 shrink-0" />}
                className="w-full py-4 text-base font-bold rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex flex-row items-center justify-center"
              >
                {currentGuidance.ctaLabel}
              </Button>

              <p className="text-center text-xs text-on-surface-muted mt-2.5">
                Kamera smartphone baru akan diaktifkan setelah Anda menekan tombol di atas.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
