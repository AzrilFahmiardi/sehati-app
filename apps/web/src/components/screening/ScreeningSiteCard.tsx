import React from "react";
import { ScreeningSite, ImageQuality } from "@/types/screening";
import { Card } from "../ui/Card";
import { CheckCircle2, Eye, Hand, Sparkles, AlertCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScreeningSiteCardProps {
  site: ScreeningSite;
  status: "pending" | "captured" | "validated";
  quality?: ImageQuality;
  onCaptureClick?: () => void;
}

export function ScreeningSiteCard({
  site,
  status,
  quality,
  onCaptureClick,
}: ScreeningSiteCardProps) {
  const siteConfig = {
    conjunctiva: {
      title: "Citra Mata / Konjungtiva",
      description: "Analisis tingkat kepucatan mukosa palpebra bawah.",
      icon: Eye,
    },
    nail: {
      title: "Citra Jari / Kuku",
      description: "Analisis vaskularisasi & perfusi bantalan kuku.",
      icon: Sparkles,
    },
    palm: {
      title: "Citra Telapak Tangan",
      description: "Analisis lipatan kapiler & warna eritema palmaris.",
      icon: Hand,
    },
  };

  const config = siteConfig[site];
  const Icon = config.icon;

  return (
    <Card className="p-5 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border",
              status === "validated"
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : status === "captured"
                ? "bg-surface-container-low border-primary-light text-primary"
                : "bg-slate-50 border-slate-200 text-slate-500"
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{config.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
          </div>
        </div>

        {status === "validated" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
          </span>
        ) : status === "captured" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-primary-dark bg-surface-container-low px-2.5 py-1 rounded-full border border-primary-light">
            Tersimpan
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Belum Ambil
          </span>
        )}
      </div>

      {quality && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500">Kualitas Citra:</span>
          <span
            className={cn(
              "font-bold uppercase tracking-wider text-[11px]",
              quality === "good"
                ? "text-emerald-600"
                : quality === "acceptable"
                ? "text-amber-600"
                : "text-rose-600"
            )}
          >
            {quality === "good" ? "Bagus" : quality === "acceptable" ? "Cukup" : "Kurang"}
          </span>
        </div>
      )}

      {onCaptureClick && (
        <button
          onClick={onCaptureClick}
          className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>{status === "pending" ? "Ambil Gambar" : "Ambil Ulang"}</span>
        </button>
      )}
    </Card>
  );
}
