"use client";

import React, { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ScreeningSummary } from "@/services/screening";

interface TrendPoint {
  screeningId: string;
  label: string;
  value: number;
}

function buildTrendPoints(screenings: ScreeningSummary[]): TrendPoint[] {
  return screenings
    .map((screening) => {
      const values = screening.siteSummaries
        .map((site) => site.hbGdl)
        .filter((v): v is number => v !== null);
      if (values.length === 0) return null;
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        screeningId: screening.screeningId,
        label: new Date(screening.createdAt).toLocaleDateString("id-ID", { month: "short" }).toUpperCase(),
        value: Math.round(average * 10) / 10,
      };
    })
    .filter((point): point is TrendPoint => point !== null)
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-6);
}

export function HemoglobinTrendCard({ screenings }: { screenings: ScreeningSummary[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const points = buildTrendPoints(screenings);

  if (points.length === 0) {
    return (
      <div className="h-full bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 space-y-2">
        <h3 className="text-base font-bold text-on-surface">Tren Hemoglobin</h3>
        <p className="text-sm text-on-surface-variant">Belum ada hasil Hb yang tercatat.</p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const delta = previous ? Math.round((latest.value - previous.value) * 10) / 10 : null;

  return (
    <div className="h-full bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-on-surface">Tren Hemoglobin</h3>

        <div className="h-36 pt-6 px-2 flex items-end justify-between gap-3">
          {points.map((point, idx) => {
            const heightPercent = 20 + ((point.value - min) / range) * 80;
            return (
              <div
                key={point.screeningId}
                className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className={`absolute px-2 py-0.5 bg-on-surface text-white text-[10px] font-normal rounded transition-opacity duration-200 pointer-events-none z-10 ${
                    hoveredIdx === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ bottom: `calc(${heightPercent}% + 8px)` }}
                >
                  {point.value}
                </div>
                <div
                  className={`w-full max-w-[52px] rounded-t-sm transition-all duration-300 ${
                    idx === points.length - 1 ? "bg-primary" : "bg-primary/40"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-2 text-[10px] font-mono font-normal text-on-surface-variant uppercase">
          {points.map((point) => (
            <div key={point.screeningId} className="flex-1 text-center">
              {point.label}
            </div>
          ))}
        </div>
      </div>

      {delta !== null && (
        <div className={`pt-4 flex items-center gap-1.5 text-xs font-medium ${delta < 0 ? "text-error" : "text-tertiary"}`}>
          {delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          <span>
            {delta < 0 ? "Turun" : "Naik"} {Math.abs(delta)} g/dL dari skrining sebelumnya
          </span>
        </div>
      )}
    </div>
  );
}
