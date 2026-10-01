"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { ScreeningHistoryList } from "@/components/screening/ScreeningHistoryList";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "failed", label: "Gagal" },
  { value: "inconclusive", label: "Belum Konklusif" },
];

export default function MonitoringPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

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
      .catch(() => setLoadError("Gagal memuat riwayat skrining."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredScreenings = screenings.filter((screening) => {
    const matchesSearch = screening.patientDisplayName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" ? true : screening.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
          Riwayat & Monitoring Skrining
        </h1>
        <p className="text-sm text-on-surface-variant">
          Daftar seluruh skrining dari seluruh pasien di organisasi Anda, terbaru dahulu.
        </p>
      </div>

      {loadError && (
        <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl outline outline-1 outline-outline shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface-variant">Cari Pasien</label>
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama pasien..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg outline-none border border-outline focus:border-blue-600 font-normal"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl outline outline-1 outline-outline shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface-variant">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg outline-none cursor-pointer border border-outline focus:border-blue-600 font-normal"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        organizationId && (
          <ScreeningHistoryList
            screenings={filteredScreenings}
            showPatientColumn={true}
            organizationId={organizationId}
          />
        )
      )}
    </div>
  );
}
