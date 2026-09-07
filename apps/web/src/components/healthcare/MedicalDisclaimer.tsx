import React from "react";
import { AlertTriangle } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed shadow-sm">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <strong className="font-semibold text-amber-950 block mb-0.5">
          Sistem Pendukung Skrining (Non-Diagnosis)
        </strong>
        <span>
          {compact
            ? "SEHATI tidak memberikan diagnosis medis definitif. Selalu lakukan tes konfirmasi laboratorium."
            : APP_CONFIG.safetyNotice}
        </span>
      </div>
    </div>
  );
}
