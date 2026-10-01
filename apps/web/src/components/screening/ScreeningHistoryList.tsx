"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge, BadgeProps } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/routes";
import { ScreeningSummary } from "@/services/screening";

const SITE_LABELS: Record<string, string> = {
  conjunctiva: "Mata",
  palm: "Telapak",
  nail: "Kuku",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
  inconclusive: "Belum Konklusif",
};

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  draft: "outline",
  processing: "warning",
  completed: "success",
  failed: "danger",
  inconclusive: "warning",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function siteSummaryText(screening: ScreeningSummary): string {
  const completed = screening.siteSummaries.filter(
    (site) => site.inferenceStatus === "completed" && site.hbGdl !== null
  );
  if (completed.length === 0) return "-";
  return completed
    .map((site) => `${SITE_LABELS[site.site] ?? site.site} ${site.hbGdl!.toFixed(1)} g/dL`)
    .join(", ");
}

export function ScreeningHistoryList({
  screenings,
  showPatientColumn,
  organizationId,
}: {
  screenings: ScreeningSummary[];
  showPatientColumn: boolean;
  organizationId: string;
}) {
  const router = useRouter();

  const isOpenable = (status: string) =>
    status === "completed" || status === "inconclusive" || status === "failed";

  if (screenings.length === 0) {
    return (
      <div className="p-8 bg-white rounded-xl outline outline-1 outline-outline shadow-sm text-center text-slate-600">
        <p className="text-sm text-on-surface-variant">Belum ada riwayat skrining.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          {showPatientColumn && <TableHead>Pasien</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Ringkasan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {screenings.map((screening) => (
          <TableRow
            key={screening.screeningId}
            className={isOpenable(screening.status) ? "cursor-pointer" : undefined}
            onClick={() => {
              if (!isOpenable(screening.status)) return;
              router.push(
                `${ROUTES.NAKES.HASIL}?screeningId=${screening.screeningId}&organizationId=${organizationId}`
              );
            }}
          >
            <TableCell>{formatDate(screening.createdAt)}</TableCell>
            {showPatientColumn && <TableCell>{screening.patientDisplayName}</TableCell>}
            <TableCell>
              <Badge variant={STATUS_VARIANTS[screening.status] ?? "default"}>
                {STATUS_LABELS[screening.status] ?? screening.status}
              </Badge>
            </TableCell>
            <TableCell>{siteSummaryText(screening)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
