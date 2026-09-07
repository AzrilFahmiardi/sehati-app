import React from "react";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";

export interface AIAnalysisStatusProps {
  state:
    | "idle"
    | "analyzing"
    | "completed"
    | "poor_quality"
    | "inconclusive"
    | "error";
  onRetry?: () => void;
}

export function AIAnalysisStatus({ state, onRetry }: AIAnalysisStatusProps) {
  if (state === "idle") return null;

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 transition-all",
        state === "analyzing" && "bg-surface-container-low/60 border-primary-light",
        state === "completed" && "bg-emerald-50/60 border-emerald-200",
        state === "poor_quality" && "bg-amber-50/60 border-amber-200",
        state === "inconclusive" && "bg-slate-50/60 border-slate-300",
        state === "error" && "bg-rose-50/60 border-rose-200"
      )}
    >
      {state === "analyzing" && (
        <>
          <div className="p-3 bg-primary text-white rounded-full animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Model AI Sedang Menganalisis Citra...</h4>
          <p className="text-xs text-slate-600 max-w-xs">
            Mengkalkulasi estimasi tingkat hemoglobin berdasarkan ekstraksi fitur mata, jari, dan telapak tangan.
          </p>
        </>
      )}

      {state === "completed" && (
        <>
          <div className="p-3 bg-emerald-600 text-white rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Analisis AI Selesai</h4>
          <p className="text-xs text-slate-600 max-w-xs">
            Hasil estimasi skrining dan tingkat risiko telah siap ditinjau.
          </p>
        </>
      )}

      {state === "poor_quality" && (
        <>
          <div className="p-3 bg-amber-500 text-white rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Kualitas Citra Kurang Optimal</h4>
          <p className="text-xs text-slate-600 max-w-xs mb-2">
            Pencahayaan atau ketajaman foto kurang memenuhi standar. Disarankan melakukan pengambilan ulang.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Ambil Foto Ulang
            </Button>
          )}
        </>
      )}

      {state === "inconclusive" && (
        <>
          <div className="p-3 bg-slate-600 text-white rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Hasil Skrining Tidak Konklusif</h4>
          <p className="text-xs text-slate-600 max-w-xs mb-2">
            Model AI tidak dapat menyimpulkan estimasi dengan tingkat kepercayaan minimum. Lakukan tes laboratorium langsung.
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <div className="p-3 bg-rose-600 text-white rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">Gagal Memproses Citra</h4>
          <p className="text-xs text-slate-600 max-w-xs mb-2">
            Terjadi kendala pada pengolahan citra. Silakan coba kembali beberapa saat lagi.
          </p>
          {onRetry && (
            <Button variant="destructive" size="sm" onClick={onRetry}>
              Coba Ulang
            </Button>
          )}
        </>
      )}
    </div>
  );
}
