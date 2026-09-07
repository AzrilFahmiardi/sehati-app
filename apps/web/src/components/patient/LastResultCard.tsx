"use client";

import React from "react";
import { Calendar, Activity } from "lucide-react";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LastResultCard({ screening }: { screening: ScreeningSummary | null }) {
  const hbEntries =
    screening?.siteSummaries.filter((site) => site.hbGdl !== null) ?? [];

  return (
    <div className="relative h-full bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 flex flex-col justify-between overflow-hidden gap-4">
      {/* Background Watermark Icon */}
      <div className="absolute top-1 right-1 opacity-10 pointer-events-none p-4">
        <Activity className="w-20 h-20 text-on-surface" />
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
          Hasil Terakhir
        </h3>

        {screening ? (
          <>
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <Calendar className="w-4 h-4 text-on-surface-variant" />
              <span>{formatDate(screening.createdAt)}</span>
              <span className="text-on-surface-variant">•</span>
              <span>{STATUS_LABELS[screening.status] ?? screening.status}</span>
            </div>

            {hbEntries.length > 0 ? (
              <div className="pt-2 space-y-1">
                {hbEntries.map((site) => (
                  <div key={site.site} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{SITE_LABELS[site.site] ?? site.site}</span>
                    <span className="font-bold text-on-surface">{site.hbGdl!.toFixed(1)} g/dL</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant pt-2">Belum ada hasil Hb untuk skrining ini.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">Belum ada riwayat skrining.</p>
        )}
      </div>
    </div>
  );
}
