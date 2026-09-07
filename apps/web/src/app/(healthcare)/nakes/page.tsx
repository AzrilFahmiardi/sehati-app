"use client";

import React, { useState, useEffect } from "react";
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
  Info,
  Megaphone,
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

const DAY_LABELS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

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
  const [activeDay, setActiveDay] = useState<number | null>(null);

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
  const screeningsToday = screenings.filter((s) => isSameDay(new Date(s.createdAt), today)).length;
  const unfinishedScreenings = screenings.filter(
    (s) => s.status === "draft" || s.status === "processing"
  ).length;

  const weeklyCounts = DAY_LABELS.map((_, dayIndex) =>
    screenings.filter((s) => new Date(s.createdAt).getDay() === dayIndex).length
  );
  const maxWeeklyCount = Math.max(1, ...weeklyCounts);

  const recentScreenings = [...screenings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-surface min-h-screen p-6 sm:p-8 lg:p-10 space-y-10 font-sans relative">
      {/* Top Welcome Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-[32px] font-semibold text-on-surface leading-tight tracking-tight">
            Selamat datang
          </h1>
          <p className="text-base text-on-surface-variant">
            Berikut ringkasan aktivitas hematologi hari ini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={ROUTES.NAKES.PASIEN_LIST}>
            <Button type="button" variant="secondary" leftIcon={<Search className="w-5 h-5" />}>
              Cari Pasien
            </Button>
          </Link>

          <Link href={ROUTES.NAKES.SKRINING_BARU}>
            <Button type="button" leftIcon={<Plus className="w-5 h-5 stroke-[3]" />}>
              Mulai Skrining Baru
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
          {loadError}
        </div>
      )}

      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Total Pasien */}
        <div className="bg-white rounded-xl p-6 border border-outline shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="p-2 bg-primary-container rounded-lg w-fit">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-on-surface-variant block">Total Pasien</span>
            <span className="text-2xl font-semibold text-on-surface">{patientCount ?? "-"}</span>
          </div>
        </div>

        {/* Card 2: Total Skrining */}
        <div className="bg-white rounded-xl p-6 border border-outline shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="p-2 bg-primary-container rounded-lg w-fit">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-on-surface-variant block">Total Skrining</span>
            <span className="text-2xl font-semibold text-on-surface">{screenings.length}</span>
          </div>
        </div>

        {/* Card 3: Skrining Hari Ini */}
        <div className="bg-white rounded-xl p-6 border border-outline shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-primary-container rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-bold text-on-surface-variant">Hari Ini</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-on-surface-variant block">Skrining Hari Ini</span>
            <span className="text-2xl font-semibold text-on-surface">{screeningsToday}</span>
          </div>
        </div>
      </div>

      {/* Skrining Terbaru Table Card */}
      <div className="bg-white rounded-xl border border-outline shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline flex items-center justify-between">
          <h2 className="text-xl font-normal text-on-surface">Skrining Terbaru</h2>
          <Link
            href={ROUTES.NAKES.MONITORING}
            className="text-sm font-bold text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={3} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-sm font-medium text-on-surface-variant border-b border-outline">
                <tr>
                  <th className="px-6 py-4 font-medium">Pasien</th>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Situs Selesai</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {recentScreenings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant">
                      Belum ada skrining yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recentScreenings.map((screening) => (
                    <tr key={screening.screeningId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-primary-darkest font-bold text-xs flex items-center justify-center shrink-0">
                            {screening.patientDisplayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="font-semibold text-on-surface text-base leading-snug">
                            {screening.patientDisplayName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface text-base">
                        {new Date(screening.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {screening.siteSummaries.filter((s) => s.inferenceStatus === "completed").length}
                        {" / "}
                        {screening.siteSummaries.length}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-primary-container/40 text-primary text-xs font-bold rounded-full">
                          {STATUS_LABELS[screening.status] ?? screening.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={actionHrefFor(screening, organizationId)}
                          className="inline-block p-1.5 text-on-surface-muted hover:text-primary hover:bg-primary-container/30 rounded-full active:scale-90 transition-all"
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

      {/* Bottom Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Tren Diagnostik Mingguan */}
        <div className="bg-surface-container-low rounded-xl p-6 outline outline-1 outline-outline flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-normal text-on-surface">Tren Diagnostik Mingguan</h3>
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {unfinishedScreenings} belum selesai
            </span>
          </div>

          <div className="bg-surface rounded-lg p-4 h-48 flex items-end justify-between gap-3 overflow-hidden">
            {DAY_LABELS.map((day, index) => {
              const isSelected = activeDay === index;
              const heightPercent = (weeklyCounts[index] / maxWeeklyCount) * 100;
              return (
                <div
                  key={day}
                  onClick={() => setActiveDay(index)}
                  className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                >
                  <div
                    className={`w-full rounded-t-xs transition-all duration-500 ${
                      isSelected
                        ? "bg-primary shadow-md shadow-blue-500/30"
                        : "bg-primary-light hover:bg-primary-accent"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
            {DAY_LABELS.map((day, index) => (
              <span
                key={day}
                onClick={() => setActiveDay(index)}
                className={`cursor-pointer transition-colors ${
                  activeDay === index ? "text-primary font-extrabold" : "hover:text-primary"
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Pengumuman & Update */}
        <div className="bg-surface-container-low rounded-xl p-6 outline outline-1 outline-outline flex flex-col justify-start space-y-4">
          <h3 className="text-lg font-normal text-on-surface">Pengumuman & Update</h3>

          <div className="space-y-3">
            {/* Item 1 */}
            <div className="p-4 bg-white rounded-lg outline outline-1 outline-outline flex items-start gap-4 shadow-sm">
              <div className="p-1 text-warning shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-on-surface text-sm leading-snug">
                  Update Protokol Lab
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Standar kalibrasi analyzer diperbarui untuk parameter HGB.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-4 bg-white rounded-lg outline outline-1 outline-outline flex items-start gap-4 shadow-sm">
              <div className="p-1 text-primary shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-on-surface text-sm leading-snug">
                  Webinar Hematologi
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Besok pukul 14:00: Analisis Sel Morfologi berbasis AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <Link
        href={ROUTES.NAKES.SKRINING_BARU}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 z-40 hover:scale-105 active:scale-90 active:ring-4 active:ring-primary-light transition-all duration-150 select-none cursor-pointer"
        aria-label="Mulai Skrining Baru"
      >
        <Plus className="w-8 h-8 stroke-[3]" />
      </Link>
    </div>
  );
}
