"use client";

import type React from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import { ScreeningExplanation } from "@/types/explanation";

interface PatientExplanationCardsProps {
  explanation: ScreeningExplanation | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function PatientExplanationCards({
  explanation,
  isLoading,
  error,
  onGenerate,
}: PatientExplanationCardsProps) {
  const generated = explanation?.status === "generated";

  if (isLoading) {
    return (
      <section className="rounded-xl border border-primary/20 bg-primary-container/20 p-5">
        <p className="text-sm text-on-surface-variant">Menyiapkan penjelasan hasil Anda...</p>
      </section>
    );
  }

  if (error || !generated) {
    return (
      <section className="rounded-xl border border-error/30 bg-error-container/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-error" />
          <h2 className="font-bold text-on-surface">Penjelasan AI belum tersedia</h2>
        </div>
        <p className="text-sm text-error">
          {error ?? "AI gagal memuat penjelasan hasil Anda."}
        </p>
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Coba lagi
        </button>
      </section>
    );
  }

  const content = explanation.content;
  const evidence = simplifyList(content.evidence);
  const nextSteps = simplifyList(content.next_steps);
  const warnings = simplifyList(content.warning_signs);
  const questions = simplifyList(content.questions_for_healthcare_worker);

  return (
    <div className="space-y-4">
      <PatientInsightCard
        icon={<Lightbulb className="w-5 h-5" />}
        title="Apa arti hasil Anda?"
        tone="primary"
      >
        <p className="font-semibold text-on-surface">{simplifyText(content.headline)}</p>
        <p>{simplifyText(content.summary)}</p>
        <p className="text-xs">Hasil ini adalah skrining awal, bukan diagnosis. Pemeriksaan darah tetap diperlukan untuk memastikan kondisi Anda.</p>
      </PatientInsightCard>

      <PatientInsightCard
        icon={<HelpCircle className="w-5 h-5" />}
        title="Mengapa pemeriksaan lanjutan disarankan?"
        tone="tertiary"
      >
        <ExplanationList items={evidence} empty="AI belum memberikan alasan tambahan." />
      </PatientInsightCard>

      <PatientInsightCard
        icon={<CalendarClock className="w-5 h-5" />}
        title="Kapan sebaiknya diperiksa?"
        tone="primary"
      >
        <ExplanationList items={nextSteps.slice(0, 1)} empty="Konsultasikan waktu pemeriksaan dengan tenaga kesehatan." />
        <p className="text-xs">Jika keluhan terasa berat atau memburuk, jangan menunggu jadwal biasa untuk mencari bantuan.</p>
      </PatientInsightCard>

      <PatientInsightCard
        icon={<ClipboardList className="w-5 h-5" />}
        title="Yang dapat dilakukan sekarang"
        tone="tertiary"
      >
        <ExplanationList items={nextSteps.slice(1)} empty="Bicarakan hasil ini dengan tenaga kesehatan." />
      </PatientInsightCard>

      <PatientInsightCard
        icon={<ShieldAlert className="w-5 h-5" />}
        title="Kapan perlu mencari bantuan?"
        tone="error"
      >
        <ExplanationList items={warnings} empty="Cari bantuan jika kondisi Anda memburuk atau terasa mengkhawatirkan." />
      </PatientInsightCard>

      <PatientInsightCard
        icon={<CheckCircle2 className="w-5 h-5" />}
        title="Pertanyaan untuk tenaga kesehatan"
        tone="primary"
      >
        <ExplanationList items={questions} empty="Tanyakan langkah pemeriksaan berikutnya kepada tenaga kesehatan." />
      </PatientInsightCard>
    </div>
  );
}

function PatientInsightCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "primary" | "tertiary" | "error";
  children: React.ReactNode;
}) {
  const toneClass = {
    primary: "border-primary/25 bg-primary-container/15 text-primary",
    tertiary: "border-tertiary/25 bg-tertiary-container/15 text-tertiary-alt",
    error: "border-error/30 bg-error-container/25 text-error-dark",
  }[tone];

  return (
    <section className={`rounded-xl border p-5 space-y-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-on-surface">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-on-surface-variant">{children}</div>
    </section>
  );
}

function ExplanationList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p>{empty}</p>;
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ul>
  );
}

function simplifyList(items: string[] | undefined): string[] {
  return (items ?? []).map(simplifyText).filter(Boolean);
}

function simplifyText(value: string): string {
  return value
    .replace(/fusi multi-situs/gi, "gabungan hasil dari beberapa area pemeriksaan")
    .replace(/multi-situs/gi, "beberapa area pemeriksaan")
    .replace(/situs/gi, "area pemeriksaan")
    .replace(/estimasi Hb/gi, "perkiraan hemoglobin")
    .replace(/Hb/gi, "hemoglobin")
    .replace(/skrining visual/gi, "skrining dari gambar")
    .trim();
}
