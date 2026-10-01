"use client";

import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { ScreeningSummary } from "@/services/screening";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
  inconclusive: "Belum Konklusif",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function RecentActivitiesCard({ screenings }: { screenings: ScreeningSummary[] }) {
  const recent = [...screenings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="h-full bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 flex flex-col justify-between gap-6">
      <h3 className="text-base font-bold text-on-surface">Aktivitas Terakhir</h3>

      {recent.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Belum ada aktivitas skrining.</p>
      ) : (
        <div className="flex flex-col relative pl-2">
          {recent.map((screening, idx) => {
            const isLast = idx === recent.length - 1;
            return (
              <div key={screening.screeningId} className="relative flex gap-4 pb-6 group">
                {!isLast && <div className="absolute left-4 top-8 bottom-0 w-[2px] bg-outline" />}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    idx === 0 ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>

                <div className="flex flex-col gap-0.5 pt-0.5">
                  <span className="text-xs text-on-surface-variant">{formatDate(screening.createdAt)}</span>
                  <h4 className="text-sm font-bold text-on-surface">Skrining Anemia</h4>
                  <p className="text-xs text-on-surface-variant">
                    Status: {STATUS_LABELS[screening.status] ?? screening.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-transparent text-center">
        <Link href={ROUTES.NAKES.MONITORING} className="text-sm font-bold text-primary hover:underline">
          Lihat Semua Riwayat
        </Link>
      </div>
    </div>
  );
}
