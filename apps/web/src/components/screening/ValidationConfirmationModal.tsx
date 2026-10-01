"use client";

import React from "react";
import { Check, Info, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { OriginalAiSnapshot } from "@/types/validation";

interface ValidationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  aiSnapshot: OriginalAiSnapshot | null;
  clinicalNotes?: string;
}

export function ValidationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  aiSnapshot,
  clinicalNotes,
}: ValidationConfirmationModalProps) {
  if (!aiSnapshot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title="Konfirmasi Hasil Skrining"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Kembali
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            Konfirmasi & Simpan
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600 leading-relaxed">
          Anda akan mengonfirmasi bahwa hasil skrining AI telah ditinjau dan dapat
          dilanjutkan sebagai hasil skrining pasien.
        </p>

        {/* AI Snapshot Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hasil Skrining AI
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {aiSnapshot.confidenceLabel}
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-slate-200/60 pb-3">
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {aiSnapshot.whoCategoryTitle}
              </h4>
              <p className="text-xs text-slate-500">
                Klasifikasi WHO berbasis fusi multi-situs
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-blue-700 font-mono">
                {aiSnapshot.hbGdl.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">g/dL</span>
            </div>
          </div>

          {/* Quality Summary */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kualitas Citra:</span>
            </span>
            <span className="font-semibold text-slate-800">
              {aiSnapshot.passedQcCount} dari {aiSnapshot.siteCount} situs lolos QC
            </span>
          </div>

          {clinicalNotes && clinicalNotes.trim().length > 0 && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Catatan Tenaga Kesehatan
              </span>
              <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 italic line-clamp-2">
                &ldquo;{clinicalNotes.trim()}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Medical Disclaimer Reminder */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Perhatian:</span> Hasil ini merupakan
            skrining awal, bukan diagnosis medis definitif. Validasi ini menandakan
            bahwa tenaga kesehatan telah memeriksa kesesuaian hasil skrining AI
            dengan kondisi pasien.
          </p>
        </div>
      </div>
    </Modal>
  );
}
