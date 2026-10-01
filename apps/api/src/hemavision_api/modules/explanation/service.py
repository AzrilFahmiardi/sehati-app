"""Pembuatan explanation terstruktur dengan fallback yang aman."""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.modules.explanation.models import ScreeningExplanation
from hemavision_api.modules.fusion.models import FusedResult
from hemavision_api.modules.screening.models import Screening, SiteResult

PROMPT_VERSION = "explanation-v1"


class ExplanationProviderError(Exception):
    """Provider gagal atau mengembalikan output yang tidak valid."""


class ExplanationProvider(Protocol):
    model: str

    def generate(
        self, *, source: dict[str, object], audience: str, locale: str
    ) -> dict[str, object]:
        """Menghasilkan content explanation tervalidasi."""


@dataclass(frozen=True)
class ExplanationSource:
    hb_gdl: float
    decision: str
    who_category: str
    included_sites: list[str]
    excluded_sites: list[str]
    caveats: dict[str, object]
    site_results: list[dict[str, object]]


def build_source(fused: FusedResult, site_results: list[SiteResult]) -> ExplanationSource:
    sites = fused.contributing_sites if isinstance(fused.contributing_sites, dict) else {}
    included = sites.get("included", [])
    excluded = sites.get("excluded", [])
    return ExplanationSource(
        hb_gdl=float(fused.hb_gdl),
        decision=fused.decision,
        who_category=fused.who_category,
        included_sites=[str(site) for site in included] if isinstance(included, list) else [],
        excluded_sites=[str(site) for site in excluded] if isinstance(excluded, list) else [],
        caveats=fused.caveats if isinstance(fused.caveats, dict) else {},
        site_results=[
            {
                "site": result.site,
                "passed_qc": result.passed_qc,
                "hb_gdl": float(result.hb_gdl) if result.hb_gdl is not None else None,
                "anemic_probability": (
                    float(result.anemic_probability)
                    if result.anemic_probability is not None
                    else None
                ),
                "model_severity": result.model_severity,
                "reasons": list(result.reasons),
            }
            for result in site_results
        ],
    )


def deterministic_content(source: ExplanationSource, audience: str) -> dict[str, object]:
    category = {
        "non_anemic": "tidak menunjukkan indikasi anemia",
        "mild": "menunjukkan indikasi anemia ringan",
        "moderate": "menunjukkan indikasi anemia sedang",
        "severe": "menunjukkan indikasi anemia berat",
    }.get(source.who_category, source.who_category)
    if source.decision == "inconclusive":
        summary = "Hasil skrining belum cukup meyakinkan untuk menentukan kategori secara pasti."
        next_steps = [
            "Ulangi skrining dengan citra yang memenuhi panduan kualitas atau lakukan "
            "pemeriksaan laboratorium."
        ]
    elif source.decision == "anemic":
        summary = (
            f"Hasil skrining menunjukkan {category} dengan estimasi Hb {source.hb_gdl:.1f} g/dL."
        )
        next_steps = [
            "Konsultasikan hasil ini kepada tenaga kesehatan dan pertimbangkan "
            "pemeriksaan Hb konfirmasi."
        ]
    else:
        summary = (
            "Hasil skrining tidak menunjukkan indikasi anemia dengan estimasi "
            f"Hb {source.hb_gdl:.1f} g/dL."
        )
        next_steps = [
            "Lanjutkan pemantauan rutin sesuai jadwal dan konsultasikan bila muncul keluhan."
        ]
    evidence = [
        f"Estimasi Hb dari fusi multi-situs: {source.hb_gdl:.1f} g/dL.",
        f"Situs yang digunakan: {', '.join(source.included_sites) or 'tidak tersedia'}.",
    ]
    if source.excluded_sites:
        evidence.append(f"Situs yang tidak digunakan: {', '.join(source.excluded_sites)}.")
    limitations = [
        "Hasil ini adalah skrining berbasis AI dan bukan diagnosis atau pengganti "
        "pemeriksaan laboratorium.",
        *[str(value) for value in source.caveats.values()],
    ]
    content: dict[str, object] = {
        "headline": "Penjelasan hasil skrining",
        "summary": summary,
        "what_this_means": summary,
        "evidence": evidence,
        "next_steps": next_steps,
        "warning_signs": [
            "Segera cari pertolongan medis bila mengalami sesak napas berat, pingsan, "
            "atau kondisi memburuk."
        ],
        "questions_for_healthcare_worker": [
            "Apakah saya perlu pemeriksaan Hb atau CBC untuk konfirmasi?",
            "Apa langkah berikutnya berdasarkan gejala dan riwayat kesehatan saya?",
        ],
        "limitations": list(dict.fromkeys(limitations)),
    }
    if audience == "nakes":
        content["clinical_note"] = (
            "Gunakan narasi ini sebagai bantuan interpretasi, bukan pengganti validasi klinis."
        )
    return content


def _validate_content(content: dict[str, object]) -> dict[str, object]:
    normalized = dict(content)
    if "limitations" not in normalized and "limitation" in normalized:
        normalized["limitations"] = normalized.pop("limitation")
    for key in (
        "evidence",
        "next_steps",
        "warning_signs",
        "questions_for_healthcare_worker",
        "limitations",
    ):
        value = normalized.get(key)
        if isinstance(value, str):
            normalized[key] = [value]
    required = ("headline", "summary", "what_this_means", "evidence", "next_steps", "limitations")
    if any(not isinstance(normalized.get(key), (str, list)) for key in required):
        raise ExplanationProviderError("invalid_structured_output")
    for key in ("headline", "summary", "what_this_means"):
        value = normalized[key]
        if not isinstance(value, str) or not value.strip():
            raise ExplanationProviderError("invalid_structured_output")
    return normalized


def get_cached(
    session: Session, *, screening_id: object, audience: str, locale: str
) -> ScreeningExplanation | None:
    return (
        session.execute(
            select(ScreeningExplanation)
            .where(ScreeningExplanation.screening_id == screening_id)
            .where(ScreeningExplanation.audience == audience)
            .where(ScreeningExplanation.locale == locale)
            .where(ScreeningExplanation.prompt_version == PROMPT_VERSION)
            .order_by(ScreeningExplanation.created_at.desc())
        )
        .scalars()
        .first()
    )


def generate_explanation(
    session: Session,
    *,
    screening: Screening,
    fused: FusedResult,
    site_results: list[SiteResult],
    audience: str,
    locale: str,
    provider: ExplanationProvider | None,
) -> ScreeningExplanation:
    source = build_source(fused, site_results)
    content = deterministic_content(source, audience)
    status = "unavailable"
    model = provider.model if provider is not None else None
    error_code = "provider_not_configured" if provider is None else None
    error_detail = None
    if provider is not None:
        try:
            content = _validate_content(
                provider.generate(source=source.__dict__, audience=audience, locale=locale)
            )
            status = "generated"
        except ExplanationProviderError as error:
            error_code = str(error)
        except Exception:
            error_code = "provider_unavailable"
            model = None
    explanation = ScreeningExplanation(
        screening_id=screening.id,
        audience=audience,
        locale=locale,
        status=status,
        model=model,
        prompt_version=PROMPT_VERSION,
        content=content,
        generated_at=datetime.now(UTC),
        error_code=error_code,
        error_detail=error_detail,
    )
    session.add(explanation)
    session.flush()
    return explanation
