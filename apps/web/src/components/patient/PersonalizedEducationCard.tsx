"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  EducationArticle,
  PERSONALIZED_EDUCATION_DATA,
} from "@/data/mock/education-content";

const ACCENT_STYLES = {
  tertiary: {
    container: "bg-tertiary-container/30 border-tertiary-container",
    iconBg: "bg-tertiary text-white",
    badge: "bg-tertiary-container text-tertiary-alt border-tertiary",
    textHighlight: "text-tertiary-alt",
  },
  warning: {
    container: "bg-warning-container-lowest border-warning-accent/40",
    iconBg: "bg-warning-accent text-white",
    badge: "bg-warning-light text-warning-darkest border-warning-accent",
    textHighlight: "text-warning-darkest",
  },
  error: {
    container: "bg-error-container/30 border-error/30",
    iconBg: "bg-error text-white",
    badge: "bg-error-container text-error border-error",
    textHighlight: "text-error",
  },
};

export function PersonalizedEducationCard({
  whoCategory,
  compact = false,
}: {
  whoCategory?: string | null;
  compact?: boolean;
}) {
  const selectedArticle: EducationArticle =
    PERSONALIZED_EDUCATION_DATA.find((item) =>
      whoCategory ? item.whoCategories.includes(whoCategory) : false
    ) ?? PERSONALIZED_EDUCATION_DATA[0];

  const style = ACCENT_STYLES[selectedArticle.accentColor];

  if (compact) {
    return (
      <div
        className={`w-full rounded-xl border p-4 shadow-xs flex flex-col gap-3 ${style.container}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg}`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badge}`}
            >
              {selectedArticle.badge}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Edukasi Khusus
          </span>
        </div>

        <div>
          <h3 className="text-on-surface font-bold text-base leading-snug">
            {selectedArticle.title}
          </h3>
          <p className="text-on-surface-variant text-xs font-normal leading-relaxed mt-1">
            {selectedArticle.summary}
          </p>
        </div>

        <Link
          href={ROUTES.PATIENT.EDUKASI}
          className="inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline mt-1"
        >
          <span>Baca panduan lengkap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-xl border p-6 shadow-xs space-y-4 ${style.container}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${style.badge}`}
            >
              {selectedArticle.badge}
            </span>
          </div>
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          Disesuaikan dengan status skrining Anda
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-on-surface font-bold text-xl leading-snug">
          {selectedArticle.title}
        </h3>
        <p className="text-on-surface-variant text-sm font-normal leading-relaxed">
          {selectedArticle.summary}
        </p>
      </div>

      <div className="bg-white/80 rounded-lg p-4 border border-outline/50 space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-primary" />
          Rekomendasi Praktis
        </span>
        <div className="space-y-2">
          {selectedArticle.recommendations.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
