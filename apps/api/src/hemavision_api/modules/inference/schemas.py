"""Model Pydantic untuk kontrak response inference tier.

Ditranskripsi persis dari hemavision/docs/API_CONTRACT.md. Setiap bentuk response,
termasuk bentuk kegagalan, adalah hasil skrining yang valid, bukan galat, sehingga
seluruh field prediksi bersifat opsional dan kehadirannya harus diperiksa lewat
properti is_conclusive sebelum dibaca.

Peringatan yang wajib diperhatikan pemanggil, dijelaskan di
hemavision/docs/adr/006-severity-from-who.md: field anemic dan severity pada model ini
TIDAK dipakai sebagai dasar keputusan klinis. Layanan fusi menghitung keputusannya
sendiri dari anemic_probability dan dari estimasi hemoglobin, karena head severity
model memiliki Cohen kappa serendah 0.147 pada conjunctiva, 0.211 pada palm, dan 0.0
pada nail, yaitu tidak lebih baik daripada tebakan acak.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

QcReason = Literal[
    "blur",
    "underexposed",
    "overexposed",
    "glare",
    "roi_too_small",
    "no_hand_detected",
    "segmentation_failed",
]

Severity = Literal["Non-Anemic", "Mild", "Moderate", "Severe"]

DetectionMethod = Literal["landmark", "skin_fallback"]


class QcMetrics(BaseModel):
    """Metrik quality control mentah.

    Struktur field berbeda per situs. Conjunctiva dan palm mengisi laplacian_variance,
    brightness, dan glare_fraction. Nail hanya mengisi roi_pixels, passed, dan reasons,
    sehingga tiga field itu bernilai None pada response nail. Nail juga dapat sama
    sekali tidak memiliki objek metrics ini, pada kasus segmentation_failed, yang
    ditangani lewat metrics bernilai None pada model response induknya, bukan lewat
    model ini.
    """

    model_config = ConfigDict(extra="allow")

    roi_pixels: int
    passed: bool
    reasons: list[QcReason] = Field(default_factory=list)
    laplacian_variance: float | None = None
    brightness: float | None = None
    glare_fraction: float | None = None


class HandcraftedFeatures(BaseModel):
    """27 fitur handcrafted, struktur key sama persis di ketiga situs.

    Untuk nail, blok ini dihitung untuk ditampilkan saja. Model produksi nail tidak
    memakainya sebagai input, sesuai catatan arsitektur pada predict_nail.py di repo
    riset.
    """

    model_config = ConfigDict(extra="allow")

    mean_r: float
    mean_g: float
    mean_b: float
    mean_r_minus_g: float
    hhr: float
    hhr_hue: float
    red_ratio: float
    erythema_index: float
    mean_h: float
    std_h: float
    mean_s: float
    std_s: float
    mean_v: float
    std_v: float
    mean_l: float
    std_l: float
    mean_a: float
    std_a: float
    mean_bb: float
    std_bb: float
    g1: float
    g2: float
    g3: float
    g4: float
    g5: float
    entropy: float
    brightness: float


class StageImages(BaseModel):
    """Citra tiap tahap pipeline sebagai PNG base64 tanpa prefix data URI.

    Hanya ada bila request mengirim include_stages true, dan key yang benar benar
    muncul bergantung pada seberapa jauh pipeline berjalan sebelum gagal. Pemanggil
    tidak boleh mengasumsikan seluruh key selalu ada.
    """

    model_config = ConfigDict(extra="allow")

    raw_frame: str | None = None
    landmarks: str | None = None
    roi_segmented: str | None = None
    illumination_normalized: str | None = None
    biomarker_heatmap: str | None = None


class SitePredictionFields(BaseModel):
    """Field prediksi yang hanya hadir bila lolos quality control.

    Dipisah sebagai mixin karena bentuknya identik pada ketiga situs, sementara
    field status yang mengelilinginya (passed_qc, frame_detected) berbeda bentuk
    per situs.
    """

    hb_gdl: float | None = None
    anemic: bool | None = None
    anemic_probability: float | None = None
    severity: Severity | None = None
    severity_caveat: str | None = None
    handcrafted_features: HandcraftedFeatures | None = None


class ImageSiteResponse(SitePredictionFields):
    """Bentuk response untuk situs berbasis satu foto, yaitu conjunctiva dan nail.

    passed_qc selalu hadir pada kedua situs ini. metrics bernilai None pada kasus
    nail segmentation_failed, karena kegagalan terjadi sebelum mask apa pun berhasil
    dihitung.
    """

    passed_qc: bool
    reasons: list[QcReason] = Field(default_factory=list)
    metrics: QcMetrics | None = None
    stage_images: StageImages | None = None

    @property
    def is_conclusive(self) -> bool:
        """Menyatakan apakah response ini layak dibaca field prediksinya."""
        return self.passed_qc


class QualityCheckResponse(BaseModel):
    """Bentuk response POST /check-quality/{site}, sama pada ketiga situs.

    frame_detected dan detection_method hanya terisi pada palm, bernilai None
    pada conjunctiva dan nail. passed_qc bernilai None hanya pada kasus palm
    frame_detected false, atau nail segmentation_failed sebelum mask apa pun
    berhasil dihitung.
    """

    frame_detected: bool | None = None
    detection_method: DetectionMethod | None = None
    passed_qc: bool | None = None
    reasons: list[QcReason] = Field(default_factory=list)
    metrics: QcMetrics | None = None


class ConjunctivaResponse(ImageSiteResponse):
    """Response POST /predict/conjunctiva."""


class NailResponse(ImageSiteResponse):
    """Response POST /predict/nail."""


class PalmResponse(SitePredictionFields):
    """Bentuk response POST /predict/palm.

    frame_detected wajib diperiksa lebih dulu, sebelum passed_qc. Bila
    frame_detected bernilai false, tidak ada field lain sama sekali pada response,
    termasuk passed_qc, sehingga field itu bertipe opsional pada model ini, berbeda
    dari ImageSiteResponse yang mewajibkannya.
    """

    frame_detected: bool
    detection_method: DetectionMethod | None = None
    passed_qc: bool | None = None
    reasons: list[QcReason] = Field(default_factory=list)
    metrics: QcMetrics | None = None
    stage_images: StageImages | None = None

    @property
    def is_conclusive(self) -> bool:
        """Menyatakan apakah response ini layak dibaca field prediksinya.

        Keduanya harus benar. Tangan harus terdeteksi, dan hasil deteksi itu harus
        lolos quality control.
        """
        return self.frame_detected and bool(self.passed_qc)
