"""Pengujian algoritma fusi multi situs, tanpa Postgres sungguhan.

compute_fusion cuma butuh Session untuk satu SELECT dan menyimpan satu baris
FusedResult, jadi dipalsukan dengan objek Session minimal alih-alih
testcontainers, supaya pengujian logika klinis (bobot, log-odds, aturan
abstain) cepat dan tidak butuh Docker.
"""

import uuid
from dataclasses import dataclass, field
from typing import Any

from hemavision_api.modules.fusion.models import FusedResult
from hemavision_api.modules.fusion.service import (
    ExcludedSite,
    SiteContribution,
    compute_fusion,
)


@dataclass
class _FakeScalarResult:
    value: Any

    def scalar_one_or_none(self) -> Any:
        return self.value


@dataclass
class _FakeSession:
    """Session palsu: SELECT selalu mengembalikan None (baris belum ada),
    add/flush/commit cuma mencatat pemanggilan."""

    added: list[object] = field(default_factory=list)

    def execute(self, _statement: object) -> _FakeScalarResult:
        return _FakeScalarResult(value=None)

    def add(self, obj: object) -> None:
        self.added.append(obj)

    def flush(self) -> None:
        pass

    def commit(self) -> None:
        pass


def _compute(
    contributions: list[SiteContribution],
    excluded_sites: list[ExcludedSite] | None = None,
    *,
    age_years: float = 30,
    sex: str = "F",
    is_pregnant: bool = False,
) -> FusedResult | None:
    session = _FakeSession()
    return compute_fusion(
        session,  # type: ignore[arg-type]
        screening_id=uuid.uuid4(),
        contributions=contributions,
        excluded_sites=excluded_sites or [],
        age_years=age_years,
        sex=sex,
        is_pregnant=is_pregnant,
    )


def test_no_contributions_returns_none() -> None:
    assert _compute([]) is None


def test_no_probability_available_returns_none() -> None:
    result = _compute([SiteContribution(site="conjunctiva", hb_gdl=13.0, anemic_probability=None)])
    assert result is None


def test_nail_alone_is_inconclusive() -> None:
    result = _compute([SiteContribution(site="nail", hb_gdl=8.0, anemic_probability=0.9)])
    assert result is not None
    assert result.decision == "inconclusive"
    abstain_reasons = result.caveats["abstain_reasons"]
    assert isinstance(abstain_reasons, list)
    assert "hanya_nail_yang_lolos_qc" in abstain_reasons


def test_large_hb_disagreement_is_inconclusive() -> None:
    result = _compute(
        [
            SiteContribution(site="conjunctiva", hb_gdl=13.0, anemic_probability=0.1),
            SiteContribution(site="palm", hb_gdl=9.0, anemic_probability=0.1),
        ]
    )
    assert result is not None
    assert result.decision == "inconclusive"
    abstain_reasons = result.caveats["abstain_reasons"]
    assert isinstance(abstain_reasons, list)
    assert "selisih_estimasi_hb_antar_situs_melebihi_2.5_gdl" in abstain_reasons


def test_probability_within_uncertainty_band_is_inconclusive() -> None:
    result = _compute(
        [SiteContribution(site="conjunctiva", hb_gdl=12.5, anemic_probability=0.491)]
    )
    assert result is not None
    assert result.decision == "inconclusive"


def test_clear_non_anemic_decision() -> None:
    result = _compute(
        [
            SiteContribution(site="conjunctiva", hb_gdl=13.5, anemic_probability=0.05),
            SiteContribution(site="palm", hb_gdl=13.2, anemic_probability=0.08),
        ]
    )
    assert result is not None
    assert result.decision == "non_anemic"
    assert result.who_category == "non_anemic"


def test_clear_anemic_decision() -> None:
    result = _compute(
        [
            SiteContribution(site="conjunctiva", hb_gdl=8.0, anemic_probability=0.95),
            SiteContribution(site="palm", hb_gdl=8.3, anemic_probability=0.92),
        ]
    )
    assert result is not None
    assert result.decision == "anemic"
    assert result.who_category in ("moderate", "severe")


def test_conjunctiva_weighted_more_than_nail_in_hb_average() -> None:
    # conjunctiva (bobot 1.00) menarik hb_gdl gabungan lebih dekat ke nilainya
    # sendiri (10.0) dibanding nail (bobot 0.35, nilai 6.0).
    result = _compute(
        [
            SiteContribution(site="conjunctiva", hb_gdl=10.0, anemic_probability=0.6),
            SiteContribution(site="nail", hb_gdl=6.0, anemic_probability=0.6),
        ]
    )
    assert result is not None
    midpoint = (10.0 + 6.0) / 2
    assert result.hb_gdl > midpoint


def test_pregnancy_caveat_recorded() -> None:
    result = _compute(
        [SiteContribution(site="conjunctiva", hb_gdl=13.5, anemic_probability=0.05)],
        is_pregnant=True,
    )
    assert result is not None
    assert "pregnancy_trimester" in result.caveats


def test_excluded_sites_recorded() -> None:
    result = _compute(
        [SiteContribution(site="conjunctiva", hb_gdl=13.5, anemic_probability=0.05)],
        excluded_sites=[ExcludedSite(site="palm", reason="gagal_qc")],
    )
    assert result is not None
    assert result.contributing_sites["excluded"] == ["palm"]
    assert result.caveats["excluded_sites"] == {"palm": "gagal_qc"}
