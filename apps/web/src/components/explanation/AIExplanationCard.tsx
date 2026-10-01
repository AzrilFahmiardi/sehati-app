"use client";

import { Sparkles, RefreshCw } from "lucide-react";
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
  title = "Insight AI",
  compact = false,
}: AIExplanationCardProps) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary-container/20 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-on-surface">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
            AI
          </span>
        </div>
        {explanation && (
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">
            {explanation.status === "generated" ? "Dihasilkan AI" : "AI gagal"}
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-on-surface-variant">Menyiapkan penjelasan hasil skrining...</p>}
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-error">{error}</p>
          <button type="button" onClick={onGenerate} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <RefreshCw className="w-4 h-4" /> Coba lagi
          </button>
        </div>
      )}
      {!isLoading && !error && explanation && explanation.status !== "generated" && (
        <div className="space-y-2">
          <p className="text-sm text-error">AI gagal memuat insight. Coba lagi untuk mengulangi proses.</p>
          <button type="button" onClick={onGenerate} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <RefreshCw className="w-4 h-4" /> Coba lagi
          </button>
        </div>
      )}
      {!isLoading && !error && !explanation && (
        <div className="space-y-2">
          <p className="text-sm text-on-surface-variant">Buat ringkasan naratif berdasarkan hasil skrining dan kontribusi setiap situs.</p>
          <button type="button" onClick={onGenerate} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Buat Insight AI</button>
        </div>
      )}
      {explanation?.status === "generated" && (
        <div className={`space-y-4 text-sm text-on-surface-variant ${compact ? "" : "leading-relaxed"}`}>
          <p className="font-semibold text-on-surface">{explanation.content.headline}</p>
          <p>{explanation.content.summary}</p>
          <div>
            <p className="font-semibold text-on-surface mb-1">Apa artinya?</p>
            <p>{explanation.content.what_this_means}</p>
          </div>
          <ExplanationList title="Bukti yang digunakan" items={explanation.content.evidence} />
          <ExplanationList title="Langkah berikutnya" items={explanation.content.next_steps} />
          {!compact && <ExplanationList title="Batasan hasil" items={explanation.content.limitations} />}
          {explanation.content.clinical_note && <p className="text-xs italic">{explanation.content.clinical_note}</p>}
          <p className="text-[11px]">Dihasilkan {new Date(explanation.generatedAt).toLocaleString("id-ID")}.</p>
        </div>
      )}
    </section>
  );
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-semibold text-on-surface mb-1">{title}</p>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
