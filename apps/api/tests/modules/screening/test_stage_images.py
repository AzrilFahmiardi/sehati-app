"""Pengujian penyimpanan stage_images di GCS, bukan base64 di JSONB.

storage.generate_signed_read_url dipalsukan lewat monkeypatch, konsisten
dengan pola di test_screening_service.py, karena pengujian ini tidak
seharusnya bergantung pada bucket GCS sungguhan.
"""

import uuid

import pytest

from hemavision_api.core import storage
from hemavision_api.modules.screening.router import _resolve_stage_images
from hemavision_api.modules.screening.service import stage_image_object_key


def test_stage_image_object_key_format() -> None:
    screening_id = uuid.uuid4()
    key = stage_image_object_key(screening_id, "conjunctiva", "roi_segmented")
    assert key == f"screenings/{screening_id}/conjunctiva/stage_roi_segmented.png"


def test_resolve_stage_images_uses_signed_url_for_object_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        storage, "generate_signed_read_url", lambda object_key: f"https://signed/{object_key}"
    )
    result = _resolve_stage_images({"roi_segmented": "screenings/abc/conjunctiva/stage_roi.png"})
    assert result == {"roi_segmented": "https://signed/screenings/abc/conjunctiva/stage_roi.png"}


def test_resolve_stage_images_falls_back_to_legacy_base64() -> None:
    legacy_base64 = "a" * 600
    result = _resolve_stage_images({"roi_segmented": legacy_base64})
    assert result == {"roi_segmented": f"data:image/png;base64,{legacy_base64}"}


def test_resolve_stage_images_none_passthrough() -> None:
    assert _resolve_stage_images(None) is None
