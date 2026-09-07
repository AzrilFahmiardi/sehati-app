"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
  inconclusive: "Belum Konklusif",
};

function formatScreeningDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const orgId = sessionStorage.getItem("hv_org_id");
    setOrganizationId(orgId);
    if (!orgId) {
      setLoadError("Sesi organisasi tidak ditemukan, silakan login ulang.");
      setIsLoading(false);
      return;
    }
    listScreenings(orgId)
      .then(setScreenings)
      .catch(() => setLoadError("Gagal memuat daftar laporan."))
      .finally(() => setIsLoading(false));
  }, []);

  const reportableScreenings = screenings.filter((screening) =>
    screening.siteSummaries.some((site) => site.inferenceStatus === "completed")
  );

  const filteredReports = reportableScreenings.filter((screening) =>
    screening.patientDisplayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = reportableScreenings.filter((screening) => screening.status === "completed").length;

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-24 space-y-6">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Laporan Medis Digital Pasien
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Pilih pasien di bawah ini untuk melihat detail laporan medis digital AI.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-on-surface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pasien..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline rounded-full text-sm text-on-surface placeholder-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loadError && (
          <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
            {loadError}
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-xl border border-outline space-y-1 shadow-sm">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total Laporan Tersedia
            </span>
            <div className="text-3xl font-bold text-on-surface">{reportableScreenings.length}</div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-outline space-y-1 shadow-sm">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Skrining Selesai
            </span>
            <div className="text-3xl font-bold text-tertiary">{completedCount}</div>
          </div>
        </div>

        {/* Table Container */}
        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : (
          <div className="bg-white rounded-xl border border-outline overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline bg-surface flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">
                Daftar Rekam Medis Skrining Pasien
              </h2>
              <span className="text-xs text-on-surface-variant">
                Menampilkan {filteredReports.length} laporan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-outline">
                  <tr>
                    <th className="py-3.5 px-4">Nama Pasien</th>
                    <th className="py-3.5 px-4">Tanggal Skrining</th>
                    <th className="py-3.5 px-4">Situs Selesai</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/40">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-on-surface-variant">
                        Belum ada laporan yang tersedia.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((screening) => (
                      <tr
                        key={screening.screeningId}
                        className="hover:bg-surface-container-low/60 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-on-surface">
                          {screening.patientDisplayName}
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          {formatScreeningDate(screening.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-on-surface-variant">
                          {screening.siteSummaries.filter((site) => site.inferenceStatus === "completed").length}
                          {" / "}
                          {screening.siteSummaries.length}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-container/40 text-primary">
                            {STATUS_LABELS[screening.status] ?? screening.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/nakes/hasil?screeningId=${screening.screeningId}&organizationId=${organizationId}`}
                          >
                            <Button type="button" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                              Lihat Laporan Medis
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
