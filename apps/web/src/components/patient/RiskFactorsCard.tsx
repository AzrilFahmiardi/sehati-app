"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export function RiskFactorsCard() {
  return (
    <div className="h-full bg-surface-container-low rounded-xl outline outline-1 outline-outline p-6 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-on-surface">
          Faktor Risiko
        </h3>
      </div>

      {/* Factors List */}
      <div className="flex flex-col gap-3">
        {/* Factor 1 */}
        <div className="flex items-start gap-3">
          <div className="pt-2">
            <div className="w-1.5 h-1.5 bg-error rounded-full" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-base font-bold text-on-surface">
              Diet rendah zat besi
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Pola makan kurang variasi protein hewani
            </p>
          </div>
        </div>

        {/* Factor 2 */}
        <div className="flex items-start gap-3">
          <div className="pt-2">
            <div className="w-1.5 h-1.5 bg-warning rounded-full" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-base font-bold text-on-surface">
              Riwayat keluarga
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Kecenderungan anemia pada keluarga inti
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
