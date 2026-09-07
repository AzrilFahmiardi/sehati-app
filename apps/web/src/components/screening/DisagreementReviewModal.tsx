"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, AlertTriangle, Check, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DISAGREEMENT_REASONS, DisagreementReason, OriginalAiSnapshot } from "@/types/validation";

interface DisagreementReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => void;
  isLoading?: boolean;
  aiSnapshot: OriginalAiSnapshot | null;
  initialNotes?: string;
}

const MIN_NOTE_LENGTH = 10;
const MAX_NOTE_LENGTH = 600;

export function DisagreementReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  aiSnapshot,
  initialNotes = "",
}: DisagreementReviewModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<DisagreementReason[]>([]);
  const [notes, setNotes] = useState(initialNotes);
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([]);
      setNotes(initialNotes || "");
      setTouched(false);
      setValidationError(null);
    }
  }, [isOpen, initialNotes]);

  const toggleReason = (reason: DisagreementReason) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      if (exists) {
        return prev.filter((r) => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
    setValidationError(null);
  };

  const isOtherReason = selectedReasons.includes("Alasan lainnya");
  const trimmedNotes = notes.trim();

  // Validate form
  const validate = (): boolean => {
    setTouched(true);
    if (selectedReasons.length === 0) {
      setValidationError("Silakan pilih minimal satu alasan peninjauan.");
      return false;
    }
    if (isOtherReason && trimmedNotes.length < MIN_NOTE_LENGTH) {
      setValidationError(
        `Untuk "Alasan lainnya", catatan tenaga kesehatan wajib diisi minimal ${MIN_NOTE_LENGTH} karakter.`
      );
      return false;
    }
    if (trimmedNotes.length > 0 && trimmedNotes.length < MIN_NOTE_LENGTH) {
      setValidationError(
        `Catatan klinis minimal ${MIN_NOTE_LENGTH} karakter agar terdokumentasi dengan baik.`
      );
      return false;
    }
    if (trimmedNotes.length === 0) {
      setValidationError(
        "Harap sertakan catatan observasi klinis sebelum menyimpan peninjauan."
      );
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(selectedReasons.join(", "), trimmedNotes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title="Peninjauan Hasil Skrining"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {isOtherReason && (
              <span className="text-amber-700 font-medium">* Catatan klinis wajib diisi</span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              className="bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
              onClick={handleSubmit}
              isLoading={isLoading}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Simpan Peninjauan
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-600 leading-relaxed">
            Catat alasan peninjauan agar keputusan klinis terdokumentasi dengan jelas.
            Hasil skrining awal AI tetap disimpan sebagai rekaman riwayat pemeriksaan.
          </p>
        </div>

        {/* Mini AI Context Banner */}
        {aiSnapshot && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <span className="text-slate-500 font-medium">Hasil AI Asli:</span>
            <span className="font-semibold text-slate-900">
              {aiSnapshot.whoCategoryTitle} ({aiSnapshot.hbGdl.toFixed(1)} g/dL)
            </span>
            <span className="text-slate-500">
              {aiSnapshot.passedQcCount}/{aiSnapshot.siteCount} QC Lolos
            </span>
          </div>
        )}

        {/* Structured Checkboxes (Multi-select) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Alasan Peninjauan <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500 font-normal">
              (Dapat memilih lebih dari satu)
            </span>
          </div>

          <div className="space-y-2">
            {DISAGREEMENT_REASONS.map((reason) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <label
                  key={reason}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleReason(reason);
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                      isSelected
                        ? "bg-amber-600 border-amber-600 text-white shadow-2xs scale-105"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isSelected ? "text-amber-950 font-semibold" : "text-slate-800"
                      }`}
                    >
                      {reason}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Clinical Notes Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="clinical-review-notes"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Catatan Tenaga Kesehatan</span>
              <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                trimmedNotes.length > MAX_NOTE_LENGTH
                  ? "text-rose-600 font-bold"
                  : trimmedNotes.length >= MIN_NOTE_LENGTH
                  ? "text-emerald-600 font-medium"
                  : "text-slate-400"
              }`}
            >
              {trimmedNotes.length} / {MAX_NOTE_LENGTH} karakter (min. {MIN_NOTE_LENGTH})
            </span>
          </div>

          <textarea
            id="clinical-review-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value.slice(0, MAX_NOTE_LENGTH));
              if (validationError) setValidationError(null);
            }}
            rows={4}
            placeholder="Tambahkan observasi, pertimbangan klinis, atau instruksi untuk pasien..."
            className={`w-full p-3.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
              validationError && !trimmedNotes
                ? "border-rose-400 focus:ring-2 focus:ring-rose-400"
                : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            }`}
          />

          <p className="text-[11px] text-slate-500">
            Catatan ini akan dicatat bersama status peninjauan dan dapat diakses oleh tim medis terkait.
          </p>
        </div>

        {/* Inline Error Message */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
