"use client";

import React from "react";
import { Eye, Sparkles, Hand } from "lucide-react";
import { SiteContribution } from "@/data/mock/site-contributions";

const SITE_META: Record<string, { title: string; icon: typeof Eye }> = {
  conjunctiva: { title: "Mata", icon: Eye },
  nail: { title: "Kuku / Jari", icon: Sparkles },
  palm: { title: "Telapak Tangan", icon: Hand },
};

export function SiteContributionCard({
  contributions,
}: {
  contributions: SiteContribution[];
}) {
  if (contributions.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-on-surface text-2xl font-bold tracking-tight">
        Kontribusi Area
      </h2>
      <div className="w-full bg-white rounded-xl border border-outline p-6 shadow-xs space-y-5">
        <p className="text-on-surface-variant text-sm font-normal">
          Seberapa besar tiap area pemeriksaan memengaruhi hasil estimasi akhir.
        </p>

        <div className="space-y-4">
          {contributions.map((contribution, index) => {
            const meta = SITE_META[contribution.site] ?? {
              title: contribution.site,
              icon: Eye,
            };
            const IconComp = meta.icon;
            const percent = Math.round(contribution.weight * 100);
            const isDominant = index === 0 && percent > 0;

            return (
              <div key={contribution.site} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <IconComp className="w-4 h-4 text-on-surface-variant" />
                    <span className="font-semibold text-on-surface">
                      {meta.title}
                    </span>
                    {isDominant && (
                      <span className="px-1.5 py-0.5 bg-primary-container text-primary-darkest text-[10px] font-bold rounded-md uppercase tracking-wider ml-1">
                        Dominan
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-on-surface-variant">
                    {percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDominant ? "bg-primary" : "bg-primary/50"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Estimasi: {contribution.hbEstimate.toFixed(1)} g/dL</span>
                  <span>Tingkat Kepastian: {Math.round(contribution.confidence * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
