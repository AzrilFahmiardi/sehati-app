"use client";

import React, { useEffect } from "react";
import { X, Printer } from "lucide-react";
import type { FusedResult, RealSiteResult } from "@/services/screening";
import type { ScreeningExplanation } from "@/types/explanation";
import type { ClinicalValidationRecord } from "@/types/validation";
import { QC_REASON_LABELS } from "@/lib/qc-labels";
import "./clinical-report.css";

interface ClinicalReportPrintViewProps {
  screeningId: string;
  fusedResult: FusedResult;
  siteResults: RealSiteResult[];
  explanation: ScreeningExplanation | null;
  clinicalNotes: string;
  validationRecord: ClinicalValidationRecord | null;
  recommendation?: { title: string; body: string };
  onClose: () => void;
}

const SITE_LABELS: Record<string, string> = {
  conjunctiva: "Konjungtiva mata",
  palm: "Telapak tangan",
  nail: "Kuku dan jari",
};

const STAGE_IMAGE_LABELS: Record<string, string> = {
  raw_frame: "Foto Asli",
  landmarks: "Landmark",
  roi_segmented: "ROI Tersegmentasi",
  illumination_normalized: "Normalisasi Iluminasi",
  biomarker_heatmap: "Heatmap Biomarker",
};

const CATEGORY_LABELS: Record<string, string> = {
  non_anemic: "Tidak anemia",
  mild: "Anemia ringan",
  moderate: "Anemia sedang",
  severe: "Anemia berat",
};

