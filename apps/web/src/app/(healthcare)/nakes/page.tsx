"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import {
  ChevronRight,
  Plus,
  Search,
  Users,
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { listPatientsForOrganization } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
  inconclusive: "Belum Konklusif",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  processing: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  inconclusive: "bg-amber-50 text-amber-700",
};

const WHO_LABELS: Record<string, string> = {
  non_anemic: "Tidak Anemia",
  mild: "Ringan",
  moderate: "Sedang",
  severe: "Berat",
};

const WHO_BADGE_STYLE: Record<string, string> = {
  non_anemic: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mild: "bg-amber-50 text-amber-700 border-amber-200",
  moderate: "bg-orange-50 text-orange-700 border-orange-200",
  severe: "bg-red-50 text-red-700 border-red-200",
};

const WHO_BAR_COLOR: Record<string, string> = {
  non_anemic: "bg-emerald-500",
  mild: "bg-amber-400",
  moderate: "bg-orange-500",
  severe: "bg-red-500",
};

const WHO_DOT_COLOR: Record<string, string> = {
  non_anemic: "bg-emerald-500",
  mild: "bg-amber-400",
  moderate: "bg-orange-500",
  severe: "bg-red-500",
};

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function actionHrefFor(screening: ScreeningSummary, organizationId: string | null): string {
  if (screening.status === "draft") {
    const nextSite = screening.siteSummaries.find((s) => s.inferenceStatus !== "completed");
    const site = nextSite?.site ?? screening.siteSummaries[0]?.site ?? "conjunctiva";
    return `/capture/${screening.screeningId}?site=${site}`;
  }
  return `/nakes/hasil?screeningId=${screening.screeningId}&organizationId=${organizationId}`;
}

export default function HealthcareDashboardPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orgId = sessionStorage.getItem("hv_org_id");
    setOrganizationId(orgId);
    if (!orgId) {
      setLoadError("Sesi organisasi tidak ditemukan, silakan login ulang.");
      setIsLoading(false);
      return;
    }
    Promise.all([listPatientsForOrganization(orgId), listScreenings(orgId)])
      .then(([patients, screeningList]) => {
        setPatientCount(patients.length);
        setScreenings(screeningList);
      })
      .catch(() => setLoadError("Gagal memuat ringkasan dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date();
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);

  const screeningsToday = screenings.filter((s) => isSameDay(new Date(s.createdAt), today)).length;
  const pendingScreenings = screenings.filter(
    (s) => s.status === "draft" || s.status === "processing"
  ).length;

  const completedScreenings = useMemo(
    () => screenings.filter((s) => s.status === "completed" && s.whoCategory),
    [screenings]
  );

  const whoCounts = useMemo(() => {
    const counts: Record<string, number> = { non_anemic: 0, mild: 0, moderate: 0, severe: 0 };
    for (const s of completedScreenings) {
      if (s.whoCategory && s.whoCategory in counts) {
        counts[s.whoCategory]++;
      }
    }
    return counts;
  }, [completedScreenings]);

  const totalCompleted = completedScreenings.length;

  const recentScreenings = useMemo(
    () =>
      [...screenings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 7),
    [screenings]
  );

  return (
    <div className="bg-surface min-h-screen p-6 sm:p-8 lg:p-10 space-y-8 font-sans">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-outline shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {todayFormatted}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Dashboard Skrining
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl">
            Ringkasan aktivitas skrining anemia non-invasif di fasilitas kesehatan Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href={ROUTES.NAKES.PASIEN_LIST}>
            <Button type="button" variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
              Cari Pasien
            </Button>
          </Link>
          <Link href={ROUTES.NAKES.SKRINING_BARU}>
            <Button type="button" leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}>
              Skrining Baru
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
          {loadError}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-outline shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Pasien Terdaftar</span>
          </div>
          <span className="text-3xl font-semibold text-on-surface font-mono block">
            {patientCount ?? "-"}
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-outline shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Total Skrining</span>
          </div>
          <span className="text-3xl font-semibold text-on-surface font-mono block">
            {screenings.length}
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-outline shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Skrining Hari Ini</span>
          </div>
          <span className="text-3xl font-semibold text-on-surface font-mono block">
            {screeningsToday}
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-outline shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Menunggu Proses</span>
          </div>
          <span className="text-3xl font-semibold text-on-surface font-mono block">
            {pendingScreenings}
          </span>
        </div>
      </div>

      {/* Distribusi Hasil Skrining */}
      {totalCompleted > 0 && (
        <div className="bg-white rounded-xl border border-outline shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-on-surface">Distribusi Hasil Skrining</h2>
            <span className="text-xs text-on-surface-variant font-mono">
              {totalCompleted} skrining selesai
            </span>
          </div>

          {/* Stacked horizontal bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 w-full">
            {(["non_anemic", "mild", "moderate", "severe"] as const).map((cat) => {
              const pct = (whoCounts[cat] / totalCompleted) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={cat}
                  className={`${WHO_BAR_COLOR[cat]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${WHO_LABELS[cat]}: ${whoCounts[cat]} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant">
            {(["non_anemic", "mild", "moderate", "severe"] as const).map((cat) => {
              const count = whoCounts[cat];
              const pct = totalCompleted > 0 ? ((count / totalCompleted) * 100).toFixed(0) : "0";
              return (
                <span key={cat} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${WHO_DOT_COLOR[cat]} inline-block`} />
                  {WHO_LABELS[cat]}: {count} ({pct}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabel Skrining Terbaru */}
      <div className="bg-white rounded-xl border border-outline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline flex items-center justify-between">
          <h2 className="text-base font-semibold text-on-surface">Skrining Terbaru</h2>
          <Link
            href={ROUTES.NAKES.MONITORING}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={4} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-on-surface-variant border-b border-outline">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Pasien</th>
                  <th className="px-6 py-3.5 font-medium">Tanggal</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Keputusan</th>
                  <th className="px-6 py-3.5 font-medium text-center w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {recentScreenings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-on-surface-variant">
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-outline" />
                        <p className="text-sm">Belum ada data skrining.</p>
                        <p className="text-xs">Mulai skrining pertama untuk melihat hasilnya di sini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentScreenings.map((screening) => (
                    <tr key={screening.screeningId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-primary-darkest font-bold text-xs flex items-center justify-center shrink-0">
                            {screening.patientDisplayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-on-surface">
                            {screening.patientDisplayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">
                        {new Date(screening.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                            STATUS_STYLE[screening.status] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_LABELS[screening.status] ?? screening.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {screening.whoCategory ? (
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${
                              WHO_BADGE_STYLE[screening.whoCategory] ?? "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {WHO_LABELS[screening.whoCategory] ?? screening.whoCategory}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-muted">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={actionHrefFor(screening, organizationId)}
                          className="inline-block p-1.5 text-on-surface-muted hover:text-primary hover:bg-primary-container/30 rounded-full transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Catatan Klinis */}
      <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline text-xs text-on-surface-variant">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          SEHATI adalah alat bantu skrining non-invasif. Hasil estimasi hemoglobin bukan diagnosis
          klinis dan harus dikonfirmasi melalui pemeriksaan laboratorium sebelum pengambilan
          keputusan terapeutik.
        </p>
      </div>

      {/* Floating Action Button */}
      <Link
        href={ROUTES.NAKES.SKRINING_BARU}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-xl z-40 transition-colors"
        aria-label="Mulai Skrining Baru"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </Link>
    </div>
  );
}
