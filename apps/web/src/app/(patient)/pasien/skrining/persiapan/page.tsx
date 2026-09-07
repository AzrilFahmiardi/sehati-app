"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sun,
  Camera,
  AlertCircle,
  Scan,
  Info,
  Video,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { startRealScreening } from "@/services/screening";

export default function PreScreeningPreparationPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCameraCheck = async () => {
    setError(null);
    const patientId = sessionStorage.getItem("hv_patient_id") || "patient-demo-01";
    const organizationId = sessionStorage.getItem("hv_org_id") || "org-demo-01";

    setIsStarting(true);
    try {
      const idempotencyKey = `web-${patientId}-${Date.now()}`;
      try {
        const screening = await startRealScreening(
          patientId,
          organizationId,
          undefined,
          idempotencyKey
        );
        sessionStorage.setItem("hv_screening_id", screening.screeningId);
        sessionStorage.setItem("hv_screening_uploads", JSON.stringify(screening.uploads));
      } catch {
        sessionStorage.setItem("hv_screening_id", `screening-${Date.now().toString(36)}`);
      }
      sessionStorage.setItem("hv_screening_org", organizationId);
      sessionStorage.setItem("hv_screening_patient", patientId);
      sessionStorage.setItem("hv_screening_idempotency_key", idempotencyKey);
      sessionStorage.removeItem("hv_screening_submit_uploads");
      sessionStorage.removeItem("hv_screening_previews");
      router.push(ROUTES.PATIENT.SKRINING_PERIKSA_KAMERA);
    } catch {
      setError("Gagal memulai sesi skrining, silakan coba lagi.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-surface font-sans relative pb-28">
      
      {/* Top Sticky Header */}
      <header className="bg-surface border-b border-outline sticky top-0 z-30 px-4 h-16 flex items-center gap-3">
        <Link
          href={ROUTES.PATIENT.SKRINING_GEJALA}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 text-on-surface-variant transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-primary text-base font-bold leading-8 tracking-tight">
          Sebelum Memulai
        </h1>
      </header>

      <div className="w-full max-w-[640px] mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Intro Subtext */}
        <p className="text-on-surface-variant text-base font-normal leading-relaxed">
          Untuk memastikan akurasi analisis SEHATI, pastikan Anda mempersiapkan 3 area pengambilan gambar dengan benar.
        </p>

        {/* 3 Preparation Cards Grid */}
        <div className="space-y-4">
          
          {/* Card 1: 1. Mata (Konjungtiva) */}
          <div className="bg-white rounded-xl border border-outline shadow-2xs overflow-hidden">
            <div className="relative w-full h-32 bg-surface-container-low flex items-end p-2.5 sm:p-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                alt="Konjungtiva Mata"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 px-2.5 py-1.5 bg-surface/85 backdrop-blur-md rounded border border-white/50">
                <span className="text-primary text-sm font-bold leading-5">
                  1. Mata (Konjungtiva)
                </span>
              </div>
            </div>
            <div className="p-3 text-center bg-white">
              <p className="text-on-surface-variant text-sm font-normal leading-5">
                Tarik perlahan kelopak mata bawah.
              </p>
            </div>
          </div>

          {/* Card 2: 2. Kuku Jari */}
          <div className="bg-white rounded-xl border border-outline shadow-2xs overflow-hidden">
            <div className="relative w-full h-32 bg-surface-container-low flex items-end p-2.5 sm:p-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80"
                alt="Kuku Jari"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 px-2.5 py-1.5 bg-surface/85 backdrop-blur-md rounded border border-white/50">
                <span className="text-primary text-sm font-bold leading-5">
                  2. Kuku Jari
                </span>
              </div>
            </div>
            <div className="p-3 text-center bg-white">
              <p className="text-on-surface-variant text-sm font-normal leading-5">
                Pastikan kuku bersih tanpa pewarna.
              </p>
            </div>
          </div>

          {/* Card 3: 3. Telapak Tangan */}
          <div className="bg-white rounded-xl border border-outline shadow-2xs overflow-hidden">
            <div className="relative w-full h-32 bg-surface-container-low flex items-end p-2.5 sm:p-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80"
                alt="Telapak Tangan"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 px-2.5 py-1.5 bg-surface/85 backdrop-blur-md rounded border border-white/50">
                <span className="text-primary text-sm font-bold leading-5">
                  3. Telapak Tangan
                </span>
              </div>
            </div>
            <div className="p-3 text-center bg-white">
              <p className="text-on-surface-variant text-sm font-normal leading-5">
                Buka telapak tangan sepenuhnya.
              </p>
            </div>
          </div>

        </div>

        {/* Section: Persiapan Lingkungan */}
        <div className="bg-white rounded-xl border border-outline shadow-2xs p-5 sm:p-6 space-y-4">
          <h2 className="text-on-surface text-2xl font-semibold leading-8 pb-2 border-b border-outline">
            Persiapan Lingkungan
          </h2>

          <div className="space-y-4 pt-1">
            
            {/* Requirement 1: Pencahayaan cukup */}
            <div className="flex items-start gap-3">
              <Sun className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-on-surface text-sm font-medium leading-5">
                  Pencahayaan cukup
                </h3>
                <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                  Gunakan cahaya ruangan yang terang dan merata.
                </p>
              </div>
            </div>

            {/* Requirement 2: Kamera bersih */}
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-on-surface text-sm font-medium leading-5">
                  Kamera bersih
                </h3>
                <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                  Bersihkan lensa kamera perangkat Anda dari noda atau sidik jari.
                </p>
              </div>
            </div>

            {/* Requirement 3: Hindari cahaya langsung */}
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-on-surface text-sm font-medium leading-5">
                  Hindari cahaya langsung
                </h3>
                <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                  Jangan membelakangi jendela atau sumber cahaya kuat (backlight).
                </p>
              </div>
            </div>

            {/* Requirement 4: Ikuti panduan layar */}
            <div className="flex items-start gap-3">
              <Scan className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-on-surface text-sm font-medium leading-5">
                  Ikuti panduan layar
                </h3>
                <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
                  Posisikan area tubuh tepat di dalam garis panduan pada layar kamera nanti.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Alert Banner: Penting */}
        <div className="p-4 sm:p-5 bg-tertiary-container/20 border border-tertiary-container rounded-xl flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
          <p className="text-tertiary-alt text-base font-bold leading-relaxed">
            Penting: <span className="font-semibold">Kualitas gambar dapat memengaruhi hasil skrining. Ikuti petunjuk di atas untuk hasil analisis hematologi yang optimal.</span>
          </p>
        </div>

      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline p-4 shadow-[0px_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-[640px] mx-auto space-y-2">
          {error && <p className="text-sm text-error font-medium text-center">{error}</p>}
          <button
            onClick={handleStartCameraCheck}
            disabled={isStarting}
            className="w-full py-3.5 px-4 bg-primary-bright hover:bg-primary active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Video className="w-5 h-5" />
            <span>{isStarting ? "Memulai Sesi..." : "Periksa Kamera"}</span>
          </button>
        </div>
      </div>

    </main>
  );
}
