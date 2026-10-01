import { MOCK_SCREENINGS } from "@/data/mock/screenings";
import { MOCK_SITE_CONTRIBUTIONS, SiteContribution } from "@/data/mock/site-contributions";
import { Screening, ScreeningSite } from "@/types/screening";
import { getIdToken } from "@/lib/firebase/client";
import { ClinicalValidationRecord } from "@/types/validation";
import { ExplanationAudience, ScreeningExplanation } from "@/types/explanation";

export async function getScreenings(): Promise<Screening[]> {
  return Promise.resolve(MOCK_SCREENINGS);
}

export async function getScreeningById(id: string): Promise<Screening | null> {
  const item = MOCK_SCREENINGS.find((s) => s.id === id);
  return Promise.resolve(item || null);
}

export async function getScreeningsByPatientId(patientId: string): Promise<Screening[]> {
  const items = MOCK_SCREENINGS.filter((s) => s.patientId === patientId);
  return Promise.resolve(items);
}

export async function createScreeningSession(patientId: string): Promise<Screening> {
  const newScreening: Screening = {
    id: `scr-${Date.now()}`,
    patientId,
    createdAt: new Date().toISOString(),
    status: "draft",
    sites: {
      conjunctiva: { site: "conjunctiva", status: "pending" },
      palm: { site: "palm", status: "pending" },
      nail: { site: "nail", status: "pending" },
    },
    captureSessionId: `session-${Math.random().toString(36).substring(2, 9)}`,
  };
  MOCK_SCREENINGS.unshift(newScreening);
  return Promise.resolve(newScreening);
}

interface UploadTarget {
  site: ScreeningSite;
  object_key: string;
  upload_url: string;
}

export interface RealScreening {
  screeningId: string;
  status: string;
  uploads: UploadTarget[];
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const idToken = await getIdToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...init.headers,
      Authorization: `Bearer ${idToken}`,
    },
  });
}

export async function startRealScreening(
  patientId: string,
  organizationId: string,
  sites: ScreeningSite[] = ["conjunctiva", "palm", "nail"],
  idempotencyKey?: string
): Promise<RealScreening> {
  const response = await apiFetch("/v1/screenings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: patientId,
      organization_id: organizationId,
      sites,
      idempotency_key: idempotencyKey ?? `web-${patientId}-${Date.now()}`,
    }),
  });
  if (!response.ok) {
    throw new Error("Gagal membuat sesi skrining");
  }
  const body = await response.json();
  return { screeningId: body.screening_id, status: body.status, uploads: body.uploads };
}

export async function uploadCapture(uploadUrl: string, blob: Blob): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error("Gagal mengunggah gambar");
  }
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export interface SubmitUpload {
  site: ScreeningSite;
  bytes: number;
  sha256: string;
}

