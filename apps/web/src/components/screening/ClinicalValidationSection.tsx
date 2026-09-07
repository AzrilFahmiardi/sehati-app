"use client";

import React from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Info,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClinicalValidationRecord, OriginalAiSnapshot } from "@/types/validation";
import { ROUTES } from "@/lib/routes";

interface ClinicalValidationSectionProps {
  validationRecord: ClinicalValidationRecord | null;
  aiSnapshot: OriginalAiSnapshot | null;
  clinicalNotes: string;
  hasPoorImageQuality?: boolean;
  poorQualitySites?: string[];
  isAiProcessing?: boolean;
  onOpenConfirmModal: () => void;
  onOpenReviewModal: () => void;
  patientId?: string;
  saveError?: string | null;
  onRetrySave?: () => void;
}

export function ClinicalValidationSection({
  validationRecord,
  aiSnapshot,
  clinicalNotes,
  hasPoorImageQuality = false,
  poorQualitySites = [],
  isAiProcessing = false,
  onOpenConfirmModal,
  onOpenReviewModal,
  patientId,
  saveError,
  onRetrySave,
}: ClinicalValidationSectionProps) {
  const isAwaiting = !validationRecord;
  const isConfirmed = validationRecord?.status === "confirmed";
  const isNeedsReview = validationRecord?.status === "needs_review";

  return (
    <section
      id="validasi-tenaga-kesehatan"
      className="w-full bg-white rounded-2xl border border-outline shadow-sm overflow-hidden transition-all duration-300"
    >
      {/* Top Banner Header */}
      <div className="p-6 sm:p-7 border-b border-outline bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isConfirmed
                ? "bg-tertiary-container text-tertiary-alt"
                : isNeedsReview
                ? "bg-amber-100 text-amber-800"
                : "bg-primary-container text-primary"
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="w-6 h-6 text-tertiary" />
            ) : isNeedsReview ? (
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            ) : (
              <UserCheck className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                Validasi Tenaga Kesehatan
              </h2>
              {/* Status Badge */}
              {isAwaiting && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container text-primary-darkest">
                  Menunggu Validasi
                </span>
              )}
              {isConfirmed && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container text-tertiary-alt flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Dikonfirmasi Tenaga Kesehatan</span>
                </span>
              )}
              {isNeedsReview && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Perlu Peninjauan Tenaga Kesehatan</span>
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {isAwaiting
                ? "Tinjau hasil skrining AI sebelum hasil dikonfirmasi dan disimpan."
                : "Keputusan klinis tenaga kesehatan terdokumentasi dalam rekam medis."}
            </p>
          </div>
        </div>

        {/* Timestamp when validated */}
        {validationRecord && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-high px-3.5 py-2 rounded-xl self-start sm:self-auto shrink-0">
            <Clock className="w-4 h-4 text-on-surface-variant" />
            <span>{validationRecord.formattedTimestamp}</span>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        {/* Recoverable Save Error Alert */}
        {saveError && (
          <div className="p-4 bg-error-container/40 border border-error/30 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <p className="text-sm text-error font-medium">{saveError}</p>
            </div>
            {onRetrySave && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetrySave}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Coba Lagi
              </Button>
            )}
          </div>
        )}

        {/* Poor Image Quality Warning (Edge Case) */}
        {hasPoorImageQuality && isAwaiting && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">
                Peringatan: Kualitas Citra Memerlukan Perhatian
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Terdapat situs pemeriksaan (
                <span className="font-semibold">{poorQualitySites.join(", ")}</span>
                ) yang tidak lolos uji kualitas citra (QC). Pertimbangkan faktor ini saat
                memvalidasi hasil AI.
              </p>
            </div>
          </div>
        )}

        {/* AI Processing Incomplete State */}
        {isAiProcessing && (
          <div className="p-5 bg-surface-container-low rounded-xl border border-outline/60 text-center space-y-2">
            <p className="text-sm font-medium text-on-surface">
              Pemrosesan AI multi-situs sedang berjalan...
            </p>
            <p className="text-xs text-on-surface-variant">
              Validasi Tenaga Kesehatan dapat dilakukan setelah keputusan inferensi AI selesai.
            </p>
          </div>
        )}

        {/* AI Evidence Summary Chips */}
        {aiSnapshot && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Ringkasan Bukti Skrining AI</span>
              </span>
              <span className="text-xs text-on-surface-variant italic">
                Skrining awal, bukan diagnosis medis
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Classification */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Klasifikasi AI
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {aiSnapshot.whoCategoryTitle}
                </span>
              </div>

              {/* Estimated Hb */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Estimasi Hb
                </span>
                <span className="text-sm font-bold text-primary font-mono">
                  {aiSnapshot.hbGdl.toFixed(1)} g/dL
                </span>
              </div>

              {/* Confidence */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Tingkat Keyakinan
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {aiSnapshot.confidenceLabel}
                </span>
              </div>

              {/* Image Quality Summary */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline/30 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Kualitas Citra
                </span>
                <span
                  className={`text-sm font-bold ${
                    aiSnapshot.passedQcCount === aiSnapshot.siteCount
                      ? "text-tertiary-alt"
                      : "text-amber-700"
                  }`}
                >
                  {aiSnapshot.passedQcCount} / {aiSnapshot.siteCount} Situs Lolos
                </span>
              </div>
            </div>

            {/* Clinical Recommendation summary chip */}
            {aiSnapshot.recommendationTitle && (
              <div className="p-3.5 bg-surface-container-low/60 rounded-xl border border-outline/30 flex items-start gap-3 text-xs text-on-surface-variant">
                <Stethoscope className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-on-surface block">
                    {aiSnapshot.recommendationTitle}
                  </span>
                  {aiSnapshot.recommendationBody && (
                    <span className="line-clamp-2 leading-relaxed">
                      {aiSnapshot.recommendationBody}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- STATE A: AWAITING VALIDATION ---------------- */}
        {isAwaiting && !isAiProcessing && (
          <div className="pt-4 border-t border-outline space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-on-surface">
                Tentukan Keputusan Validasi:
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pilih apakah hasil skrining AI sesuai dengan observasi klinis pasien atau
                memerlukan peninjauan lebih lanjut.
              </p>
            </div>

            {/* Two Distinct Choice Buttons (Clear Hierarchy) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              {/* Primary Action: Konfirmasi Hasil */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onOpenConfirmModal}
                className="flex-1 sm:flex-initial px-8 py-3.5 shadow-md hover:shadow-lg transition-all"
                leftIcon={<Check className="w-5 h-5 stroke-[3]" />}
              >
                Konfirmasi Hasil
              </Button>

              {/* Secondary Action: Perlu Peninjauan (Warning-styled outline button) */}
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 border-amber-600 bg-amber-50/40 text-amber-900 hover:bg-amber-100 hover:border-amber-700 font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 select-none min-h-[50px]"
              >
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <span>Perlu Peninjauan</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant pt-1">
              <Info className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <span>
                Hasil AI akan diaudit dan tidak akan ditimpa, melainkan dilengkapi dengan
                status validasi tenaga kesehatan.
              </span>
            </div>
          </div>
        )}

        {/* ---------------- STATE B: CONFIRMED (AUDIT TRAIL) ---------------- */}
        {isConfirmed && validationRecord && (
          <div className="pt-4 border-t border-outline space-y-5">
            <div className="p-5 bg-tertiary-container/30 border border-tertiary/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-tertiary-alt font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-tertiary" />
                  <span>Hasil Telah Dikonfirmasi oleh Tenaga Kesehatan</span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {validationRecord.formattedTimestamp}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-tertiary/10">
                <div>
                  <span className="text-on-surface-variant block font-medium">Peninjau:</span>
                  <span className="font-bold text-on-surface text-sm">
                    {validationRecord.reviewerName}
                  </span>
                  <span className="text-on-surface-variant block">
                    {validationRecord.reviewerRole}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-medium">
                    Status Skrining:
                  </span>
                  <span className="font-semibold text-tertiary-alt">
                    Disetujui untuk Dilanjutkan ke Rekam Medis
                  </span>
                </div>
              </div>

              {validationRecord.notes && validationRecord.notes.trim().length > 0 && (
                <div className="pt-2 border-t border-tertiary/10 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Catatan Klinis:
                  </span>
                  <p className="text-xs text-on-surface bg-white/70 p-3 rounded-lg border border-tertiary/15 leading-relaxed">
                    {validationRecord.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Next Steps / Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-on-surface-variant">
                Validasi telah selesai dan tercatat secara permanen.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={ROUTES.NAKES.MONITORING}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-container/40 rounded-lg transition-colors flex-1 sm:flex-none border border-outline"
                >
                  <span>Lihat Riwayat</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {patientId ? (
                  <Link
                    href={ROUTES.NAKES.PASIEN_DETAIL(patientId)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex-1 sm:flex-none shadow-xs"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.NAKES.PASIEN_LIST}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex-1 sm:flex-none shadow-xs"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STATE C: NEEDS REVIEW (AUDIT TRAIL) ---------------- */}
        {isNeedsReview && validationRecord && (
          <div className="pt-4 border-t border-outline space-y-5">
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  <span>Hasil Memerlukan Peninjauan Klinis Lebih Lanjut</span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {validationRecord.formattedTimestamp}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-amber-200/60">
                <div>
                  <span className="text-on-surface-variant block font-medium">Peninjau:</span>
                  <span className="font-bold text-on-surface text-sm">
                    {validationRecord.reviewerName}
                  </span>
                  <span className="text-on-surface-variant block">
                    {validationRecord.reviewerRole}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-medium">
                    Alasan Peninjauan:
                  </span>
                  <span className="font-semibold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-md inline-block mt-0.5">
                    {validationRecord.reason || "Peninjauan klinis diperlukan"}
                  </span>
                </div>
              </div>

              {validationRecord.notes && (
                <div className="pt-2 border-t border-amber-200/60 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Catatan Klinis:
                  </span>
                  <p className="text-xs text-on-surface bg-white p-3 rounded-lg border border-amber-200 leading-relaxed">
                    {validationRecord.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Next Steps / Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-on-surface-variant">
                Hasil AI asli tetap disimpan lengkap dengan audit peninjauan klinis.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={ROUTES.NAKES.SKRINING_BARU}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 rounded-lg transition-colors flex-1 sm:flex-none border border-amber-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Skrining Ulang</span>
                </Link>
                {patientId ? (
                  <Link
                    href={ROUTES.NAKES.PASIEN_DETAIL(patientId)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex-1 sm:flex-none shadow-xs"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.NAKES.PASIEN_LIST}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex-1 sm:flex-none shadow-xs"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
