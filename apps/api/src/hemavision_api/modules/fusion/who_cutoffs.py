"""Klasifikasi anemia dari estimasi hemoglobin memakai ambang WHO 2024.

Severity diturunkan dari nilai hemoglobin lewat fungsi murni ini, bukan dari
head severity model (kappa 0,0 pada nail, lihat
hemavision/docs/adr/006-severity-from-who.md), karena severity klinis pada
dasarnya adalah fungsi deterministik dari Hb menurut definisi WHO.

Data yang belum tersedia dicatat sebagai utang pada hemavision/docs/DECISION_LOG.md:
altitude_m selalu diasumsikan 0 (tanpa koreksi ketinggian), dan kehamilan tanpa
info trimester memakai cutoff trimester I/III yang lebih konservatif karena
trimester tidak pernah benar-benar disimpan di data pasien saat ini.
"""

from dataclasses import dataclass
from typing import Literal

WhoCategory = Literal["non_anemic", "mild", "moderate", "severe"]

WHO_CUTOFF_VERSION = "who-2024-v1"


@dataclass(frozen=True)
class ClassificationResult:
    category: WhoCategory
    cutoff_used: float
    cutoff_version: str


def _base_cutoff(age_years: float, sex: str, is_pregnant: bool) -> float:
    """Ambang anemia (g/dL) sebelum koreksi ketinggian, sesuai WHO 2024."""
    if age_years < 0.5:
        # Di bawah 6 bulan tidak tercakup pedoman WHO 2024 (mulai 6-23 bulan);
        # pakai ambang anak 6-23 bulan sebagai perkiraan konservatif terdekat.
        return 10.5
    if age_years < 2:
        return 10.5
    if age_years < 15:
        return 12.0
    if is_pregnant:
        # Trimester tidak diketahui pada data saat ini, pakai ambang TM I/III
        # yang lebih ketat (lebih sensitif) daripada TM II (10.5 g/dL).
        return 11.0
    if sex == "F":
        return 12.0
    return 13.0


def classify_anemia(
    hb_gdl: float,
    age_years: float,
    sex: str,
    is_pregnant: bool,
    altitude_m: float = 0.0,
) -> ClassificationResult:
    """Mengklasifikasi anemia dari estimasi Hb, mengembalikan cutoff yang
    dipakai supaya hasilnya dapat diaudit dan dijelaskan.

    altitude_m sengaja diabaikan (selalu dianggap dataran rendah) sampai data
    lokasi pasien tersedia; ini utang yang disengaja, bukan bug, dicatat pada
    hemavision/docs/DECISION_LOG.md.
    """
    cutoff = _base_cutoff(age_years, sex, is_pregnant)

    if hb_gdl >= cutoff:
        category: WhoCategory = "non_anemic"
    elif hb_gdl >= cutoff * 0.85:
        category = "mild"
    elif hb_gdl >= cutoff * 0.62:
        category = "moderate"
    else:
        category = "severe"

    return ClassificationResult(
        category=category, cutoff_used=cutoff, cutoff_version=WHO_CUTOFF_VERSION
    )