export async function submitRealScreening(
  screeningId: string,
  organizationId: string,
  uploads: SubmitUpload[]
): Promise<void> {
  const response = await apiFetch(`/v1/screenings/${screeningId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: organizationId, uploads }),
  });
  if (!response.ok) {
    throw new Error("Gagal mengirim skrining untuk diproses");
  }
}

export interface QualityCheckResult {
  passedQc: boolean | null;
  reasons: string[];
}

export async function checkCaptureQuality(
  screeningId: string,
  organizationId: string,
  site: ScreeningSite,
  blob: Blob
): Promise<QualityCheckResult> {
  const formData = new FormData();
  formData.append("image", blob, `${site}.jpg`);
  const response = await apiFetch(
    `/v1/screenings/${screeningId}/sites/${site}/check-quality?organization_id=${organizationId}`,
    { method: "POST", body: formData }
  );
  if (!response.ok) {
    throw new Error("Gagal memeriksa kualitas gambar");
  }
  const body = await response.json();
  return { passedQc: body.passed_qc, reasons: body.reasons };
}

export interface RealSiteResult {
  site: ScreeningSite;
  inference_status: string;
  passed_qc: boolean | null;
  hb_gdl: number | null;
  anemic_probability: number | null;
  model_severity: string | null;
  reasons: string[];
  stage_images: Record<string, string> | null;
}

export interface FusedResult {
  hbGdl: number;
  decision: string;
  whoCategory: string;
  contributingSites: { included: string[]; excluded: string[] };
  caveats: Record<string, unknown>;
}

export async function getScreeningExplanation(
  screeningId: string,
  organizationId: string,
  audience: ExplanationAudience,
  locale = "id-ID",
): Promise<ScreeningExplanation | null> {
  const params = new URLSearchParams({ organization_id: organizationId, audience, locale });
  const response = await apiFetch(`/v1/screenings/${screeningId}/explanation?${params.toString()}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Gagal membaca penjelasan AI");
  const body = await response.json();
  return mapExplanation(body);
}

export async function generateScreeningExplanation(
  screeningId: string,
  organizationId: string,
  audience: ExplanationAudience,
  locale = "id-ID",
): Promise<ScreeningExplanation> {
  const response = await apiFetch(`/v1/screenings/${screeningId}/explanation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: organizationId, audience, locale }),
  });
  if (!response.ok) throw new Error("Gagal membuat penjelasan AI");
  return mapExplanation(await response.json());
}

function mapExplanation(body: {
  screening_id: string;
  audience: ExplanationAudience;
  locale: string;
  status: ScreeningExplanation["status"];
  model: string | null;
  prompt_version: string;
  content: ScreeningExplanation["content"];
  generated_at: string;
}): ScreeningExplanation {
  return {
    screeningId: body.screening_id,
    audience: body.audience,
    locale: body.locale,
    status: body.status,
    model: body.model,
    promptVersion: body.prompt_version,
    content: body.content,
    generatedAt: body.generated_at,
  };
}

export interface RealScreeningStatus {
  screeningId: string;
  status: string;
  siteResults: RealSiteResult[];
  fusedResult: FusedResult | null;
}

export interface ScreeningSiteSummary {
  site: ScreeningSite;
  hbGdl: number | null;
  inferenceStatus: string;
}

export interface ScreeningSummary {
  screeningId: string;
  patientId: string;
  patientDisplayName: string;
  status: string;
  createdAt: string;
  siteSummaries: ScreeningSiteSummary[];
  decision: string | null;
  whoCategory: string | null;
}

export async function listScreenings(
  organizationId: string,
  patientId?: string
): Promise<ScreeningSummary[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (patientId) params.set("patient_id", patientId);
  const response = await apiFetch(`/v1/screenings?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Gagal membaca riwayat skrining");
  }
  const body = await response.json();
  return body.map(
    (item: {
      screening_id: string;
      patient_id: string;
      patient_display_name: string;
      status: string;
      created_at: string;
      site_summaries: { site: ScreeningSite; hb_gdl: number | null; inference_status: string }[];
      decision: string | null;
      who_category: string | null;
    }) => ({
      screeningId: item.screening_id,
      patientId: item.patient_id,
      patientDisplayName: item.patient_display_name,
      status: item.status,
      createdAt: item.created_at,
      siteSummaries: item.site_summaries.map((site) => ({
        site: site.site,
        hbGdl: site.hb_gdl,
        inferenceStatus: site.inference_status,
      })),
      decision: item.decision,
      whoCategory: item.who_category,
    })
  );
}

export async function getRealScreeningStatus(
  screeningId: string,
  organizationId: string
): Promise<RealScreeningStatus> {
  const response = await apiFetch(
    `/v1/screenings/${screeningId}?organization_id=${organizationId}`
  );
  if (!response.ok) {
    throw new Error("Gagal membaca status skrining");
  }
  const body = await response.json();
  const fused = body.fused_result;
  return {
    screeningId: body.screening_id,
    status: body.status,
    siteResults: body.site_results,
    fusedResult: fused
      ? {
          hbGdl: fused.hb_gdl,
          decision: fused.decision,
          whoCategory: fused.who_category,
          contributingSites: fused.contributing_sites,
          caveats: fused.caveats,
        }
      : null,
  };
}

export async function submitValidation(
  screeningId: string,
  organizationId: string,
  payload: ClinicalValidationRecord
): Promise<void> {
  // Translate the payload to snake_case for the Python backend
  const requestBody = {
    organization_id: organizationId,
    status: payload.status,
    reviewer_name: payload.reviewerName,
    reviewer_role: payload.reviewerRole,
    reviewer_id: payload.reviewerId,
    validated_at: payload.validatedAt,
    formatted_timestamp: payload.formattedTimestamp,
    reason: payload.reason,
    notes: payload.notes,
    original_ai_result: {
      who_category: payload.originalAiResult.whoCategory,
      who_category_title: payload.originalAiResult.whoCategoryTitle,
      decision: payload.originalAiResult.decision,
      hb_gdl: payload.originalAiResult.hbGdl,
      confidence_label: payload.originalAiResult.confidenceLabel,
      recommendation_title: payload.originalAiResult.recommendationTitle,
      recommendation_body: payload.originalAiResult.recommendationBody,
      site_count: payload.originalAiResult.siteCount,
      passed_qc_count: payload.originalAiResult.passedQcCount,
    }
  };

  const response = await apiFetch(`/v1/screenings/${screeningId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("Gagal menyimpan data validasi klinis");
  }
}


export async function getValidation(
  screeningId: string,
  organizationId: string
): Promise<ClinicalValidationRecord | null> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const response = await apiFetch(
    `/v1/screenings/${screeningId}/validate?${params.toString()}`
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Gagal membaca data validasi klinis");

  const body = await response.json();
  if (!body || !body.status) return null;

  return {
    status: body.status,
    reviewerName: body.reviewer_name,
    reviewerRole: body.reviewer_role,
    reviewerId: body.reviewer_id ?? undefined,
    validatedAt: body.validated_at,
    formattedTimestamp: body.formatted_timestamp,
    reason: body.reason ?? undefined,
    notes: body.notes ?? undefined,
    originalAiResult: {
      whoCategory: body.original_ai_result.who_category,
      whoCategoryTitle: body.original_ai_result.who_category_title,
      decision: body.original_ai_result.decision,
      hbGdl: body.original_ai_result.hb_gdl,
      confidenceLabel: body.original_ai_result.confidence_label,
      recommendationTitle: body.original_ai_result.recommendation_title,
      recommendationBody: body.original_ai_result.recommendation_body,
      siteCount: body.original_ai_result.site_count,
      passedQcCount: body.original_ai_result.passed_qc_count,
    },
  };
}


export function computeSiteContributions(
  siteResults: RealSiteResult[],
  fusedResult: FusedResult | null
): SiteContribution[] {
  // TODO: Replace with real weights from backend when available
  // For now, return mock data or calculate a fallback
  if (siteResults.length === 0) return [];
  
  // Try to use the mock data if sites match, otherwise fallback to equal weights
  return siteResults.map((siteResult) => {
    const mockMatch = MOCK_SITE_CONTRIBUTIONS.find((m) => m.site === siteResult.site);
    
    if (mockMatch && siteResult.passed_qc) {
      return {
        site: siteResult.site,
        weight: mockMatch.weight,
        hbEstimate: siteResult.hb_gdl ?? mockMatch.hbEstimate,
        confidence: siteResult.anemic_probability ? 1 - Math.abs(siteResult.anemic_probability - 0.5) * 2 : mockMatch.confidence,
      };
    }
    
    return {
      site: siteResult.site,
      weight: 1 / siteResults.filter(s => s.passed_qc).length || 0,
      hbEstimate: siteResult.hb_gdl ?? 0,
      confidence: siteResult.anemic_probability ? 1 - Math.abs(siteResult.anemic_probability - 0.5) * 2 : 0,
    };
  }).filter((c) => c.weight > 0).sort((a, b) => b.weight - a.weight);
}
