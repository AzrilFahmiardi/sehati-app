"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getOwnPatient } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { LastResultCard } from "@/components/patient/LastResultCard";

export default function PatientScreeningOverviewPage() {
  const [latestScreening, setLatestScreening] = useState<ScreeningSummary | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOwnPatient()
      .then((owned) => {
        if (!owned) return [];
        setOrganizationId(owned.organizationId);
        return listScreenings(owned.organizationId, owned.patientId);
      })
      .then((screenings) => setLatestScreening(screenings[0] ?? null))
      .catch(() => setLatestScreening(null))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGoToLatestResult = () => {
    if (!latestScreening || !organizationId) return;
    sessionStorage.setItem("hv_last_screening_id", latestScreening.screeningId);
    sessionStorage.setItem("hv_last_screening_org", organizationId);
  };

  return (
    <main className="min-h-screen w-full bg-surface p-4 sm:p-6 font-sans space-y-6 pb-24">
      <div className="w-full max-w-[640px] mx-auto space-y-6">
        
        {/* Main Hero Card: Skrining Risiko Anemia */}
        <div className="relative w-full bg-primary rounded-xl shadow-md border border-outline p-6 sm:p-8 overflow-hidden text-white space-y-6">
          {/* Subtle Diagonal Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

          {/* Header Title & Subtitle */}
          <div className="space-y-3 text-center relative z-10">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold leading-8">
              Skrining Risiko Anemia
            </h1>
            <p className="text-white/90 text-sm sm:text-base font-normal leading-relaxed max-w-md mx-auto">
              Lakukan skrining awal risiko anemia melalui pengambilan citra mata, kuku/jari, dan telapak tangan.
            </p>
          </div>

          {/* Bullet Features List */}
          <div className="space-y-2 py-2 text-white/90 text-sm font-medium flex flex-col items-center justify-center relative z-10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white flex-shrink-0" />
              <span>Sekitar 3–5 menit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
              <span>Tanpa jarum</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
              <span>Tanpa pengambilan darah</span>
            </div>
          </div>

          {/* Primary Action Button: Mulai Skrining */}
          <div className="relative z-10 pt-2">
            <Link
              href={ROUTES.PATIENT.SKRINING_KONDISI}
              className="w-full py-3.5 px-6 bg-surface hover:bg-white active:scale-[0.99] text-primary font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <span>Mulai Skrining</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Section: Hasil Skrining Terakhir */}
        <div className="space-y-4 pt-2">
          <h2 className="text-on-surface text-2xl font-semibold leading-8">
            Hasil Skrining Terakhir
          </h2>

          <div className="space-y-4">

            {isLoading ? (
              <div className="p-5 bg-white rounded-xl border border-outline shadow-2xs text-center text-on-surface-variant text-sm">
                Memuat hasil terakhir...
              </div>
            ) : (
              <LastResultCard screening={latestScreening} />
            )}

            {latestScreening && (
              <div className="flex justify-end">
                <Link
                  href={ROUTES.PATIENT.HASIL}
                  onClick={handleGoToLatestResult}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium transition-all"
                >
                  <span>Lihat Detail</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}
