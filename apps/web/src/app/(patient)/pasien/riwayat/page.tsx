"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getOwnPatient } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { HemoglobinTrendCard } from "@/components/patient/HemoglobinTrendCard";

const WHO_LABELS: Record<string, string> = {
  normal: "Normal",
  mild: "Anemia Ringan",
  moderate: "Anemia Sedang",
  severe: "Anemia Berat",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PatientHistoryPage() {
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getOwnPatient()
      .then((owned) => {
        if (!owned) {
          return [];
        }
        setOrganizationId(owned.organizationId);
        return listScreenings(owned.organizationId, owned.patientId);
      })
      .then(setScreenings)
      .catch(() => setLoadError("Gagal memuat riwayat skrining."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-8 pb-32">

      {/* Notice Info Card */}
      <div className="w-full bg-surface-container-low border border-outline rounded-xl p-4 flex items-start gap-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300 group">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <p className="text-on-surface-variant text-base font-normal leading-relaxed">
          Riwayat ini membantu Anda melihat perubahan hasil skrining dari waktu ke waktu.
        </p>
      </div>

      {/* SECTION 1: GARIS WAKTU (TIMELINE) */}
      <section className="space-y-4">
        <h2 className="text-on-surface text-2xl font-bold tracking-tight">
          Garis Waktu
        </h2>

        {loadError && (
          <p className="text-sm text-error font-medium">{loadError}</p>
        )}

        {isLoading ? (
          <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs text-center text-on-surface-variant text-sm">
            Memuat riwayat...
          </div>
        ) : screenings.length === 0 ? (
          <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs text-center text-on-surface-variant text-sm">
            Belum ada riwayat skrining.
          </div>
        ) : (
          <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs relative space-y-6 overflow-hidden">
            {/* Vertical Timeline Connecting Line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-outline" />

            {screenings.map((screening) => {
              const isNormal = screening.whoCategory === "normal";
              return (
                <div key={screening.screeningId} className="flex items-start gap-4 relative z-10 group">
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-xs flex-shrink-0 mt-1 group-hover:scale-110 transition-transform ${
                      isNormal
                        ? "bg-outline-variant text-on-surface"
                        : "bg-tertiary-container text-tertiary-alt"
                    }`}
                  >
                    {isNormal ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <Link
                    href={ROUTES.PATIENT.HASIL_DETAIL}
                    onClick={() => {
                      sessionStorage.setItem("hv_last_screening_id", screening.screeningId);
                      if (organizationId) {
                        sessionStorage.setItem("hv_last_screening_org", organizationId);
                      }
                    }}
                    className="flex-1 bg-surface border border-outline hover:border-primary rounded-xl p-4 space-y-2 group/card hover:shadow-md transition-all duration-300 block cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-on-surface-variant text-sm font-semibold">
                        {formatDate(screening.createdAt)}
                      </span>
                      <span
                        className={`text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs ${
                          isNormal ? "bg-tertiary" : "bg-warning-accent"
                        }`}
                      >
                        {screening.whoCategory ? WHO_LABELS[screening.whoCategory] ?? screening.whoCategory : screening.status}
                      </span>
                    </div>

                    <h3 className="text-on-surface text-lg font-bold group-hover/card:text-primary transition-colors flex items-center justify-between">
                      <span>Hasil Skrining</span>
                      <ChevronRight className="w-4 h-4 text-on-surface-muted group-hover/card:translate-x-1 transition-transform" />
                    </h3>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: TREN HEMOGLOBIN */}
      <section className="space-y-4">
        <h2 className="text-on-surface text-2xl font-bold tracking-tight">
          Tren Hemoglobin
        </h2>
        <HemoglobinTrendCard screenings={screenings} />
      </section>

    </div>
  );
}
