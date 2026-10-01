import React from "react";
import { ScreeningSite } from "@/types/screening";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { site: ScreeningSite; label: string }[] = [
  { site: "conjunctiva", label: "Mata" },
  { site: "palm", label: "Telapak Tangan" },
  { site: "nail", label: "Jari/Kuku" },
];

export function ScreeningProgress({
  activeSite,
  completedSites,
}: {
  activeSite?: ScreeningSite;
  completedSites: ScreeningSite[];
}) {
  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
        {STEPS.map((step, idx) => {
          const isCompleted = completedSites.includes(step.site);
          const isActive = activeSite === step.site;

          return (
            <div key={step.site} className="flex flex-col items-center gap-1.5 z-10 bg-white px-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2",
                  isCompleted
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : isActive
                    ? "bg-primary border-primary text-white ring-4 ring-primary-container"
                    : "bg-slate-100 border-slate-300 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-primary" : isCompleted ? "text-emerald-700" : "text-slate-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
