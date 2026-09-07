"""Fusi hasil situs menjadi satu keputusan klinis.

Algoritma ini mengikuti persis rancangan yang sudah ditulis pada
hemavision/docs/DECISION_LOG.md bagian "Fusi multi situs dengan pembobotan
kualitas dan mekanisme abstain", dan alasan severity dari ambang WHO pada
hemavision/docs/adr/006-severity-from-who.md.

Modul ini sengaja tidak mengimpor hemavision_api.modules.screening atau
hemavision_api.modules.patients secara langsung, karena kontrak import-linter
pada pyproject.toml melarang modul saling mengimpor. Pemanggil (hemavision_api
.workers, lapisan koordinasi yang sama dipakai record_site_result) yang
bertanggung jawab mengumpulkan data dari kedua modul itu dan mengirimkannya
ke sini sebagai nilai murni.
"""

import math
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.modules.fusion.models import FusedResult
from hemavision_api.modules.fusion.who_cutoffs import classify_anemia

FUSION_POLICY_VERSION = "fusion-v1-prior-reliability-weighted"
THRESHOLD_POLICY_VERSION = "threshold-v1-youden-0.491-all-sites"

# Prior keandalan per situs dari hasil out of fold (DECISION_LOG.md): nail
# dihukum berat karena AUC-nya jatuh dari 0,699 ke 0,536 saat fitur demografi
# dimatikan, mengindikasikan prediksinya banyak digerakkan oleh umur/jenis
# kelamin, bukan foto. Bobot kualitas tangkapan per situs (di luar prior ini)
# belum didukung datanya (cuma passed_qc boolean, bukan skor kontinu) — utang
# dicatat di DECISION_LOG.md, quality_weight dianggap 1.0 untuk semua situs
# yang lolos QC sebagai penyederhanaan v1.
PRIOR_RELIABILITY: dict[str, float] = {"conjunctiva": 1.00, "palm": 0.75, "nail": 0.35}

# Ambang Youden per situs. Palm dikonfirmasi dari MODEL_ARCHITECTURE_PALM.md
# (0,491). Conjunctiva dan nail memakai nilai yang sama sebagai default
# sementara sampai angka pastinya digali dari notebook Stage 5/6, dicatat
# sebagai utang pada hemavision/docs/DECISION_LOG.md.
SITE_DECISION_THRESHOLDS: dict[str, float] = {
    "conjunctiva": 0.491,
    "palm": 0.491,
    "nail": 0.491,
}

DECISION_UNCERTAINTY_BAND = 0.05
MIN_TOTAL_WEIGHT = 0.5
MAX_HB_DISAGREEMENT_GDL = 2.5


@dataclass(frozen=True)
class SiteContribution:
    """Satu situs yang lolos QC dan dipakai dalam perhitungan fusi."""

    site: str
    hb_gdl: float
    anemic_probability: float | None


@dataclass(frozen=True)
class ExcludedSite:
    """Satu situs yang tidak dipakai dalam perhitungan fusi, beserta alasannya."""

    site: str
    reason: str


def _weight_for(site: str) -> float:
    return PRIOR_RELIABILITY.get(site, 0.0)


