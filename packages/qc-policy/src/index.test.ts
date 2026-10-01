import { describe, expect, it } from "vitest";

import {
  CLIENT_THRESHOLDS,
  SERVER_THRESHOLDS,
  evaluateFrame,
  findStrictnessViolations,
} from "./index";

describe("invarian ketatnya ambang klien", () => {
  it("ambang klien sama ketat atau lebih ketat daripada server", () => {
    expect(findStrictnessViolations()).toEqual([]);
  });

  it("mendeteksi pelanggaran bila ambang klien dilonggarkan", () => {
    const loosened = { ...CLIENT_THRESHOLDS, minLaplacianVariance: 1.0 };
    expect(findStrictnessViolations(loosened, SERVER_THRESHOLDS)).toHaveLength(1);
  });
});

describe("evaluasi frame", () => {
  const acceptable = {
    laplacianVariance: 250,
    brightness: 140,
    glareFraction: 0.02,
    roiPixels: 90_000,
  };

  it("meloloskan frame yang memenuhi seluruh gate", () => {
    expect(evaluateFrame(acceptable)).toEqual({ passed: true, reasons: [] });
  });

  it("melaporkan seluruh alasan kegagalan sekaligus, bukan hanya yang pertama", () => {
    const verdict = evaluateFrame({
      laplacianVariance: 5,
      brightness: 20,
      glareFraction: 0.5,
      roiPixels: 100,
    });

    expect(verdict.passed).toBe(false);
    expect(verdict.reasons).toEqual(["blur", "underexposed", "glare", "roi_too_small"]);
  });

  it("membedakan kurang terang dari terlalu terang", () => {
    expect(evaluateFrame({ ...acceptable, brightness: 240 }).reasons).toEqual([
      "overexposed",
    ]);
    expect(evaluateFrame({ ...acceptable, brightness: 30 }).reasons).toEqual([
      "underexposed",
    ]);
  });
});
