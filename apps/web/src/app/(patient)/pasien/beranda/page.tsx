"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Stethoscope,
  FileBarChart2,
  History,
  BookOpen,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Claim, getMyClaim, getOwnPatient, requestClaim } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";

const WHO_LABELS: Record<string, string> = {
  normal: "Normal",
  mild: "Anemia Ringan",
  moderate: "Anemia Sedang",
  severe: "Anemia Berat",
};

const WHO_TEXT_CLASS: Record<string, string> = {
  normal: "text-tertiary",
  mild: "text-warning",
  moderate: "text-warning",
  severe: "text-error",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ClaimBanner() {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOwnPatient()
      .then((owned) => {
        if (owned) {
          return null;
        }
        return getMyClaim();
      })
      .then(setClaim)
      .catch(() => setError("Gagal memuat status permintaan tarik data."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRequestClaim() {
    if (!claim) return;
    setIsRequesting(true);
    setError(null);
    try {
      const updated = await requestClaim(claim.id);
      setClaim(updated);
    } catch {
      setError("Gagal mengajukan permintaan tarik data, coba lagi.");
    } finally {
      setIsRequesting(false);
    }
  }

  if (isLoading || claim === null) {
    return null;
  }

  if (claim.status === "offered") {
    return (
      <Alert variant="info" title="Riwayat Skrining Ditemukan">
        <p>Anda pernah discan oleh tenaga kesehatan sebelumnya. Anda dapat meminta riwayat itu ditautkan ke akun ini.</p>
        {error && <p className="text-error font-medium">{error}</p>}
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={handleRequestClaim} disabled={isRequesting}>
            {isRequesting ? "Mengajukan..." : "Minta Tarik Data"}
          </Button>
        </div>
      </Alert>
    );
  }

  if (claim.status === "pending") {
    return (
      <Alert variant="warning" title="Menunggu Persetujuan">
        Permintaan tarik data Anda sedang menunggu persetujuan tenaga kesehatan.
      </Alert>
    );
  }

  if (claim.status === "rejected") {
    return (
      <Alert variant="danger" title="Permintaan Ditolak">
        Permintaan tarik data riwayat lama Anda ditolak oleh tenaga kesehatan.
      </Alert>
    );
  }

  return null;
}

export default function PatientDashboardPage() {
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

  const whoCategory = latestScreening?.whoCategory;
  const whoLabel = whoCategory ? WHO_LABELS[whoCategory] ?? whoCategory : null;
  const whoTextClass = whoCategory ? WHO_TEXT_CLASS[whoCategory] ?? "text-on-surface" : "text-on-surface-variant";

  return (
    <main className="min-h-screen w-full bg-surface p-4 sm:p-6 font-sans space-y-6 pb-24">
      <div className="w-full max-w-[640px] mx-auto space-y-6">

        <ClaimBanner />

        {/* Greeting Section */}
        <div className="space-y-1">
          <h1 className="text-on-surface text-2xl font-semibold leading-8">
            Halo!
          </h1>
          <p className="text-on-surface-variant text-base font-normal leading-6">
            Berikut adalah ringkasan kesehatan Anda hari ini.
          </p>
        </div>

        {/* Primary Status Card: Hasil Skrining Terakhir */}
        <div className="relative w-full bg-white rounded-xl border border-outline p-6 shadow-xs overflow-hidden space-y-6">

          {/* Teal Blur Background Circle in Top Right */}
          <div className="absolute -top-24 -right-12 w-64 h-64 bg-tertiary-container/30 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Warning Header Badge */}
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 stroke-[2.5]" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.70px]">
                PERHATIAN DIPERLUKAN
              </span>
            </div>

            {isLoading ? (
              <p className="text-on-surface-variant text-base leading-6">Memuat ringkasan...</p>
            ) : latestScreening ? (
              <>
                {/* Title & Status */}
                <div className="space-y-1">
                  <h2 className="text-on-surface text-2xl font-semibold leading-8">
                    Hasil Skrining Terakhir:{" "}
                    <span className={whoTextClass}>{whoLabel ?? latestScreening.status}</span>
                  </h2>
                </div>

                {/* Description */}
                <p className="text-on-surface-variant text-base leading-6">
                  Hasil skrining pada <strong className="text-on-surface font-medium">{formatDate(latestScreening.createdAt)}</strong> menunjukkan status di atas. Hasil skrining bukan diagnosis medis.
                </p>
              </>
            ) : (
              <p className="text-on-surface-variant text-base leading-6">
                Anda belum pernah melakukan skrining. Mulai skrining pertama Anda untuk melihat ringkasan kesehatan di sini.
              </p>
            )}
          </div>

          {/* Action Button: Lihat Hasil */}
          <div className="relative z-10 pt-2">
            <Link
              href={latestScreening ? ROUTES.PATIENT.HASIL : ROUTES.PATIENT.SKRINING_KONDISI}
              onClick={handleGoToLatestResult}
              className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-8 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer gap-2"
            >
              <span>{latestScreening ? "Lihat Hasil" : "Mulai Skrining"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Next Step Banner: Konsultasi Nakes */}
        <div className="w-full p-4 bg-tertiary-container/30 border border-tertiary-container rounded-xl flex items-start gap-4 text-left">
          <div className="w-12 h-12 bg-tertiary rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-0.5 pt-0.5">
            <h3 className="text-tertiary-alt text-sm font-bold leading-5">
              Langkah Berikutnya:
            </h3>
            <p className="text-tertiary-alt text-base font-normal leading-6">
              Konsultasikan hasil dengan tenaga kesehatan.
            </p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="space-y-3 pt-2">
          <h2 className="text-on-surface text-2xl font-semibold leading-8">
            Akses Cepat
          </h2>

          <div className="space-y-3">
            {/* Quick Link 1: Hasil Skrining */}
            <Link
              href={ROUTES.PATIENT.HASIL}
              className="p-5 bg-white rounded-xl border border-outline hover:border-primary/50 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-bright rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <FileBarChart2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-on-surface text-sm font-semibold leading-5">
                  Hasil Skrining
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Quick Link 2: Riwayat Skrining */}
            <Link
              href={ROUTES.PATIENT.RIWAYAT}
              className="p-5 bg-white rounded-xl border border-outline hover:border-primary/50 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary-alt flex-shrink-0">
                  <History className="w-5 h-5 text-tertiary-alt" />
                </div>
                <span className="text-on-surface text-sm font-semibold leading-5">
                  Riwayat Skrining
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Quick Link 3: Edukasi Anemia */}
            <Link
              href={ROUTES.PATIENT.EDUKASI}
              className="p-5 bg-white rounded-xl border border-outline hover:border-primary/50 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-outline-variant rounded-full flex items-center justify-center text-on-surface flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-on-surface" />
                </div>
                <span className="text-on-surface text-sm font-semibold leading-5">
                  Edukasi Anemia
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Featured Article Card */}
        <Link
          href={ROUTES.PATIENT.EDUKASI}
          className="relative w-full h-40 rounded-xl overflow-hidden shadow-xs cursor-pointer block group"
        >
          {/* Article Image */}
          <img
            src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80"
            alt="Pola Makan untuk Atasi Anemia"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-5 flex flex-col justify-end text-white">
            <span className="text-xs font-medium text-white/90">Artikel Baru</span>
            <h3 className="text-lg font-bold text-white leading-snug">
              Pola Makan untuk Atasi Anemia
            </h3>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-xs border border-white/40 text-white text-xs font-medium rounded-lg transition-all">
                <span>Baca Selengkapnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

      </div>
    </main>
  );
}
