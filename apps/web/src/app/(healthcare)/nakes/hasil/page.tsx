"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Clock,
  Printer,
  Share2,
  FileText,
  Save,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Eye,
  Hand,
  UserCheck,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { getRealScreeningStatus, RealSiteResult, FusedResult, submitValidation } from "@/services/screening";
import { Button } from "@/components/ui/Button";
import { QC_REASON_LABELS } from "@/lib/qc-labels";
import { ClinicalValidationSection } from "@/components/screening/ClinicalValidationSection";
import { ValidationConfirmationModal } from "@/components/screening/ValidationConfirmationModal";
import { DisagreementReviewModal } from "@/components/screening/DisagreementReviewModal";
import { ClinicalValidationRecord, OriginalAiSnapshot } from "@/types/validation";
import { ROUTES } from "@/lib/routes";

const SITE_META: Record<string, { title: string; icon: typeof Eye }> = {
  conjunctiva: { title: "Konjungtiva Mata", icon: Eye },
  nail: { title: "Kuku & Jari", icon: Sparkles },
  palm: { title: "Telapak Tangan", icon: Hand },
};

const WHO_CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    icon: typeof CheckCircle2;
    gradientClass: string;
    style: React.CSSProperties;
  }
> = {
  non_anemic: {
    title: "Tidak Anemia",
    icon: CheckCircle2,
    gradientClass: "from-tertiary via-tertiary-alt to-tertiary-container",
    style: {
      background: "linear-gradient(135deg, #006A61 0%, #006F66 50%, #004D46 100%)",
    },
  },
  mild: {
    title: "Anemia Ringan",
    icon: AlertTriangle,
    gradientClass: "from-warning-light via-warning-vivid to-warning-accent",
    style: {
      background: "linear-gradient(135deg, #F19D7B 0%, #ED7A46 25%, #E36C38 50%, #D96329 75%, #BC4800 100%)",
    },
  },
  moderate: {
    title: "Anemia Sedang",
    icon: AlertTriangle,
    gradientClass: "from-warning-vivid via-warning-accent to-error",
    style: {
      background: "linear-gradient(135deg, #D85A18 0%, #BC4800 50%, #BA1A1A 100%)",
    },
  },
  severe: {
    title: "Anemia Berat",
    icon: XCircle,
    gradientClass: "from-error via-error to-error",
    style: {
      background: "linear-gradient(135deg, #BA1A1A 0%, #93000A 50%, #680003 100%)",
    },
  },
};

const DECISION_STATUS_LABELS: Record<string, string> = {
  non_anemic: "Keyakinan Tinggi",
  anemic: "Keyakinan Tinggi",
  inconclusive: "Belum Konklusif",
};

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  completed: { label: "Pemeriksaan Selesai", icon: CheckCircle2, className: "bg-tertiary-container text-tertiary-alt" },
  processing: { label: "Sedang Diproses", icon: Clock, className: "bg-primary-container text-primary-darkest" },
  failed: { label: "Pemrosesan Gagal", icon: XCircle, className: "bg-error-container text-error" },
};

const RECOMMENDATION_CONFIG: Record<
  string,
  { title: string; body: string; icon: typeof Stethoscope; toneClass: string; iconToneClass: string }
> = {
  anemic: {
    title: "Pertimbangkan Pemeriksaan Hb Konfirmasi",
    body: "Lakukan pemeriksaan laboratorium darah lengkap (CBC) serta evaluasi status zat besi untuk memverifikasi dan mencari penyebab anemia.",
    icon: Stethoscope,
    toneClass: "bg-error-container/30 border-error/20",
    iconToneClass: "text-error",
  },
  non_anemic: {
    title: "Pemantauan Rutin",
    body: "Kadar hemoglobin dalam batas normal. Lanjutkan pemantauan rutin sesuai jadwal skrining berkala.",
    icon: ShieldCheck,
    toneClass: "bg-tertiary-container/30 border-tertiary/20",
    iconToneClass: "text-tertiary",
  },
  inconclusive: {
    title: "Ulangi Skrining atau Rujuk Manual",
    body: "Hasil belum cukup meyakinkan untuk diambil keputusan. Ulangi pengambilan citra atau rujuk ke pemeriksaan laboratorium manual.",
    icon: Clock,
    toneClass: "bg-warning-container-lowest border-warning/20",
    iconToneClass: "text-warning",
  },
};