export function ClinicalReportPrintView({
  screeningId,
  fusedResult,
  siteResults,
  explanation,
  clinicalNotes,
  validationRecord,
  recommendation,
  onClose,
}: ClinicalReportPrintViewProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const generatedExplanation = explanation?.status === "generated" ? explanation.content : null;
  const printedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  const includedSites = fusedResult.contributingSites.included
    .map((site) => SITE_LABELS[site] ?? site)
    .join(", ");

  return (
    <div className="clinical-report-overlay" role="dialog" aria-modal="true" aria-label="Pratinjau laporan medis">
      <div className="clinical-report-toolbar">
        <button type="button" onClick={onClose} className="clinical-report-toolbar-button">
          <X className="h-4 w-4" />
          Tutup
        </button>
        <button type="button" onClick={() => window.print()} className="clinical-report-toolbar-button clinical-report-toolbar-primary">
          <Printer className="h-4 w-4" />
          Cetak atau Simpan PDF
        </button>
      </div>

      <article className="clinical-report-document">
        <ReportHeader screeningId={screeningId} printedAt={printedAt} />

        <section className="clinical-report-hero">
          <div>
            <p className="clinical-report-eyebrow">Hasil utama skrining</p>
            <h2>{CATEGORY_LABELS[fusedResult.whoCategory] ?? fusedResult.whoCategory}</h2>
            <p className="clinical-report-hero-subtitle">
              Keputusan sistem: {fusedResult.decision === "inconclusive" ? "Belum konklusif" : fusedResult.decision === "anemic" ? "Indikasi anemia" : "Tidak menunjukkan indikasi anemia"}
            </p>
          </div>
          <div className="clinical-report-hb">
            <span>Perkiraan hemoglobin</span>
            <strong>{fusedResult.hbGdl.toFixed(1)} g/dL</strong>
          </div>
        </section>

        <ReportSection title="Ringkasan pemeriksaan">
          <div className="clinical-report-grid clinical-report-grid-three">
            <ReportMetric label="ID skrining" value={screeningId} mono />
            <ReportMetric label="Area yang digunakan" value={includedSites || "Tidak tersedia"} />
            <ReportMetric label="Area yang dikecualikan" value={fusedResult.contributingSites.excluded.map((site) => SITE_LABELS[site] ?? site).join(", ") || "Tidak ada"} />
          </div>
          <p className="clinical-report-disclaimer">
            Hasil ini merupakan skrining awal berbasis AI dan bukan diagnosis. Konfirmasi melalui pemeriksaan laboratorium dan evaluasi tenaga kesehatan tetap diperlukan.
          </p>
        </ReportSection>

        <ReportSection title="Detail area pemeriksaan">
          <div className="clinical-report-site-table">
            <div className="clinical-report-site-row clinical-report-site-head">
              <span>Area</span>
              <span>Status</span>
              <span>Perkiraan Hb</span>
              <span>Catatan kualitas</span>
            </div>
            {siteResults.map((result) => (
              <div className="clinical-report-site-row" key={result.site}>
                <strong>{SITE_LABELS[result.site] ?? result.site}</strong>
                <span>{result.inference_status === "completed" ? result.passed_qc ? "Citra memadai" : "Citra tidak memadai" : result.inference_status === "failed" ? "Gagal diproses" : "Sedang diproses"}</span>
                <span>{result.hb_gdl == null ? "Tidak tersedia" : `${result.hb_gdl.toFixed(1)} g/dL`}</span>
                <span>{result.reasons.length > 0 ? result.reasons.map((reason) => QC_REASON_LABELS[reason] ?? reason).join(", ") : "Tidak ada catatan"}</span>
              </div>
            ))}
          </div>
        </ReportSection>

        {siteResults.map((result) => {
          const stageEntries = result.stage_images
            ? Object.entries(STAGE_IMAGE_LABELS)
                .filter(([key]) => result.stage_images?.[key])
                .map(([key, label]) => {
                  const raw = result.stage_images![key];
                  const src = raw.startsWith("http") ? raw : `data:image/png;base64,${raw}`;
                  return { key, label, src };
                })
            : [];
          if (stageEntries.length === 0) return null;
          return (
            <ReportSection key={result.site} title={`Citra proses: ${SITE_LABELS[result.site] ?? result.site}`}>
              <div className="clinical-report-stage-grid">
                {stageEntries.map((entry) => (
                  <div key={entry.key} className="clinical-report-stage-item">
                    <img src={entry.src} alt={entry.label} />
                    <span>{entry.label}</span>
                  </div>
                ))}
              </div>
            </ReportSection>
          );
        })}

        {recommendation && (
          <ReportSection title="Rekomendasi klinis">
            <div className="clinical-report-callout clinical-report-callout-primary">
              <strong>{recommendation.title}</strong>
              <p>{recommendation.body}</p>
            </div>
          </ReportSection>
        )}

        <ReportSection title="Insight AI">
          {generatedExplanation ? (
            <div className="clinical-report-ai-grid">
              <ReportTextBlock title={generatedExplanation.headline} text={generatedExplanation.summary} />
              <ReportListBlock title="Apa arti hasil ini?" items={[generatedExplanation.what_this_means]} />
              <ReportListBlock title="Bukti yang digunakan" items={generatedExplanation.evidence} />
              <ReportListBlock title="Langkah berikutnya" items={generatedExplanation.next_steps} />
              <ReportListBlock title="Tanda yang perlu diperhatikan" items={generatedExplanation.warning_signs} />
              <ReportListBlock title="Pertanyaan untuk tenaga kesehatan" items={generatedExplanation.questions_for_healthcare_worker} />
              <ReportListBlock title="Batasan" items={generatedExplanation.limitations} />
            </div>
          ) : (
            <div className="clinical-report-callout clinical-report-callout-warning">
              <strong>Insight AI tidak tersedia</strong>
              <p>Penjelasan dari AI belum berhasil dibuat. Hasil skrining deterministik dan rekomendasi klinis tetap dapat ditinjau secara terpisah.</p>
            </div>
          )}
        </ReportSection>

        {(clinicalNotes.trim() || validationRecord) && (
          <ReportSection title="Dokumentasi tenaga kesehatan">
            {clinicalNotes.trim() && <ReportTextBlock title="Catatan klinis" text={clinicalNotes.trim()} />}
            {validationRecord && (
              <div className="clinical-report-validation">
                <strong>{validationRecord.status === "confirmed" ? "Hasil dikonfirmasi tenaga kesehatan" : "Hasil memerlukan peninjauan"}</strong>
                <p>{validationRecord.reviewerRole}, {validationRecord.formattedTimestamp}</p>
                {validationRecord.reason && <p>Alasan: {validationRecord.reason}</p>}
                {validationRecord.notes && <p>Catatan validasi: {validationRecord.notes}</p>}
              </div>
            )}
          </ReportSection>
        )}

        <footer className="clinical-report-footer">
          <span>SEHATI, laporan skrining awal</span>
          <span>ID {screeningId} | Dicetak {printedAt}</span>
        </footer>
      </article>
    </div>
  );
}

function ReportHeader({ screeningId, printedAt }: { screeningId: string; printedAt: string }) {
  return (
    <header className="clinical-report-header">
      <div>
        <p className="clinical-report-brand">HEMAVISION</p>
        <p className="clinical-report-brand-subtitle">Sistem skrining anemia non-invasif</p>
      </div>
      <div className="clinical-report-header-meta">
        <strong>Laporan Hasil Skrining</strong>
        <span>ID {screeningId}</span>
        <span>{printedAt}</span>
      </div>
    </header>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="clinical-report-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ReportMetric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="clinical-report-metric">
      <span>{label}</span>
      <strong className={mono ? "clinical-report-mono" : undefined}>{value}</strong>
    </div>
  );
}

function ReportTextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="clinical-report-text-block">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function ReportListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="clinical-report-text-block">
      <strong>{title}</strong>
      <ul>
        {items.filter(Boolean).map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}