def _logit(probability: float) -> float:
    clamped = min(max(probability, 1e-6), 1 - 1e-6)
    return math.log(clamped / (1 - clamped))


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def compute_fusion(
    session: Session,
    *,
    screening_id: uuid.UUID,
    contributions: list[SiteContribution],
    excluded_sites: list[ExcludedSite],
    age_years: float,
    sex: str,
    is_pregnant: bool,
) -> FusedResult | None:
    """Menghitung dan menyimpan (upsert) hasil fusi satu skrining.

    Mengembalikan None tanpa menyimpan apa pun hanya bila tidak ada satu pun
    situs yang punya estimasi Hb sama sekali (kolom hb_gdl/probability pada
    fused_results tidak boleh kosong). Selain itu, sistem selalu menyimpan
    baris dengan decision="inconclusive" saat salah satu aturan abstain
    berlaku (bobot total di bawah ambang, tidak ada yang lolos QC, selisih
    Hb antar situs > 2,5 g/dL, probabilitas dalam pita ketidakpastian, atau
    nail sendirian), daripada diam-diam tidak menyimpan apa pun.
    """
    if not contributions:
        return None

    weights_by_site = {c.site: _weight_for(c.site) for c in contributions}
    total_weight = sum(weights_by_site.values())

    hb_gdl = (
        sum(c.hb_gdl * weights_by_site[c.site] for c in contributions) / total_weight
        if total_weight > 0
        else sum(c.hb_gdl for c in contributions) / len(contributions)
    )

    prob_contributions: list[tuple[str, float]] = [
        (c.site, c.anemic_probability) for c in contributions if c.anemic_probability is not None
    ]
    if not prob_contributions:
        return None

    prob_weight_total = sum(weights_by_site[site] for site, _ in prob_contributions)
    if prob_weight_total > 0:
        combined_logit = (
            sum(_logit(prob) * weights_by_site[site] for site, prob in prob_contributions)
            / prob_weight_total
        )
        threshold = (
            sum(
                SITE_DECISION_THRESHOLDS.get(site, 0.5) * weights_by_site[site]
                for site, _ in prob_contributions
            )
            / prob_weight_total
        )
    else:
        combined_logit = sum(_logit(prob) for _, prob in prob_contributions) / len(
            prob_contributions
        )
        threshold = sum(
            SITE_DECISION_THRESHOLDS.get(site, 0.5) for site, _ in prob_contributions
        ) / len(prob_contributions)
    probability = _sigmoid(combined_logit)

    hb_values = [c.hb_gdl for c in contributions]
    max_disagreement = max(hb_values) - min(hb_values)
    sites_with_hb = {c.site for c in contributions}
    nail_alone = sites_with_hb == {"nail"}

    abstain_reasons: list[str] = []
    if total_weight < MIN_TOTAL_WEIGHT:
        abstain_reasons.append("bobot_total_di_bawah_ambang_minimum")
    if max_disagreement > MAX_HB_DISAGREEMENT_GDL:
        abstain_reasons.append("selisih_estimasi_hb_antar_situs_melebihi_2.5_gdl")
    if nail_alone:
        abstain_reasons.append("hanya_nail_yang_lolos_qc")
    if abs(probability - threshold) <= DECISION_UNCERTAINTY_BAND:
        abstain_reasons.append("probabilitas_dalam_pita_ketidakpastian")

    if abstain_reasons:
        decision = "inconclusive"
    elif probability >= threshold:
        decision = "anemic"
    else:
        decision = "non_anemic"

    classification = classify_anemia(
        hb_gdl=hb_gdl, age_years=age_years, sex=sex, is_pregnant=is_pregnant
    )

    caveats: dict[str, object] = {
        "estimate_disclaimer": (
            "Estimasi hemoglobin dan klasifikasi ini adalah hasil skrining AI, "
            "bukan pengganti tes laboratorium."
        ),
        "altitude_correction": (
            "Koreksi ketinggian tempat tinggal belum didukung, altitude "
            "dianggap 0 meter untuk semua pasien."
        ),
    }
    if is_pregnant:
        caveats["pregnancy_trimester"] = (
            "Trimester kehamilan tidak diketahui pada data pasien saat ini, "
            "memakai ambang WHO trimester I/III (11.0 g/dL) yang lebih konservatif."
        )
    if excluded_sites:
        caveats["excluded_sites"] = {item.site: item.reason for item in excluded_sites}
    if abstain_reasons:
        caveats["abstain_reasons"] = abstain_reasons

    contributing_sites: dict[str, object] = {
        "included": [c.site for c in contributions],
        "excluded": [item.site for item in excluded_sites],
    }

    existing = session.execute(
        select(FusedResult).where(FusedResult.screening_id == screening_id)
    ).scalar_one_or_none()
    if existing is None:
        existing = FusedResult(screening_id=screening_id)
        session.add(existing)

    existing.hb_gdl = hb_gdl
    existing.probability = probability
    existing.decision = decision
    existing.who_category = classification.category
    existing.contributing_sites = contributing_sites
    weights: dict[str, object] = {site: weight for site, weight in weights_by_site.items()}
    existing.weights = weights
    existing.caveats = caveats
    existing.fusion_policy_version = FUSION_POLICY_VERSION
    existing.threshold_policy_version = THRESHOLD_POLICY_VERSION
    existing.who_cutoff_version = classification.cutoff_version
    session.flush()
    session.commit()
    return existing
