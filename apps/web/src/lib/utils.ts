import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AnemiaRisk } from "@/types/result";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHb(value: number): string {
  return `${value.toFixed(1)} g/dL`;
}

export function getRiskLabel(risk: AnemiaRisk): string {
  switch (risk) {
    case "low":
      return "Risiko Rendah";
    case "moderate":
      return "Risiko Sedang";
    case "high":
      return "Risiko Tinggi";
    case "inconclusive":
      return "Hasil Belum Konklusif";
    default:
      return "Tidak Diketahui";
  }
}

export function getRiskBadgeStyle(risk: AnemiaRisk): string {
  switch (risk) {
    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "moderate":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "inconclusive":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
