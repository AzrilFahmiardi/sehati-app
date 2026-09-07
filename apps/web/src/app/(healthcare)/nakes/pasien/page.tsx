"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { listPatientsForOrganization } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { AnemiaRisk } from "@/types/result";
import {
  Calendar,
  RefreshCw,
  Search,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge, BadgeProps, PatientRiskBadge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

interface PatientRow {
  id: string;
  name: string;
  patientId: string;
  avatarText: string;
  avatarBg: string;
  avatarColor: string;
  age: string;
  gender: string;
  lastScreening: string;
  riskLevel: AnemiaRisk | "unknown";
  riskLabel: string;
  followUpStatus: "Selesai" | "Perlu Follow-up" | "Dalam Proses" | "Belum Ada";
}

const FOLLOW_UP_VARIANTS: Record<PatientRow["followUpStatus"], BadgeProps["variant"]> = {
  Selesai: "success",
  "Perlu Follow-up": "danger",
  "Dalam Proses": "warning",
  "Belum Ada": "outline",
};

function computeAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} Thn`;
}

function riskLevelFrom(screening: ScreeningSummary | undefined): PatientRow["riskLevel"] {
  if (!screening) return "unknown";
  if (!screening.decision) return screening.status === "completed" ? "inconclusive" : "unknown";
  if (screening.decision === "non_anemic") return "low";
  if (screening.decision === "inconclusive") return "inconclusive";
  // decision === "anemic"
  if (screening.whoCategory === "severe") return "high";
  return "moderate";
}

const RISK_LABELS: Record<PatientRow["riskLevel"], string> = {
  low: "Risiko Rendah",
  moderate: "Risiko Sedang",
  high: "Risiko Tinggi",
  inconclusive: "Hasil Belum Konklusif",
  unknown: "-",
};

function followUpStatusFrom(screening: ScreeningSummary | undefined): PatientRow["followUpStatus"] {
  if (!screening) return "Belum Ada";
  if (screening.status === "draft" || screening.status === "processing") return "Dalam Proses";
  if (screening.decision === "anemic") return "Perlu Follow-up";
  return "Selesai";
}

export default function HealthcarePatientManagePage() {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const searchFromUrl = new URLSearchParams(window.location.search).get("search");
    if (searchFromUrl) setSearchQuery(searchFromUrl);
  }, []);
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
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
      .then(([realPatients, screenings]) => {
        const latestByPatient = new Map<string, ScreeningSummary>();
        for (const screening of screenings) {
          const current = latestByPatient.get(screening.patientId);
          if (!current || new Date(screening.createdAt) > new Date(current.createdAt)) {
            latestByPatient.set(screening.patientId, screening);
          }
        }

        setPatients(
          realPatients.map((patient) => {
            const latest = latestByPatient.get(patient.id);
            const riskLevel = riskLevelFrom(latest);
            return {
              id: patient.id,
              name: patient.displayName,
              patientId: patient.id.slice(0, 8).toUpperCase(),
              avatarText: patient.displayName.slice(0, 2).toUpperCase(),
              avatarBg: "bg-primary-container",
              avatarColor: "text-primary",
              age: computeAge(patient.dob),
              gender: patient.sex === "M" ? "Laki-laki" : "Perempuan",
              lastScreening: latest
                ? new Date(latest.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-",
              riskLevel,
              riskLabel: RISK_LABELS[riskLevel],
              followUpStatus: followUpStatusFrom(latest),
            };
          })
        );
      })
      .catch(() => setLoadError("Gagal memuat daftar pasien."))
      .finally(() => setIsLoading(false));
  }, []);

  // Filtering Logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      selectedRisk === "all" ? true : p.riskLevel === selectedRisk;
    const matchesStatus =
      selectedStatus === "all" ? true : p.followUpStatus === selectedStatus;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="bg-surface min-h-screen p-6 sm:p-8 lg:p-10 space-y-8 font-sans relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-[32px] font-semibold text-on-surface leading-tight tracking-tight">
            Pasien
          </h1>
          <p className="text-base text-on-surface-variant">
            Kelola dan pantau status kesehatan hematologi pasien Anda.
          </p>
        </div>

        <Link href={ROUTES.NAKES.PASIEN_BARU}>
          <Button type="button" leftIcon={<UserPlus className="w-5 h-5" />}>
            Tambah Pasien
          </Button>
        </Link>
      </div>

      {loadError && (
        <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
          {loadError}
        </div>
      )}

      {searchQuery && (
        <div className="flex items-center justify-between gap-3 p-3 bg-primary-container/30 border border-primary/20 rounded-lg text-sm">
          <span className="text-on-surface">
            Menampilkan hasil pencarian untuk <span className="font-bold">&quot;{searchQuery}&quot;</span>
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-primary font-semibold hover:underline shrink-0"
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* Filter & Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dropdown 1: Tingkat Risiko */}
        <div className="bg-white p-4 rounded-xl outline outline-1 outline-outline shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface-variant">Tingkat Risiko</label>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg outline-none cursor-pointer border border-outline focus:border-blue-600 font-normal"
          >
            <option value="all">Semua Risiko</option>
            <option value="high">Risiko Tinggi</option>
            <option value="moderate">Risiko Sedang</option>
            <option value="low">Risiko Rendah</option>
            <option value="inconclusive">Hasil Belum Konklusif</option>
          </select>
        </div>

        {/* Dropdown 2: Status Follow-up */}
        <div className="bg-white p-4 rounded-xl outline outline-1 outline-outline shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface-variant">Status Follow-up</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg outline-none cursor-pointer border border-outline focus:border-blue-600 font-normal"
          >
            <option value="all">Semua Status</option>
            <option value="Perlu Follow-up">Perlu Follow-up</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        {/* Dropdown 3: Urutkan Berdasarkan */}
        <div className="bg-white p-4 rounded-xl outline outline-1 outline-outline shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-on-surface-variant">Urutkan Berdasarkan</label>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg outline-none cursor-pointer border border-outline focus:border-blue-600 font-normal"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama (A-Z)</option>
          </select>
        </div>

        {/* Metric Box: Total Pasien Aktif */}
        <div className="p-4 bg-blue-50/80 rounded-xl outline outline-1 outline-blue-300/60 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-2xl font-bold text-primary block">{patients.length}</span>
            <span className="text-sm font-medium text-on-surface">Total Pasien Aktif</span>
          </div>
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-primary">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Patient Data Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
      <div className="bg-white rounded-xl border border-outline shadow-sm overflow-hidden">
        <div className="max-h-[480px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead>Nama & ID</TableHead>
                <TableHead>Usia / JK</TableHead>
                <TableHead>Skrining Terakhir</TableHead>
                <TableHead>Risiko Level</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant">
                    Tidak ada pasien yang sesuai dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    {/* Nama & ID */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${patient.avatarBg} ${patient.avatarColor} font-bold text-sm flex items-center justify-center shrink-0`}
                        >
                          {patient.avatarText}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface text-sm leading-snug">
                            {patient.name}
                          </div>
                          <div className="text-xs font-mono text-on-surface-variant font-medium">
                            {patient.patientId}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Usia / JK */}
                    <TableCell>
                      <div className="font-normal text-on-surface text-sm">{patient.age}</div>
                      <div className="text-xs text-on-surface-variant">{patient.gender}</div>
                    </TableCell>

                    {/* Skrining Terakhir */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-on-surface text-sm font-normal">
                        <Calendar className="w-4 h-4 text-on-surface-variant" />
                        <span>{patient.lastScreening}</span>
                      </div>
                    </TableCell>

                    {/* Risiko Level */}
                    <TableCell>
                      {patient.riskLevel === "unknown" ? (
                        <Badge variant="outline">Belum Diskrining</Badge>
                      ) : (
                        <PatientRiskBadge risk={patient.riskLevel} />
                      )}
                    </TableCell>

                    {/* Follow-up */}
                    <TableCell>
                      {patient.followUpStatus === "Belum Ada" ? (
                        <span className="text-on-surface-variant">-</span>
                      ) : (
                        <Badge variant={FOLLOW_UP_VARIANTS[patient.followUpStatus]}>
                          {patient.followUpStatus}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={ROUTES.NAKES.PASIEN_DETAIL(patient.id)}>
                          <Button type="button" variant="outline" size="sm">
                            Detail
                          </Button>
                        </Link>
                        <Link
                          href={`${ROUTES.NAKES.SKRINING_PERIKSA_KAMERA}?patientId=${patient.id}&organizationId=${organizationId}`}
                        >
                          <Button type="button" size="sm">
                            Mulai Skrining
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-white border-t border-outline text-sm text-on-surface-variant">
          Menampilkan {filteredPatients.length} dari {patients.length} pasien
        </div>
      </div>
      )}

      {/* Bottom Row Grid: Analisis Populasi Pasien Banner & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Blue Banner Card: Analisis Populasi Pasien (Span 2) */}
        <div className="lg:col-span-2 bg-primary text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3 max-w-md">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Analisis Populasi Pasien
              </h3>
              <p className="text-sm text-blue-100 leading-relaxed font-normal">
                Sebanyak 12% pasien baru terdeteksi memiliki risiko anemia tinggi dalam 30 hari terakhir. Perlu penjadwalan follow-up prioritas untuk daftar pasien terkait.
              </p>
            </div>

            {/* Metric Box inside Banner */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 min-w-[160px] text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                RISIKO TINGGI
              </span>
              <span className="text-4xl font-extrabold text-white block">+18</span>
              <span className="text-xs text-blue-200 block font-medium">
                ↗ 4% vs bulan lalu
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={ROUTES.NAKES.LAPORAN}>
              <button className="px-5 py-2.5 bg-white text-primary font-bold text-sm rounded-lg hover:bg-blue-50 active:scale-[0.96] transition-all cursor-pointer">
                Lihat Laporan Detail
              </button>
            </Link>
            <button className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium text-sm rounded-lg active:scale-[0.96] transition-all cursor-pointer border border-white/20">
              Tandai Dibaca
            </button>
          </div>
        </div>

        {/* Right Card: Aktivitas Terbaru (Span 1) */}
        <div className="bg-white rounded-2xl p-6 border border-outline shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-on-surface">Aktivitas Terbaru</h3>
              <button
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Refresh Timeline"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Timeline item 1 */}
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-on-surface text-sm">
                    Hasil Skrining Diperbarui
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Siti Aminah • 5 menit yang lalu
                  </p>
                </div>
              </div>

              {/* Timeline item 2 */}
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-on-surface text-sm">Follow-up Selesai</h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Herman Wijaya • 2 jam yang lalu
                  </p>
                </div>
              </div>

              {/* Timeline item 3 */}
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-on-surface text-sm">
                    Pasien Baru Ditambahkan
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Budi Santoso • 3 jam yang lalu
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href={ROUTES.NAKES.MONITORING}
              className="text-xs font-bold text-primary hover:underline"
            >
              Lihat Semua Aktivitas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