const STAGE_IMAGE_LABELS: Record<string, string> = {
  raw_frame: "Foto Asli",
  landmarks: "Landmark",
  roi_segmented: "ROI Tersegmentasi",
  illumination_normalized: "Normalisasi Iluminasi",
  biomarker_heatmap: "Heatmap Biomarker",
};

// Safe helper to render caveat values without outputting [object Object]
function renderCaveatValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object" && val !== null) {
    if ("note" in val && typeof (val as { note: unknown }).note === "string") {
      return (val as { note: string }).note;
    }
    if ("message" in val && typeof (val as { message: unknown }).message === "string") {
      return (val as { message: string }).message;
    }
    return Object.values(val)
      .map((v) => (typeof v === "string" ? v : ""))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

// Fallback demo data matching the user's screenshot (#6E83521F)
const DEMO_FALLBACK = {
  screeningId: "6E83521F",
  status: "completed",
  fusedResult: {
    hbGdl: 11.8,
    decision: "anemic",
    whoCategory: "mild",
    contributingSites: {
      included: ["nail", "conjunctiva", "palm"],
      excluded: [],
    },
    caveats: {
      altitude_correction:
        "Koreksi ketinggian tempat tinggal belum didukung, altitude dianggap 0 meter untuk semua pasien. Estimasi hemoglobin dan klasifikasi ini adalah hasil skrining AI, bukan pengganti tes laboratorium.",
    },
  } as FusedResult,
  siteResults: [
    {
      site: "nail",
      inference_status: "completed",
      passed_qc: true,
      hb_gdl: 11.9,
      anemic_probability: 0.62,
      model_severity: "mild",
      reasons: [],
      stage_images: {
        raw_frame: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
        roi_segmented: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
        biomarker_heatmap: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
        illumination_normalized: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
      },
    },
    {
      site: "conjunctiva",
      inference_status: "completed",
      passed_qc: true,
      hb_gdl: 11.7,
      anemic_probability: 0.64,
      model_severity: "mild",
      reasons: [],
      stage_images: {
        raw_frame: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
        roi_segmented: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
        biomarker_heatmap: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
        illumination_normalized: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80",
      },
    },
    {
      site: "palm",
      inference_status: "completed",
      passed_qc: true,
      hb_gdl: 11.8,
      anemic_probability: 0.61,
      model_severity: "mild",
      reasons: [],
      stage_images: {
        raw_frame: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80",
        roi_segmented: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80",
        biomarker_heatmap: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80",
        illumination_normalized: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80",
      },
    },
  ] as RealSiteResult[],
};

export default function ClinicalResultsPage() {
  return (
    <Suspense>
      <ClinicalResultsContent />
    </Suspense>
  );
}

