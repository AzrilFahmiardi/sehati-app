"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  Hand,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { startRealScreening } from "@/services/screening";

type SiteType = "conjunctiva" | "nail" | "palm";

export default function MultiSiteScreeningPage() {
  return (
    <Suspense>
      <MultiSiteScreeningContent />
    </Suspense>
  );
}

function MultiSiteScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const organizationId = searchParams.get("organizationId");

  // Active selected site: 'eye', 'nail', or 'palm'
  const [selectedSite, setSelectedSite] = useState<SiteType>("conjunctiva");

  // State for site progress
  const [eyeStatus, setEyeStatus] = useState<"pending" | "completed">("pending");
  const [nailStatus, setNailStatus] = useState<"pending" | "completed">("pending");
  const [palmStatus, setPalmStatus] = useState<"pending" | "completed">("pending");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStartCapture = async (site: SiteType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSite(site);

    const activePatientId =
      patientId || sessionStorage.getItem("hv_screening_patient") || "ID-DEMO-01";
    const activeOrgId =
      organizationId || sessionStorage.getItem("hv_screening_org") || "ORG-DEMO-01";

    setStartError(null);
    setIsStarting(true);
    try {
      let screeningId = sessionStorage.getItem("hv_screening_id");
      let idempotencyKey = sessionStorage.getItem("hv_screening_idempotency_key");
      if (!screeningId || !idempotencyKey) {
        idempotencyKey = `web-${activePatientId}-${Date.now()}`;
        try {
          const created = await startRealScreening(
            activePatientId,
            activeOrgId,
            undefined,
            idempotencyKey
          );
          screeningId = created.screeningId;
          sessionStorage.setItem(
            "hv_screening_uploads",
            JSON.stringify(created.uploads)
          );
        } catch {
          screeningId = `screening-${Date.now().toString(36)}`;
        }
        sessionStorage.setItem("hv_screening_id", screeningId);
        sessionStorage.setItem("hv_screening_org", activeOrgId);
        sessionStorage.setItem("hv_screening_patient", activePatientId);
        sessionStorage.setItem("hv_screening_idempotency_key", idempotencyKey);
      }
      router.push(
        `/nakes/skrining/panduan/${screeningId}?site=${site}&patientId=${activePatientId}&organizationId=${activeOrgId}`
      );
    } catch {
      setStartError("Gagal memulai sesi skrining, coba lagi.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-36 space-y-10">
        {/* Stepper Card (7 Steps) */}
        <div className="w-full bg-surface rounded-xl outline outline-1 outline-outline p-6 shadow-sm overflow-x-auto">
          <div className="min-w-[768px] flex items-center justify-between relative px-2">
            {/* Step 1: Data Pasien */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-sm font-medium text-on-surface">Data Pasien</span>
            </div>

            {/* Line 1-2 */}
            <div className="flex-1 h-[2px] bg-primary mx-2" />

            {/* Step 2: Persiapan */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-sm font-medium text-on-surface">Persiapan</span>
            </div>

            {/* Line 2-3 */}
            <div className="flex-1 h-[2px] bg-primary mx-2" />

            {/* Step 3: Mata */}
            <div className="flex flex-col items-center gap-2 z-10 cursor-pointer" onClick={() => setSelectedSite("conjunctiva")}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  selectedSite === "conjunctiva"
                    ? "bg-primary outline outline-2 outline-primary outline-offset-[-2px] text-white scale-110 shadow-sm"
                    : eyeStatus === "completed"
                    ? "bg-primary text-white"
                    : "bg-surface outline outline-2 outline-outline outline-offset-[-2px] text-on-surface-variant"
                }`}
              >
                {eyeStatus === "completed" ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
              </div>
              <span className={`text-sm transition-colors ${selectedSite === "conjunctiva" ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
                Mata
              </span>
            </div>

            {/* Line 3-4 */}
            <div className={`flex-1 h-[2px] mx-2 transition-all ${selectedSite === "nail" || selectedSite === "palm" || nailStatus === "completed" ? "bg-primary" : "bg-outline"}`} />

            {/* Step 4: Kuku/Jari */}
            <div className="flex flex-col items-center gap-2 z-10 cursor-pointer" onClick={() => setSelectedSite("nail")}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  selectedSite === "nail"
                    ? "bg-primary outline outline-2 outline-primary outline-offset-[-2px] text-white scale-110 shadow-sm"
                    : nailStatus === "completed"
                    ? "bg-primary text-white"
                    : "bg-surface outline outline-2 outline-outline outline-offset-[-2px] text-on-surface-variant"
                }`}
              >
                {nailStatus === "completed" ? <Check className="w-4 h-4 stroke-[3]" /> : "4"}
              </div>
              <span className={`text-sm transition-colors ${selectedSite === "nail" ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
                Kuku/Jari
              </span>
            </div>

            {/* Line 4-5 */}
            <div className={`flex-1 h-[2px] mx-2 transition-all ${selectedSite === "palm" || palmStatus === "completed" ? "bg-primary" : "bg-outline opacity-50"}`} />

            {/* Step 5: Telapak */}
            <div className="flex flex-col items-center gap-2 z-10 cursor-pointer" onClick={() => setSelectedSite("palm")}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 ${
                  selectedSite === "palm"
                    ? "bg-primary outline outline-2 outline-primary outline-offset-[-2px] text-white scale-110 shadow-sm"
                    : palmStatus === "completed"
                    ? "bg-primary text-white"
                    : "bg-surface outline outline-2 outline-outline outline-offset-[-2px] text-on-surface-variant"
                }`}
              >
                {palmStatus === "completed" ? <Check className="w-4 h-4 stroke-[3]" /> : "5"}
              </div>
              <span className={`text-sm transition-colors ${selectedSite === "palm" ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
                Telapak
              </span>
            </div>

            {/* Line 5-6 */}
            <div className="flex-1 h-[2px] bg-outline opacity-50 mx-2" />

            {/* Step 6: Analisis */}
            <div className="flex flex-col items-center gap-2 opacity-50 z-10">
              <div className="w-8 h-8 rounded-full bg-surface outline outline-2 outline-outline outline-offset-[-2px] flex items-center justify-center text-on-surface-variant font-bold text-base">
                6
              </div>
              <span className="text-sm font-medium text-on-surface-variant">Analisis</span>
            </div>
          </div>
        </div>

        {/* Title & Description Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-[32px] font-semibold text-on-surface tracking-tight leading-tight">
            Pemeriksaan Multi-Site
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            SEHATI menggunakan analisis citra multi-site (mata, kuku, dan telapak tangan) untuk memberikan penilaian risiko anemia yang komprehensif dan akurat.
          </p>
          {startError && (
            <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium max-w-lg mx-auto">
              {startError}
            </div>
          )}
        </div>

        {/* 3 Inspection Site Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Konjungtiva Mata */}
          <div
            onClick={() => setSelectedSite("conjunctiva")}
            className={`bg-surface rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] ${
              selectedSite === "conjunctiva"
                ? "outline outline-2 outline-primary shadow-lg scale-[1.02] opacity-100"
                : "outline outline-1 outline-outline opacity-70 hover:opacity-100 hover:shadow-md"
            }`}
          >
            {/* Soft Blue Tint Overlay when Active */}
            {selectedSite === "conjunctiva" && (
              <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300" />
            )}

            {/* Icon Badge */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 z-10 transition-all duration-300 ${
                selectedSite === "conjunctiva"
                  ? "bg-primary/20 text-primary scale-105"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <Eye className="w-7 h-7" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-semibold text-on-surface mb-2 z-10">
              Konjungtiva Mata
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed mb-6 flex-1 z-10">
              Pengambilan gambar palpebra inferior untuk analisis pucat.
            </p>

            {/* Status Pill */}
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 mb-6 z-10 transition-all ${selectedSite === "conjunctiva" ? "bg-surface-container border border-outline" : "bg-surface border border-outline"}`}>
              <div className={`w-2 h-2 rounded-full ${eyeStatus === "completed" ? "bg-tertiary" : "bg-on-surface-muted"}`} />
              <span className="text-sm font-medium text-on-surface-variant">
                {eyeStatus === "completed" ? "Selesai diperiksa" : "Belum diperiksa"}
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => handleStartCapture("conjunctiva", e)}
              disabled={isStarting}
              className={`w-full py-3 text-white font-medium text-sm rounded-lg transition-all shadow-md cursor-pointer z-10 active:scale-[0.97] ${
                selectedSite === "conjunctiva"
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              Mulai Pemeriksaan Mata
            </button>
          </div>

          {/* Card 2: Kuku & Jari */}
          <div
            onClick={() => setSelectedSite("nail")}
            className={`bg-surface rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] ${
              selectedSite === "nail"
                ? "outline outline-2 outline-primary shadow-lg scale-[1.02] opacity-100"
                : "outline outline-1 outline-outline opacity-70 hover:opacity-100 hover:shadow-md"
            }`}
          >
            {/* Soft Blue Tint Overlay when Active */}
            {selectedSite === "nail" && (
              <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300" />
            )}

            {/* Icon Badge */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 z-10 transition-all duration-300 ${
                selectedSite === "nail"
                  ? "bg-primary/20 text-primary scale-105"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <Hand className="w-7 h-7" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-semibold text-on-surface mb-2 z-10">
              Kuku & Jari
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed mb-6 flex-1 z-10">
              Analisis kapiler dan warna dasar kuku (nail bed).
            </p>

            {/* Status Pill */}
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 mb-6 z-10 transition-all ${selectedSite === "nail" ? "bg-surface-container border border-outline" : "bg-surface border border-outline"}`}>
              <div className={`w-2 h-2 rounded-full ${nailStatus === "completed" ? "bg-tertiary" : "bg-on-surface-muted"}`} />
              <span className="text-sm font-medium text-on-surface-variant">
                {nailStatus === "completed" ? "Selesai diperiksa" : "Belum diperiksa"}
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => handleStartCapture("nail", e)}
              disabled={isStarting}
              className={`w-full py-3 text-white font-medium text-sm rounded-lg transition-all shadow-md cursor-pointer z-10 active:scale-[0.97] ${
                selectedSite === "nail"
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              Mulai Pemeriksaan Kuku
            </button>
          </div>

          {/* Card 3: Telapak Tangan */}
          <div
            onClick={() => setSelectedSite("palm")}
            className={`bg-surface rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] ${
              selectedSite === "palm"
                ? "outline outline-2 outline-primary shadow-lg scale-[1.02] opacity-100"
                : "outline outline-1 outline-outline opacity-70 hover:opacity-100 hover:shadow-md"
            }`}
          >
            {/* Soft Blue Tint Overlay when Active */}
            {selectedSite === "palm" && (
              <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300" />
            )}

            {/* Icon Badge */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 z-10 transition-all duration-300 ${
                selectedSite === "palm"
                  ? "bg-primary/20 text-primary scale-105"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <Hand className="w-7 h-7" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-semibold text-on-surface mb-2 z-10">
              Telapak Tangan
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed mb-6 flex-1 z-10">
              Evaluasi warna garis tangan (palmar creases).
            </p>

            {/* Status Pill */}
            <div className={`px-3 py-1 rounded-full flex items-center gap-2 mb-6 z-10 transition-all ${selectedSite === "palm" ? "bg-surface-container border border-outline" : "bg-surface border border-outline"}`}>
              <div className={`w-2 h-2 rounded-full ${palmStatus === "completed" ? "bg-tertiary" : "bg-on-surface-muted"}`} />
              <span className="text-sm font-medium text-on-surface-variant">
                {palmStatus === "completed" ? "Selesai diperiksa" : "Belum diperiksa"}
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => handleStartCapture("palm", e)}
              disabled={isStarting}
              className={`w-full py-3 text-white font-medium text-sm rounded-lg transition-all shadow-md cursor-pointer z-10 active:scale-[0.97] ${
                selectedSite === "palm"
                  ? "bg-primary hover:bg-primary-dark"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              Mulai Pemeriksaan Telapak
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
