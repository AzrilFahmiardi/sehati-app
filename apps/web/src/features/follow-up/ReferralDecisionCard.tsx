"use client";

import React from "react";
import {
  FileText,
  FlaskConical,
  Clock,
  UserCheck,
  Printer,
  ShieldCheck,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReferralDecisionCardProps {
  onOpenLabModal?: () => void;
  onMarkPendingLab?: () => void;
  onReferSpog?: () => void;
  onGenerateReport?: () => void;
  pendingLabMarked?: boolean;
}

export function ReferralDecisionCard({
  onOpenLabModal,
  onMarkPendingLab,
  onReferSpog,
  onGenerateReport,
  pendingLabMarked = false,
}: ReferralDecisionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-outline shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="border-b border-outline-variant pb-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Rekomendasi Tindak Lanjut Nakes
        </h3>
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          Protokol Skrining Terpadu KIA Puskesmas
        </p>
      </div>

      {/* Main recommendation callout */}
      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant space-y-1.5 text-xs">
        <span className="font-bold text-primary-dark block">
          Rekomendasi Utama: Pemeriksaan Konfirmasi Hb Laboratorium
        </span>
        <p className="text-on-surface-variant leading-relaxed">
          Pemeriksaan konfirmasi spesimen darah lengkap (CBC) atau Point-of-Care Hb fotometri terstandar sangat dianjurkan sebelum penegakan diagnosis definitif atau penggantian dosis suplemen zat besi oral.
        </p>
      </div>

      {/* Action buttons list */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onOpenLabModal}
          className="w-full py-2.5 px-4 bg-primary-dark hover:bg-primary-darkest text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Input Hasil Konfirmasi Laboratorium</span>
        </button>

        <button
          type="button"
          onClick={onMarkPendingLab}
          className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium text-xs sm:text-sm rounded-lg border border-outline-variant flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4 text-on-surface-variant" />
          <span>✓ Menunggu Konfirmasi Lab Ditandai</span>
        </button>

        <button
          type="button"
          onClick={onGenerateReport}
          className="w-full py-2 text-on-surface-variant hover:text-primary-dark font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Buat Laporan Skrining Lengkap (PDF / Rekam Medis)</span>
        </button>
      </div>
    </div>
  );
}