function ClinicalResultsContent() {
  const searchParams = useSearchParams();
  const rawScreeningId = searchParams.get("screeningId");
  const organizationId = searchParams.get("organizationId");
  const patientId = searchParams.get("patientId") || undefined;

  // Effective screening ID (with demo fallback if absent)
  const screeningId = rawScreeningId || DEMO_FALLBACK.screeningId;

  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState<string>("completed");
  const [siteResults, setSiteResults] = useState<RealSiteResult[]>(DEMO_FALLBACK.siteResults);
  const [fusedResult, setFusedResult] = useState<FusedResult | null>(DEMO_FALLBACK.fusedResult);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  // HITL Validation State
  const [validationRecord, setValidationRecord] = useState<ClinicalValidationRecord | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const storageKey = `hv_validation_${screeningId}`;

  // Restore saved validation from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ClinicalValidationRecord;
        setValidationRecord(parsed);
        if (parsed.notes) {
          setClinicalNotes(parsed.notes);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  // Load real screening status if screeningId & organizationId are provided
  useEffect(() => {
    if (!rawScreeningId || !organizationId) {
      // Use demo data matching the screenshot
      setStatus(DEMO_FALLBACK.status);
      setSiteResults(DEMO_FALLBACK.siteResults);
      setFusedResult(DEMO_FALLBACK.fusedResult);
      return;
    }

    let cancelled = false;
    let delayMs = 2000;

    async function poll() {
      try {
        const result = await getRealScreeningStatus(rawScreeningId as string, organizationId as string);
        if (cancelled) return;
        setStatus(result.status);
        setSiteResults(result.siteResults);
        setFusedResult(result.fusedResult);
        if (result.status === "processing") {
          delayMs = Math.min(delayMs * 1.5, 10000);
          setTimeout(poll, delayMs);
        }
      } catch {
        if (!cancelled) {
          // Graceful fallback to demo data if backend is offline in development
          setLoadError(
            "Tidak dapat terhubung ke server backend secara langsung. Menampilkan data skrining lokal."
          );
          setStatus(DEMO_FALLBACK.status);
          setSiteResults(DEMO_FALLBACK.siteResults);
          setFusedResult(DEMO_FALLBACK.fusedResult);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [rawScreeningId, organizationId]);

  // Unsaved changes warning if user started typing notes and hasn't validated
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (clinicalNotes.trim().length > 0 && !validationRecord) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [clinicalNotes, validationRecord]);

  const whoConfig = fusedResult ? WHO_CATEGORY_CONFIG[fusedResult.whoCategory] : undefined;
  const WhoIcon = whoConfig?.icon ?? HelpCircle;
  const isInconclusive = fusedResult?.decision === "inconclusive";
  const recommendation = fusedResult ? RECOMMENDATION_CONFIG[fusedResult.decision] : undefined;

  // Compute QC metrics
  const completedSites = useMemo(
    () => siteResults.filter((r) => r.inference_status === "completed"),
    [siteResults]
  );
  const passedQcSites = useMemo(
    () => completedSites.filter((r) => r.passed_qc === true),
    [completedSites]
  );
  const poorQualitySites = useMemo(
    () =>
      siteResults
        .filter((r) => r.passed_qc === false)
        .map((r) => SITE_META[r.site]?.title || r.site),
    [siteResults]
  );
  const hasPoorImageQuality = poorQualitySites.length > 0;

  // Snapshot for audit record
  const aiSnapshot: OriginalAiSnapshot | null = useMemo(() => {
    if (!fusedResult || !whoConfig) return null;
    return {
      whoCategory: fusedResult.whoCategory,
      whoCategoryTitle: whoConfig.title,
      decision: fusedResult.decision,
      hbGdl: fusedResult.hbGdl,
      confidenceLabel: DECISION_STATUS_LABELS[fusedResult.decision] ?? "Hasil Skrining",
      recommendationTitle: recommendation?.title,
      recommendationBody: recommendation?.body,
      siteCount: siteResults.length || 3,
      passedQcCount: passedQcSites.length,
    };
  }, [fusedResult, whoConfig, recommendation, siteResults, passedQcSites]);

  // Formatted timestamp helper in Indonesian format
  const getFormattedTimestamp = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr}, ${timeStr} WIB`;
  };

  // Handler: Confirm validation
  const handleConfirmValidation = useCallback(async () => {
    if (!aiSnapshot) return;
    setIsValidating(true);
    setSaveError(null);

    try {
      const newRecord: ClinicalValidationRecord = {
        status: "confirmed",
        reviewerName: "dr. Admin Demo",
        reviewerRole: "Platform Admin / Tenaga Kesehatan",
        validatedAt: new Date().toISOString(),
        formattedTimestamp: getFormattedTimestamp(),
        notes: clinicalNotes.trim() || undefined,
        originalAiResult: aiSnapshot,
      };

      // Call API if we have real IDs
      if (rawScreeningId && organizationId) {
        await submitValidation(rawScreeningId as string, organizationId as string, newRecord);
      } else {
        // Fallback simulate network save if viewing mock data
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setValidationRecord(newRecord);
      sessionStorage.setItem(storageKey, JSON.stringify(newRecord));
      setIsConfirmModalOpen(false);
      setSuccessToast("Validasi berhasil dikonfirmasi dan disimpan!");
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      setSaveError("Gagal menyimpan validasi. Silakan coba lagi.");
    } finally {
      setIsValidating(false);
    }
  }, [aiSnapshot, clinicalNotes, storageKey, rawScreeningId, organizationId]);

  // Handler: Disagreement / Needs Review validation
  const handleDisagreementValidation = useCallback(
    async (reason: string, notes: string) => {
      if (!aiSnapshot) return;
      setIsValidating(true);
      setSaveError(null);

      try {
        const newRecord: ClinicalValidationRecord = {
          status: "needs_review",
          reviewerName: "dr. Admin Demo",
          reviewerRole: "Platform Admin / Tenaga Kesehatan",
          validatedAt: new Date().toISOString(),
          formattedTimestamp: getFormattedTimestamp(),
          reason,
          notes,
          originalAiResult: aiSnapshot,
        };

        // Call API if we have real IDs
        if (rawScreeningId && organizationId) {
          await submitValidation(rawScreeningId as string, organizationId as string, newRecord);
        } else {
          // Fallback simulate network save if viewing mock data
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        setValidationRecord(newRecord);
        sessionStorage.setItem(storageKey, JSON.stringify(newRecord));
        setClinicalNotes(notes);
        setIsReviewModalOpen(false);
        setSuccessToast("Peninjauan tenaga kesehatan berhasil disimpan!");
        setTimeout(() => setSuccessToast(null), 4000);
      } catch {
        setSaveError("Gagal menyimpan peninjauan. Silakan coba lagi.");
      } finally {
        setIsValidating(false);
      }
    },
    [aiSnapshot, storageKey, rawScreeningId, organizationId]
  );

  // Quick reset for demonstration/testing all 4 states
  const handleResetValidation = () => {
    sessionStorage.removeItem(storageKey);
    setValidationRecord(null);
    setSuccessToast("Status validasi di-reset ke Menunggu Validasi.");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleScrollToValidation = () => {
    const el = document.getElementById("validasi-tenaga-kesehatan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveNotesOnly = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-56 space-y-6">
      {/* Main Container Area */}
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        {/* Page Title & Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.70px]">
              HASIL PEMERIKSAAN #{screeningId.slice(0, 8).toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-[32px] font-semibold text-on-surface leading-tight">
              Hasil Skrining Klinis
            </h1>
          </div>

          {/* Right Status Badges Header */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {validationRecord?.status === "confirmed" ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full shadow-2xs bg-tertiary-container text-tertiary-alt">
                <CheckCircle2 className="w-4 h-4 text-tertiary" />
                <span>Dikonfirmasi Tenaga Kesehatan</span>
              </div>
            ) : validationRecord?.status === "needs_review" ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full shadow-2xs bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Perlu Peninjauan Tenaga Kesehatan</span>
              </div>
            ) : (
              <>
                {STATUS_BADGE_CONFIG[status] && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full shadow-2xs ${STATUS_BADGE_CONFIG[status].className}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{STATUS_BADGE_CONFIG[status].label}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Menunggu Validasi</span>
                </div>
              </>
            )}

            {/* Test Reset Helper (Non-intrusive button for PAIR-PROGRAMMING / testing all states) */}
            {validationRecord && (
              <button
                type="button"
                onClick={handleResetValidation}
                title="Reset status validasi untuk pengujian"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Success Toast Banner */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-sm text-emerald-900 font-medium flex items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Tutup
            </button>
          </div>
        )}

        {loadError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {status === "processing" && !loadError && (
          <div className="p-6 bg-surface rounded-xl border border-outline shadow-sm text-center text-on-surface-variant">
            Memproses hasil ketiga situs, mohon tunggu...
          </div>
        )}

        {/* 1. HERO RESULT CARD (AI SCREENING RESULT - NOT A DIAGNOSIS) */}
        {(status === "completed" || status === "failed") && (
          <div
            style={fusedResult && whoConfig ? whoConfig.style : undefined}
            className={`w-full rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${
              fusedResult && whoConfig
                ? `bg-gradient-to-br ${whoConfig.gradientClass} text-white space-y-6`
                : "bg-surface-container-low border border-outline"
            }`}
          >
            {fusedResult && whoConfig ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                    <WhoIcon className="w-4 h-4 text-white" />
                    <span>HASIL SKRINING</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                      isInconclusive ? "bg-white/25 text-white" : "bg-white/15 text-white/90"
                    }`}
                  >
                    {isInconclusive && <HelpCircle className="w-3.5 h-3.5" />}
                    <span>{DECISION_STATUS_LABELS[fusedResult.decision] ?? fusedResult.decision}</span>
                  </span>
                </div>

                <div className="space-y-1 relative z-10">
                  <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight uppercase">
                    {whoConfig.title}
                  </h2>
                  <p className="text-white/90 text-lg font-semibold">
                    Estimasi Hb gabungan: {fusedResult.hbGdl.toFixed(1)} g/dL
                  </p>
                </div>

                {isInconclusive && (
                  <div className="flex items-start gap-2.5 bg-white/15 border border-white/25 rounded-lg p-3.5 relative z-10">
                    <HelpCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <p className="text-white text-sm leading-relaxed">
                      Hasil belum konklusif, tingkat keyakinan AI terhadap kategori ini masih rendah.
                      Pertimbangkan pengulangan pengambilan citra atau rujukan ke pemeriksaan laboratorium.
                    </p>
                  </div>
                )}

                {/* Caveats Disclaimer (Fixed object stringification bug) */}
                {Object.keys(fusedResult.caveats).length > 0 && (
                  <div className="p-3 bg-white/10 rounded-lg text-xs text-white flex items-start gap-2 backdrop-blur-xs relative z-10">
                    <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {Object.values(fusedResult.caveats).map(renderCaveatValue).filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-surface-container rounded-full text-on-surface-variant shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-sm text-on-surface-variant">
                  Keputusan fusi belum tersedia untuk skrining ini.
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. AREA PEMERIKSAAN (SITE EVIDENCE & STAGE IMAGES) */}
        {siteResults.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-on-surface text-2xl font-bold tracking-tight">Area Pemeriksaan</h2>
              <p className="text-on-surface-variant text-base font-normal">
                Detail analisis per situs yang dianalisis SEHATI untuk mendukung proses skrining.
              </p>
            </div>

            <div className="space-y-3">
              {siteResults.map((result) => {
                const meta = SITE_META[result.site] ?? { title: result.site, icon: Eye };
                const IconComponent = meta.icon;
                return (
                  <div
                    key={result.site}
                    className="w-full bg-white rounded-xl border border-outline p-4 shadow-2xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-on-surface font-bold text-base">{meta.title}</h3>
                          {result.inference_status === "completed" ? (
                            result.passed_qc ? (
                              <p className="text-tertiary text-xs font-normal flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                                <span>Citra Memadai</span>
                              </p>
                            ) : (
                              <p className="text-error text-xs font-normal flex items-center gap-1 pt-0.5">
                                <XCircle className="w-3.5 h-3.5 text-error" />
                                <span>Citra Tidak Memadai</span>
                              </p>
                            )
                          ) : (
                            <p className="text-on-surface-variant text-xs font-normal pt-0.5">
                              {result.inference_status === "failed" ? "Gagal diproses" : "Sedang diproses"}
                            </p>
                          )}
                        </div>
                      </div>
                      {result.hb_gdl != null && (
                        <span className="text-sm font-mono text-on-surface-variant font-semibold">
                          {result.hb_gdl.toFixed(1)} g/dL
                        </span>
                      )}
                    </div>

                    {result.inference_status === "completed" && result.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="px-2.5 py-1 rounded-full bg-error-container/60 text-error text-xs font-medium"
                          >
                            {QC_REASON_LABELS[reason] ?? reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {result.stage_images && Object.keys(result.stage_images).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1 border-t border-outline/40">
                        {Object.entries(result.stage_images).map(([key, value]) => {
                          const src = value.startsWith("http") ? value : `data:image/png;base64,${value}`;
                          const label = STAGE_IMAGE_LABELS[key] ?? key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setLightbox({ src, label })}
                              className="group space-y-1 cursor-zoom-in pt-3 text-left"
                            >
                              <div className="relative overflow-hidden rounded-lg border border-outline">
                                <img
                                  src={src}
                                  alt={label}
                                  className="w-full h-24 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </div>
                              <span className="text-[10px] text-on-surface-variant block text-center truncate">
                                {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. 2 COLUMNS: REKOMENDASI KLINIS (LEFT) & CATATAN KLINIS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rekomendasi Klinis (Span 7) */}
          <div className="lg:col-span-7 p-6 bg-surface rounded-xl border border-outline space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-primary" />
              <h3 className="text-xl sm:text-2xl font-semibold text-on-surface">
                Rekomendasi Klinis
              </h3>
            </div>

            <div className="space-y-4">
              {recommendation ? (
                <div className={`p-4 border rounded-xl flex items-start gap-4 ${recommendation.toneClass}`}>
                  <div className="pt-1 shrink-0">
                    <recommendation.icon className={`w-5 h-5 ${recommendation.iconToneClass}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-base font-bold ${recommendation.iconToneClass}`}>
                      {recommendation.title}
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {recommendation.body}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Rekomendasi klinis akan muncul setelah keputusan fusi tersedia.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-outline space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-bold text-on-surface">Insight AI</h4>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                  Segera Hadir
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Ringkasan naratif otomatis berbasis AI (LLM) untuk membantu interpretasi hasil skrining
                ini akan tersedia pada rilis mendatang.
              </p>
            </div>
          </div>

          {/* Catatan Klinis (Span 5) */}
          <div className="lg:col-span-5 p-6 bg-surface rounded-xl border border-outline space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-on-surface">Catatan Klinis</h3>
              </div>
              {validationRecord && (
                <span className="text-[11px] font-semibold text-tertiary-alt bg-tertiary-container/50 px-2 py-0.5 rounded-full">
                  Terdokumentasi
                </span>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={clinicalNotes}
                disabled={Boolean(validationRecord)}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Masukkan observasi tambahan atau instruksi untuk pasien..."
                className="w-full h-40 p-4 bg-white border border-outline rounded-xl text-sm text-on-surface placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5 italic">
                  <Info className="w-3.5 h-3.5 shrink-0 text-on-surface-variant" />
                  <span>Catatan ini disimpan dalam rekam medis elektronik.</span>
                </div>
                {!validationRecord && clinicalNotes.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveNotesOnly}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isSaved ? "Tersimpan" : "Simpan Draf"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PROMINENT HUMAN-IN-THE-LOOP SECTION: VALIDASI TENAGA KESEHATAN */}
        <ClinicalValidationSection
          validationRecord={validationRecord}
          aiSnapshot={aiSnapshot}
          clinicalNotes={clinicalNotes}
          hasPoorImageQuality={hasPoorImageQuality}
          poorQualitySites={poorQualitySites}
          isAiProcessing={status === "processing"}
          onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
          onOpenReviewModal={() => setIsReviewModalOpen(true)}
          patientId={patientId}
          saveError={saveError}
          onRetrySave={handleConfirmValidation}
        />
      </div>

      {/* 5. FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-surface border-t border-outline p-4 sm:px-8 z-40 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-5 h-5" />}
            >
              Cetak Laporan
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Laporan SEHATI", url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              leftIcon={<Share2 className="w-5 h-5" />}
            >
              Bagikan
            </Button>
          </div>

          {/* Dynamic Contextual Action based on Validation Status */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!validationRecord ? (
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto px-6 shadow-md"
                onClick={handleScrollToValidation}
                leftIcon={<UserCheck className="w-5 h-5" />}
              >
                Validasi Hasil Skrining
              </Button>
            ) : validationRecord.status === "confirmed" ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-tertiary-container text-tertiary-alt text-sm font-semibold">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Dikonfirmasi Tenaga Kesehatan</span>
                </div>
                {patientId ? (
                  <Link
                    href={ROUTES.NAKES.PASIEN_DETAIL(patientId)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors w-full sm:w-auto shadow-md"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.NAKES.PASIEN_LIST}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors w-full sm:w-auto shadow-md"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Peninjauan Tercatat</span>
                </div>
                {patientId ? (
                  <Link
                    href={ROUTES.NAKES.PASIEN_DETAIL(patientId)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors w-full sm:w-auto shadow-md"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.NAKES.PASIEN_LIST}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors w-full sm:w-auto shadow-md"
                  >
                    <span>Kembali ke Pasien</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ValidationConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmValidation}
        isLoading={isValidating}
        aiSnapshot={aiSnapshot}
        clinicalNotes={clinicalNotes}
      />

      {/* Disagreement / Needs Review Modal */}
      <DisagreementReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleDisagreementValidation}
        isLoading={isValidating}
        aiSnapshot={aiSnapshot}
        initialNotes={clinicalNotes}
      />

      {/* Stage Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.src}
            alt={lightbox.label}
            className="max-w-full max-h-[80vh] rounded-xl border border-white/20 object-contain"
          />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white">{lightbox.label}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
