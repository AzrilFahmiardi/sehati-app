"use client";

import React from "react";
import { Pill, Apple } from "lucide-react";

export function RecommendedActionsCard() {
  return (
    <div className="h-full bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 flex flex-col justify-between gap-4">
      {/* Header */}
      <h3 className="text-base font-bold text-on-surface">
        Rekomendasi Tindakan
      </h3>

      {/* Action List */}
      <div className="flex flex-col gap-3">
        {/* Item 1 */}
        <div className="p-3 bg-surface rounded-lg outline outline-1 outline-outline flex items-center gap-3">
          <div className="p-2 bg-primary-container/40 rounded-md shrink-0">
            <Pill className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-on-surface">
              Pertimbangkan Suplemen Zat Besi
            </h4>
            <p className="text-xs text-on-surface-variant">
              Tinjau dosis sesuai hasil pemeriksaan Hb
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="p-3 bg-surface rounded-lg outline outline-1 outline-outline flex items-center gap-3">
          <div className="p-2 bg-tertiary-container/40 rounded-md shrink-0">
            <Apple className="w-4 h-4 text-tertiary" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-on-surface">
              Konsultasi Gizi
            </h4>
            <p className="text-xs text-on-surface-variant">
              Jadwalkan dengan ahli gizi bila diperlukan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
