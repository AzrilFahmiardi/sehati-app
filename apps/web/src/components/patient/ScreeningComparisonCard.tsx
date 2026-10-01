"use client";

import React from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { ScreeningSummary } from "@/services/screening";

const WHO_LABELS: Record<string, string> = {
  normal: "Normal",
  mild: "Ringan",
  moderate: "Sedang",
  severe: "Berat",
};

const WHO_COLORS: Record<string, string> = {
  normal: "text-tertiary",
  mild: "text-warning",
  moderate: "text-warning",
  severe: "text-error",
};

export function ScreeningComparisonCard({
  current,
  previous,
}: {
  current: ScreeningSummary;
  previous: ScreeningSummary;
}) {
  const getAverageHb = (screening: ScreeningSummary) => {
    const values = screening.siteSummaries
      .map((site) => site.hbGdl)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  const currentHb = getAverageHb(current);
  const previousHb = getAverageHb(previous);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const hbDelta =
    currentHb !== null && previousHb !== null
      ? currentHb - previousHb
      : null;

  const isImproved = hbDelta !== null && hbDelta >= 0.5;
  const isDeclined = hbDelta !== null && hbDelta <= -0.5;
  const isStable = hbDelta !== null && !isImproved && !isDeclined;

  return (
    <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-full text-primary">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-on-surface">Perbandingan Skrining</h3>
          <p className="text-sm text-on-surface-variant">
            Perubahan kondisi dari skrining sebelumnya
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -z-10 -translate-y-1/2 rounded-full" />

        {/* Previous Screening Box */}
        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-lg p-3 text-center bg-white">
          <span className="block text-xs font-medium text-on-surface-variant mb-1">
            {formatDate(previous.createdAt)}
          </span>
          <div className="space-y-0.5">
            <span className="block text-lg font-bold text-on-surface">
              {previousHb !== null ? previousHb.toFixed(1) : "-"} <span className="text-xs font-normal">g/dL</span>
            </span>
            <span className={`block text-xs font-semibold ${previous.whoCategory ? WHO_COLORS[previous.whoCategory] ?? "text-on-surface" : "text-on-surface"}`}>
              {previous.whoCategory ? WHO_LABELS[previous.whoCategory] ?? previous.whoCategory : "-"}
            </span>
          </div>
        </div>

        {/* Delta Indicator in Middle */}
        <div className="bg-white p-1 rounded-full shadow-sm z-10 shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container border border-outline">
            <ArrowRight className="w-4 h-4 text-on-surface-variant" />
          </div>
        </div>

        {/* Current Screening Box */}
        <div className="flex-1 bg-surface-container-lowest border-2 border-primary/20 rounded-lg p-3 text-center bg-white shadow-2xs">
          <span className="block text-xs font-medium text-on-surface-variant mb-1">
            {formatDate(current.createdAt)}
          </span>
          <div className="space-y-0.5">
            <span className="block text-lg font-bold text-primary">
              {currentHb !== null ? currentHb.toFixed(1) : "-"} <span className="text-xs font-normal">g/dL</span>
            </span>
            <span className={`block text-xs font-semibold ${current.whoCategory ? WHO_COLORS[current.whoCategory] ?? "text-on-surface" : "text-on-surface"}`}>
              {current.whoCategory ? WHO_LABELS[current.whoCategory] ?? current.whoCategory : "-"}
            </span>
          </div>
        </div>
      </div>

      {hbDelta !== null && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-lg border ${
            isImproved
              ? "bg-tertiary-container/30 border-tertiary/20 text-tertiary-alt"
              : isDeclined
              ? "bg-error-container/30 border-error/20 text-error-dark"
              : "bg-surface-container-low border-outline text-on-surface-variant"
          }`}
        >
          {isImproved ? (
            <TrendingUp className="w-5 h-5 shrink-0" />
          ) : isDeclined ? (
            <TrendingDown className="w-5 h-5 shrink-0" />
          ) : (
            <Minus className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-medium leading-snug">
            {isImproved
              ? `Ada peningkatan estimasi Hb sebesar +${Math.abs(hbDelta).toFixed(1)} g/dL. Terus pertahankan pola hidup sehat!`
              : isDeclined
              ? `Estimasi Hb menunjukkan penurunan sebesar -${Math.abs(hbDelta).toFixed(1)} g/dL. Perhatikan asupan zat gizi Anda.`
              : "Estimasi Hb relatif stabil. Tidak ada perubahan signifikan dari pemeriksaan sebelumnya."}
          </p>
        </div>
      )}
    </div>
  );
}
