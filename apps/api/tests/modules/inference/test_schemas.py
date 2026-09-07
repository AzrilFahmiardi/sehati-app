"""Pengujian regresi bentuk response inference tier.

Payload pada setiap pengujian disalin persis dari contoh pada
hemavision/docs/API_CONTRACT.md. Yang paling penting diuji adalah tiga kasus tepi
yang mudah salah ditangani: response selalu HTTP 200 bahkan pada kegagalan, palm
memiliki frame_detected yang wajib diperiksa sebelum passed_qc, dan nail pada kasus
segmentation_failed tidak memiliki key metrics sama sekali.
"""

from hemavision_api.modules.inference.schemas import (
    ConjunctivaResponse,
    NailResponse,
    PalmResponse,
)

FULL_HANDCRAFTED_FEATURES = {
    "mean_r": 180.2,
    "mean_g": 120.5,
    "mean_b": 110.3,
    "mean_r_minus_g": 59.7,
    "hhr": 0.42,
    "hhr_hue": 12.1,
    "red_ratio": 0.51,
    "erythema_index": 0.33,
    "mean_h": 8.2,
    "std_h": 2.1,
    "mean_s": 0.44,
    "std_s": 0.08,
    "mean_v": 0.61,
    "std_v": 0.05,
    "mean_l": 62.3,
    "std_l": 4.2,
    "mean_a": 22.1,
    "std_a": 3.3,
    "mean_bb": 15.4,
    "std_bb": 2.7,
    "g1": 0.11,
    "g2": 0.22,
    "g3": 0.33,
    "g4": 0.44,
    "g5": 0.55,
    "entropy": 6.8,
    "brightness": 150.1,
}


class TestConjunctivaResponse:
    def test_failed_quality_control_has_no_prediction_fields(self) -> None:
        payload = {
            "passed_qc": False,
            "reasons": ["blur"],
            "metrics": {
                "laplacian_variance": 120.5,
                "brightness": 145.2,
                "glare_fraction": 0.02,
                "roi_pixels": 88000,
                "passed": False,
                "reasons": ["blur"],
            },
            "stage_images": {"roi_segmented": "base64-placeholder"},
        }

        response = ConjunctivaResponse.model_validate(payload)

        assert response.is_conclusive is False
        assert response.hb_gdl is None
        assert response.anemic_probability is None
        assert response.stage_images is not None
        assert response.stage_images.illumination_normalized is None

    def test_passed_quality_control_exposes_prediction_fields(self) -> None:
        payload = {
            "passed_qc": True,
            "metrics": {
                "laplacian_variance": 310.4,
                "brightness": 150.1,
                "glare_fraction": 0.01,
                "roi_pixels": 210000,
                "passed": True,
                "reasons": [],
            },
            "hb_gdl": 14.52,
            "anemic": False,
            "anemic_probability": 0.1832,
            "severity": "Non-Anemic",
            "severity_caveat": (
                "Akurasi severity masih rendah (Cohen kappa 0.147), interpretasikan "
                "dengan hati hati."
            ),
            "handcrafted_features": FULL_HANDCRAFTED_FEATURES,
            "stage_images": {
                "roi_segmented": "a",
                "illumination_normalized": "b",
                "biomarker_heatmap": "c",
            },
        }

        response = ConjunctivaResponse.model_validate(payload)

        assert response.is_conclusive is True
        assert response.hb_gdl == 14.52
        assert response.severity == "Non-Anemic"
        assert response.handcrafted_features is not None
        assert response.handcrafted_features.mean_r == 180.2


