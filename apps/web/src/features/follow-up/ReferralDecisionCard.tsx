"use client";

import React from "react";
import {
  FileText,
  FlaskConical,
  Clock,
} from "lucide-react";

interface ReferralDecisionCardProps {
  onOpenLabModal?: () => void;
  onMarkPendingLab?: () => void;
  pendingLabMarked?: boolean;
  labConfirmed?: boolean;
  labHbValue?: number;
}

export function ReferralDecisionCard({
  onOpenLabModal,
  onMarkPendingLab,
  pendingLabMarked = false,
  labConfirmed = false,
  labHbValue,
}: ReferralDecisionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-outline shadow-xs p-5 space-y-4">
      <div className="border-b border-outline-variant pb-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Rekomendasi Tindak Lanjut Nakes
        </h3>
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          Protokol Skrining Terpadu KIA Puskesmas
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-1.5 text-xs">
        <span className="font-bold text-primary-dark block">
          Rekomendasi Utama: Pemeriksaan Konfirmasi Hb Laboratorium
        </span>
        <p className="text-on-surface-variant leading-relaxed">
          Pemeriksaan konfirmasi spesimen darah lengkap (CBC) atau Point-of-Care Hb fotometri terstandar sangat dianjurkan sebelum penegakan diagnosis definitif atau penggantian dosis suplemen zat besi oral.
        </p>
      </div>

      {labConfirmed && labHbValue != null && (
        <div className="p-3 rounded-lg bg-tertiary-container/40 border border-tertiary/20 text-xs flex items-center justify-between">
          <span className="text-on-surface font-medium">Hasil Lab Terkonfirmasi</span>
          <span className="font-bold font-mono text-tertiary-alt">{labHbValue.toFixed(1)} g/dL</span>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onOpenLabModal}
          className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FlaskConical className="w-4 h-4" />
          <span>{labConfirmed ? "Perbarui Hasil Konfirmasi Lab" : "Input Hasil Konfirmasi Laboratorium"}</span>
        </button>

        {!labConfirmed && (
          <button
            type="button"
            onClick={onMarkPendingLab}
            disabled={pendingLabMarked}
            className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium text-xs sm:text-sm rounded-lg border border-outline-variant flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Clock className="w-4 h-4 text-on-surface-variant" />
            <span>{pendingLabMarked ? "Menunggu Konfirmasi Lab Ditandai" : "Tandai Menunggu Konfirmasi Lab"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
