import React from "react";
import Link from "next/link";
import { Patient } from "@/types/patient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { PatientRiskBadge } from "../ui/Badge";
import { ROUTES } from "@/lib/routes";
import { ChevronRight, FileText } from "lucide-react";

export function PatientTable({ patients }: { patients: Patient[] }) {
  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. RM</TableHead>
              <TableHead>Nama Pasien</TableHead>
              <TableHead>Usia / Jenis Kelamin</TableHead>
              <TableHead>Gejala Utama</TableHead>
              <TableHead>Status Skrining Terakhir</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-medium text-slate-900">
                  {p.medicalRecordNumber}
                </TableCell>
                <TableCell className="font-bold text-slate-900">{p.name}</TableCell>
                <TableCell>
                  {p.age} thn / {p.sex === "male" ? "Laki-laki" : "Perempuan"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.symptoms.slice(0, 2).map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                    {p.symptoms.length > 2 && (
                      <span className="text-xs text-slate-400">+{p.symptoms.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {p.lastRiskLevel ? (
                    <PatientRiskBadge risk={p.lastRiskLevel} />
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada skrining</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={ROUTES.NAKES.PASIEN_DETAIL(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark p-1.5 rounded-lg hover:bg-surface-container-low"
                  >
                    <span>Detail</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-3">
        {patients.map((p) => (
          <Link
            key={p.id}
            href={ROUTES.NAKES.PASIEN_DETAIL(p.id)}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-primary-accent transition-all active:bg-slate-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {p.medicalRecordNumber}
              </span>
              {p.lastRiskLevel && <PatientRiskBadge risk={p.lastRiskLevel} />}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {p.age} thn ({p.sex === "male" ? "Laki-laki" : "Perempuan"}) • {p.phone}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 truncate max-w-[200px]">
                {p.symptoms.join(", ")}
              </span>
              <span className="font-bold text-primary flex items-center gap-0.5">
                Lihat Detail <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
