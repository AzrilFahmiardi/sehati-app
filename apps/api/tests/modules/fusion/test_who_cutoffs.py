"""Pengujian klasifikasi anemia WHO 2024, fungsi murni tanpa DB."""

from hemavision_api.modules.fusion.who_cutoffs import classify_anemia


def test_non_pregnant_woman_cutoff() -> None:
    result = classify_anemia(hb_gdl=12.5, age_years=30, sex="F", is_pregnant=False)
    assert result.category == "non_anemic"
    assert result.cutoff_used == 12.0


def test_man_cutoff() -> None:
    result = classify_anemia(hb_gdl=12.5, age_years=30, sex="M", is_pregnant=False)
    assert result.category == "mild"
    assert result.cutoff_used == 13.0


def test_pregnant_woman_uses_trimester_1_3_cutoff() -> None:
    result = classify_anemia(hb_gdl=10.8, age_years=28, sex="F", is_pregnant=True)
    assert result.category == "mild"
    assert result.cutoff_used == 11.0


def test_adolescent_cutoff() -> None:
    result = classify_anemia(hb_gdl=11.5, age_years=13, sex="M", is_pregnant=False)
    assert result.category == "mild"
    assert result.cutoff_used == 12.0


def test_infant_cutoff() -> None:
    result = classify_anemia(hb_gdl=9.0, age_years=1, sex="F", is_pregnant=False)
    assert result.category == "mild"
    assert result.cutoff_used == 10.5


def test_severity_bands() -> None:
    # cutoff 12.0 untuk perempuan tidak hamil
    assert classify_anemia(12.0, 30, "F", False).category == "non_anemic"
    assert classify_anemia(11.0, 30, "F", False).category == "mild"
    assert classify_anemia(9.0, 30, "F", False).category == "moderate"
    assert classify_anemia(6.0, 30, "F", False).category == "severe"


def test_cutoff_version_recorded() -> None:
    result = classify_anemia(hb_gdl=13.0, age_years=30, sex="M", is_pregnant=False)
    assert result.cutoff_version == "who-2024-v1"
