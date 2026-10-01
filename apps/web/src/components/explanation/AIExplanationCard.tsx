"use client";

import { Sparkles, RefreshCw, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import { ScreeningExplanation } from "@/types/explanation";

interface AIExplanationCardProps {
  explanation: ScreeningExplanation | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  title?: string;
  compact?: boolean;
}

export function AIExplanationCard({
  explanation,
  isLoading,
  error,
  onGenerate,
  title = "Penalaran Klinis",
  compact = false,
}: AIExplanationCardProps) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-outline shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-on-surface">{title}</h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            Transparansi keputusan model berbasis multimodal vision dan Large Language Model.
          </p>
        </div>

        {explanation && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline bg-white hover:bg-surface text-on-surface text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Menganalisis..." : "Regenerasi AI"}</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="p-8 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-on-surface-variant">
            Menghubungkan ke API Explainable AI dan mengekstrak penalaran klinis...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error-container/30 border border-error/30 rounded-xl space-y-2">
          <p className="text-xs text-error font-medium">{error}</p>
          <button
            type="button"
            onClick={onGenerate}
            className="text-xs font-bold text-primary hover:underline"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {!isLoading && !error && !explanation && (
        <div className="p-4 bg-surface-container-low rounded-xl space-y-2">
          <p className="text-sm text-on-surface-variant">
            Buat ringkasan naratif berdasarkan hasil skrining dan kontribusi setiap situs.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors"
          >
            Buat Penalaran Klinis
          </button>
        </div>
      )}

      {!isLoading && !error && explanation?.status === "generated" && (
        <div className="space-y-4">
          {/* Headline & Summary */}
          <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/20 space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-on-surface">
                {explanation.content.headline}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {explanation.content.summary}
            </p>
          </div>

          {/* Meaning & Clinical Significance */}
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
              Apa Makna Klinisnya?
            </h5>
            <p className="text-xs sm:text-sm text-on-surface leading-relaxed bg-surface p-3.5 rounded-xl border border-outline">
              {explanation.content.what_this_means}
            </p>
          </div>

          {/* Evidence Cards */}
          {explanation.content.evidence && explanation.content.evidence.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Bukti Biomarker Mikrovaskular yang Digunakan
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {explanation.content.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface border border-outline text-xs text-on-surface leading-relaxed flex items-start gap-2.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps & Guidance */}
          {explanation.content.next_steps && explanation.content.next_steps.length > 0 && (
            <div className="p-4 rounded-xl bg-surface border border-outline space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Rekomendasi Tindak Lanjut dan Jadwal Pemantauan
              </h5>
              <ul className="space-y-1.5">
                {explanation.content.next_steps.map((step, idx) => (
                  <li key={idx} className="text-xs text-on-surface-variant flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {!compact && explanation.content.limitations && explanation.content.limitations.length > 0 && (
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline space-y-1.5 text-xs">
              <span className="font-bold text-on-surface-variant flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                Batasan Hasil
              </span>
              <ul className="space-y-1">
                {explanation.content.limitations.map((lim, idx) => (
                  <li key={idx} className="text-on-surface-variant leading-relaxed flex items-start gap-2">
                    <span className="text-warning mt-0.5">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Note */}
          {explanation.content.clinical_note && (
            <p className="text-xs italic text-on-surface-muted bg-surface-container-low p-3 rounded-lg border border-outline-variant">
              {explanation.content.clinical_note}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-[11px] text-on-surface-subtle">
            Dihasilkan {new Date(explanation.generatedAt).toLocaleString("id-ID")}
          </p>
        </div>
      )}

      {!isLoading && !error && explanation && explanation.status !== "generated" && (
        <div className="p-4 bg-error-container/30 border border-error/30 rounded-xl space-y-2">
          <p className="text-sm text-error">AI gagal memuat penalaran klinis. Coba lagi untuk mengulangi proses.</p>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