class TestPalmResponse:
    def test_no_hand_detected_has_no_passed_qc_field_at_all(self) -> None:
        payload = {"frame_detected": False, "reasons": ["no_hand_detected"]}

        response = PalmResponse.model_validate(payload)

        assert response.frame_detected is False
        assert response.passed_qc is None
        assert response.is_conclusive is False
        assert response.detection_method is None
        assert response.metrics is None

    def test_hand_detected_but_failed_quality_control(self) -> None:
        payload = {
            "frame_detected": True,
            "detection_method": "landmark",
            "passed_qc": False,
            "reasons": ["roi_too_small"],
            "metrics": {
                "laplacian_variance": 0.0,
                "brightness": 0.0,
                "glare_fraction": 0.0,
                "roi_pixels": 500,
                "passed": False,
                "reasons": ["roi_too_small"],
            },
            "stage_images": {
                "raw_frame": "a",
                "landmarks": "b",
                "roi_segmented": "c",
            },
        }

        response = PalmResponse.model_validate(payload)

        assert response.frame_detected is True
        assert response.passed_qc is False
        assert response.is_conclusive is False

    def test_passed_quality_control(self) -> None:
        payload = {
            "frame_detected": True,
            "detection_method": "landmark",
            "passed_qc": True,
            "metrics": {
                "laplacian_variance": 310.4,
                "brightness": 150.1,
                "glare_fraction": 0.01,
                "roi_pixels": 210000,
                "passed": True,
                "reasons": [],
            },
            "hb_gdl": 14.46,
            "anemic": False,
            "anemic_probability": 0.2107,
            "severity": "Non-Anemic",
            "severity_caveat": (
                "Akurasi severity masih rendah (Cohen kappa 0.211), interpretasikan "
                "dengan hati hati."
            ),
            "handcrafted_features": FULL_HANDCRAFTED_FEATURES,
            "stage_images": {
                "raw_frame": "a",
                "landmarks": "b",
                "roi_segmented": "c",
                "illumination_normalized": "d",
                "biomarker_heatmap": "e",
            },
        }

        response = PalmResponse.model_validate(payload)

        assert response.is_conclusive is True
        assert response.hb_gdl == 14.46


class TestNailResponse:
    def test_segmentation_failed_has_no_metrics_key_at_all(self) -> None:
        payload = {
            "passed_qc": False,
            "reasons": ["segmentation_failed"],
            "stage_images": {"raw_frame": "a"},
        }

        response = NailResponse.model_validate(payload)

        assert response.is_conclusive is False
        assert response.metrics is None

    def test_roi_too_small_has_partial_metrics(self) -> None:
        payload = {
            "passed_qc": False,
            "reasons": ["roi_too_small"],
            "metrics": {"roi_pixels": 800, "passed": False, "reasons": ["roi_too_small"]},
            "stage_images": {"raw_frame": "a", "roi_segmented": "b"},
        }

        response = NailResponse.model_validate(payload)

        assert response.is_conclusive is False
        assert response.metrics is not None
        assert response.metrics.laplacian_variance is None
        assert response.metrics.roi_pixels == 800

    def test_passed_quality_control_carries_the_low_reliability_caveat(self) -> None:
        payload = {
            "passed_qc": True,
            "metrics": {"roi_pixels": 109074, "passed": True, "reasons": []},
            "hb_gdl": 14.06,
            "anemic": False,
            "anemic_probability": 0.413,
            "severity": "Non-Anemic",
            "severity_caveat": (
                "Head severity untuk nail memiliki Cohen kappa 0.0 pada evaluasi "
                "out of fold, artinya prediksi severity secara statistik tidak lebih "
                "baik dari tebakan acak. Nilai ini hanya ditampilkan untuk "
                "kelengkapan, jangan dipakai untuk keputusan klinis."
            ),
            "handcrafted_features": FULL_HANDCRAFTED_FEATURES,
            "stage_images": {
                "raw_frame": "a",
                "roi_segmented": "b",
                "illumination_normalized": "c",
                "biomarker_heatmap": "d",
            },
        }

        response = NailResponse.model_validate(payload)

        assert response.is_conclusive is True
        assert response.severity_caveat is not None
        assert "tidak lebih baik dari tebakan acak" in response.severity_caveat
