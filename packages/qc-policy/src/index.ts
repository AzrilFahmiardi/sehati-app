import policy from "./thresholds.json";

/**
 * Ambang quality control untuk satu sisi, klien maupun server.
 */
export interface QcThresholds {
  minLaplacianVariance: number;
  minBrightness: number;
  maxBrightness: number;
  maxGlareFraction: number;
  minRoiPixels: number;
}

/**
 * Alasan kegagalan gate pra-kirim. Sengaja memakai nama yang sama dengan
 * nilai `reasons` pada response inference tier agar tidak ada penerjemahan
 * istilah antara klien dan server.
 */
export type QcReason =
  | "blur"
  | "underexposed"
  | "overexposed"
  | "glare"
  | "roi_too_small";

/**
 * Metrik hasil pengukuran satu frame.
 */
export interface QcMetrics {
  laplacianVariance: number;
  brightness: number;
  glareFraction: number;
  roiPixels: number;
}

/**
 * Hasil evaluasi gate pra-kirim.
 */
export interface QcVerdict {
  passed: boolean;
  reasons: QcReason[];
}

export const QC_POLICY_VERSION: string = policy.version;

/**
 * Menyatakan apakah ambang klien sudah dikalibrasi empiris terhadap endpoint live.
 * Selama masih false, nilai ambang klien adalah dugaan awal yang konservatif dan
 * harus diverifikasi ulang. Lihat hemavision/docs/adr/007-edge-qc-not-edge-inference.md.
 */
export const QC_POLICY_CALIBRATED: boolean = policy.calibrated;

/**
 * Ambang otoritatif yang dipakai inference tier. Disalin di sini semata sebagai
 * pembanding untuk menegakkan invarian, bukan untuk dipakai mengevaluasi frame.
 */
export const SERVER_THRESHOLDS: QcThresholds = {
  minLaplacianVariance: policy.server.minLaplacianVariance,
  minBrightness: policy.server.minBrightness,
  maxBrightness: policy.server.maxBrightness,
  maxGlareFraction: policy.server.maxGlareFraction,
  minRoiPixels: policy.server.minRoiPixels,
};

/**
 * Ambang gate pra-kirim yang dijalankan di browser.
 */
export const CLIENT_THRESHOLDS: QcThresholds = {
  minLaplacianVariance: policy.client.minLaplacianVariance,
  minBrightness: policy.client.minBrightness,
  maxBrightness: policy.client.maxBrightness,
  maxGlareFraction: policy.client.maxGlareFraction,
  minRoiPixels: policy.client.minRoiPixels,
};

/**
 * Memeriksa invarian bahwa ambang klien sama ketat atau lebih ketat daripada server.
 *
 * Invarian ini wajib dijaga karena bila ambang klien lebih longgar, akan ada foto
 * yang lolos gate di perangkat lalu ditolak server, dan bagi kader itu terasa seperti
 * aplikasi berbohong. Fungsi mengembalikan daftar pelanggaran, kosong bila aman.
 */
export function findStrictnessViolations(
  client: QcThresholds = CLIENT_THRESHOLDS,
  server: QcThresholds = SERVER_THRESHOLDS,
): string[] {
  const violations: string[] = [];

  if (client.minLaplacianVariance < server.minLaplacianVariance) {
    violations.push("minLaplacianVariance klien lebih rendah daripada server");
  }
  if (client.minBrightness < server.minBrightness) {
    violations.push("minBrightness klien lebih rendah daripada server");
  }
  if (client.maxBrightness > server.maxBrightness) {
    violations.push("maxBrightness klien lebih tinggi daripada server");
  }
  if (client.maxGlareFraction > server.maxGlareFraction) {
    violations.push("maxGlareFraction klien lebih tinggi daripada server");
  }
  if (client.minRoiPixels < server.minRoiPixels) {
    violations.push("minRoiPixels klien lebih rendah daripada server");
  }

  return violations;
}

/**
 * Mengevaluasi metrik satu frame terhadap ambang gate pra-kirim.
 *
 * Satu frame dapat gagal karena lebih dari satu alasan sekaligus, sehingga seluruh
 * alasan dikembalikan agar panduan yang ditampilkan ke kader spesifik dan dapat
 * ditindaklanjuti, bukan sekadar pernyataan bahwa foto kurang baik.
 */
export function evaluateFrame(
  metrics: QcMetrics,
  thresholds: QcThresholds = CLIENT_THRESHOLDS,
): QcVerdict {
  const reasons: QcReason[] = [];

  if (metrics.laplacianVariance < thresholds.minLaplacianVariance) {
    reasons.push("blur");
  }
  if (metrics.brightness < thresholds.minBrightness) {
    reasons.push("underexposed");
  }
  if (metrics.brightness > thresholds.maxBrightness) {
    reasons.push("overexposed");
  }
  if (metrics.glareFraction > thresholds.maxGlareFraction) {
    reasons.push("glare");
  }
  if (metrics.roiPixels < thresholds.minRoiPixels) {
    reasons.push("roi_too_small");
  }

  return { passed: reasons.length === 0, reasons };
}
