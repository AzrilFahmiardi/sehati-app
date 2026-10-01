"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  VideoOff,
  HelpCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  startRealScreening,
  uploadCapture,
  sha256Hex,
  checkCaptureQuality,
  SubmitUpload,
} from "@/services/screening";
import { QC_REASON_LABELS } from "@/lib/qc-labels";

type CaptureSite = "conjunctiva" | "nail" | "palm";

const STEPS: Array<{
  id: number;
  site: CaptureSite;
  label: string;
  subtitle: string;
  instructionTitle: string;
  subtext: string;
  shape: "eye" | "nail" | "palm";
}> = [
  {
    id: 1,
    site: "conjunctiva",
    label: "Langkah 1 dari 3",
    subtitle: "Pengambilan Citra Mata",
    instructionTitle: "Posisikan mata di dalam panduan.",
    subtext: "Pastikan kelopak mata bawah ditarik perlahan dan terlihat jelas.",
    shape: "eye",
  },
  {
    id: 2,
    site: "nail",
    label: "Langkah 2 dari 3",
    subtitle: "Pengambilan Citra Kuku",
    instructionTitle: "Posisikan kuku di dalam panduan.",
    subtext:
      "Pastikan cahaya cukup dan kuku terlihat jelas tanpa pantulan berlebih. Bila memungkinkan, gunakan latar polos atau gelap di belakang jari.",
    shape: "nail",
  },
  {
    id: 3,
    site: "palm",
    label: "Langkah 3 dari 3",
    subtitle: "Pengambilan Citra Telapak Tangan",
    instructionTitle: "Buka telapak tangan dan posisikan di dalam panduan.",
    subtext:
      "Buka telapak tangan sepenuhnya dan pastikan pencahayaan rata. Bila memungkinkan, gunakan latar polos atau gelap di belakang tangan.",
    shape: "palm",
  },
];

export default function CameraCapturePage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [qcFailureReasons, setQcFailureReasons] = useState<string[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStep = STEPS[currentStepIndex];

  useEffect(() => {
    const screeningId = sessionStorage.getItem("hv_screening_id");
    const organizationId = sessionStorage.getItem("hv_screening_org");
    const idempotencyKey = sessionStorage.getItem("hv_screening_idempotency_key");
    if (!screeningId || !organizationId || !idempotencyKey) {
      router.push(ROUTES.PATIENT.SKRINING_PERSIAPAN);
    }
  }, [router]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCameraStream() {
      setHasCameraError(false);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const facingMode = sessionStorage.getItem("hv_screening_camera_facing") || "environment";
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }

          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        } else {
          setHasCameraError(true);
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        setHasCameraError(true);
        setCameraActive(false);
      }
    }

    startCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleRetryCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
        setHasCameraError(false);
      }
    } catch {
      alert("Akses kamera tidak diizinkan. Silakan aktifkan izin kamera pada browser Anda.");
    }
  };

  const handleCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setPipelineError(null);
    setQcFailureReasons(null);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    setTimeout(async () => {
      if (!(videoRef.current && videoRef.current.readyState >= 2)) {
        setIsCapturing(false);
        setPipelineError("Kamera belum siap, tidak bisa mengambil citra.");
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCapturing(false);
        setPipelineError("Gagal memproses citra dari kamera.");
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92)
      );
      if (!blob) {
        setIsCapturing(false);
        setPipelineError("Gagal membuat berkas citra untuk diunggah.");
        return;
      }

      try {
        const screeningId = sessionStorage.getItem("hv_screening_id");
        const organizationId = sessionStorage.getItem("hv_screening_org");
        const patientId = sessionStorage.getItem("hv_screening_patient");
        const idempotencyKey = sessionStorage.getItem("hv_screening_idempotency_key");
        if (!screeningId || !organizationId || !patientId || !idempotencyKey) {
          throw new Error("Konteks sesi skrining tidak lengkap");
        }

        const refreshed = await startRealScreening(
          patientId,
          organizationId,
          undefined,
          idempotencyKey
        );
        sessionStorage.setItem("hv_screening_uploads", JSON.stringify(refreshed.uploads));

        const target = refreshed.uploads.find((item) => item.site === currentStep.site);
        if (!target) {
          throw new Error("Signed URL untuk situs ini tidak ditemukan");
        }
        await uploadCapture(target.upload_url, blob);

        const quality = await checkCaptureQuality(
          screeningId,
          organizationId,
          currentStep.site,
          blob
        );
        if (quality.passedQc === false) {
          setQcFailureReasons(quality.reasons);
          setIsCapturing(false);
          return;
        }

        const sha256 = await sha256Hex(blob);

        const stored = sessionStorage.getItem("hv_screening_submit_uploads");
        const uploads: SubmitUpload[] = stored ? JSON.parse(stored) : [];
        const nextUploads = [
          ...uploads.filter((item) => item.site !== currentStep.site),
          { site: currentStep.site, bytes: blob.size, sha256 },
        ];
        sessionStorage.setItem("hv_screening_submit_uploads", JSON.stringify(nextUploads));

        const storedPreviews = sessionStorage.getItem("hv_screening_previews");
        const previews: Record<string, string> = storedPreviews ? JSON.parse(storedPreviews) : {};
        previews[currentStep.site] = previewDataUrl;
        sessionStorage.setItem("hv_screening_previews", JSON.stringify(previews));

        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          router.push(ROUTES.PATIENT.SKRINING_TINJAU);
        }
      } catch {
        setPipelineError("Gagal mengunggah citra, coba lagi.");
      } finally {
        setIsCapturing(false);
      }
    }, 350);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      router.push(ROUTES.PATIENT.SKRINING_PERSIAPAN);
    }
  };

  return (
    <main className="min-h-screen w-full bg-on-surface font-sans flex items-center justify-center select-none overflow-hidden">

      {/* Mobile App Container Frame */}
      <div className="relative w-full max-w-[480px] h-screen max-h-[920px] bg-surface flex flex-col justify-between overflow-hidden shadow-2xl border-x border-outline/20">

        {/* Shutter Flash Screen Effect */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 animate-pulse pointer-events-none transition-opacity duration-150" />
        )}

        {/* Real Live Camera Feed Background */}
        <div className="absolute inset-0 z-0 bg-outline-muted flex items-center justify-center overflow-hidden">

          {/* Always rendered real video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform scale-105 transition-opacity duration-300 ${
              cameraActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Camera Access Blocked Fallback UI */}
          {hasCameraError && !cameraActive && (
            <div className="absolute inset-0 z-10 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-on-surface-deep/95 text-white">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-tertiary-container" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Kamera Belum Aktif</h3>
                <p className="text-sm text-slate-300 max-w-xs">
                  Izinkan akses kamera pada browser Anda untuk dapat melakukan skrining langsung.
                </p>
              </div>
              <button
                onClick={handleRetryCamera}
                className="px-5 py-2.5 bg-primary hover:bg-primary-deep active:scale-95 text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Aktifkan Kamera</span>
              </button>
            </div>
          )}

          {/* Dynamic Viewfinder Reticle Target */}
          <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            {currentStep.shape === "palm" ? (
              /* Step 3: Telapak Tangan Palm Guide Box (Enlarged) */
              <div className="w-[310px] sm:w-[320px] h-[390px] sm:h-[410px] rounded-2xl outline-4 outline-primary-bright outline-offset-[-4px] border-2 border-dashed border-primary-bright opacity-95 shadow-2xl relative overflow-hidden flex items-center justify-center bg-transparent">
                {/* Center Reticle Crosshair Notch */}
                <div className="w-5 h-5 absolute top-0 left-1/2 -translate-x-1/2 border-t-2 border-r-2 border-primary-bright" />
                <div className="w-5 h-5 absolute bottom-0 left-1/2 -translate-x-1/2 border-b-2 border-l-2 border-primary-bright" />
                {/* Vertical Motion Laser Scanning Line */}
                <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow animate-float-gentle pointer-events-none" />
              </div>
            ) : currentStep.shape === "nail" ? (
              /* Step 2: Kuku Vertical Arched Guide */
              <div className="w-[192px] h-[256px] rounded-t-[40px] rounded-b-[16px] border-2 border-white/70 shadow-2xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow-sm animate-float-gentle pointer-events-none" />
              </div>
            ) : (
              /* Step 1: Mata Horizontal Guide */
              <div className="w-[256px] h-[128px] rounded-xl border-2 border-white/70 shadow-2xl relative overflow-hidden flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow-sm animate-float-gentle pointer-events-none" />
              </div>
            )}
          </div>

          {/* Floating Instruction Card Banner at Top */}
          <div className="absolute top-[72px] left-0 right-0 z-20 px-4">
            <div className="p-4 bg-surface/90 backdrop-blur-md rounded-xl border border-outline shadow-sm text-center space-y-1">
              <p className="text-on-surface text-base font-normal">
                {currentStep.label}
              </p>
              <h2 className="text-on-surface text-xl sm:text-2xl font-semibold leading-snug">
                {currentStep.instructionTitle}
              </h2>
            </div>
          </div>

          {/* Butuh Bantuan Link, always visible */}
          <div className="absolute bottom-[96px] left-0 right-0 z-20 px-4 flex items-center justify-center">
            <button
              onClick={() => router.push(ROUTES.PATIENT.SKRINING_BANTUAN)}
              className="px-3 py-1.5 bg-surface/80 backdrop-blur-md rounded-full border border-outline shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-on-surface">Butuh Bantuan?</span>
            </button>
          </div>

        </div>

        {/* Top Header Glassmorphism Bar */}
        <div className="relative z-20 w-full h-[64px] px-4 bg-surface/80 backdrop-blur-md border-b border-outline flex items-center justify-between shadow-xs">

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-black/5 active:scale-95 text-primary transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>

          {/* Center Brand Title */}
          <h1 className="text-primary text-2xl font-bold font-sans tracking-tight">
            SEHATI
          </h1>

          {/* Empty spacer for centering balance */}
          <div className="w-10" />
        </div>

        {/* Bottom Bar Capture Action Button */}
        <div className="relative z-20 w-full p-4 bg-white/90 backdrop-blur-md border-t border-outline space-y-2">
          {pipelineError && (
            <p className="text-sm text-error font-medium text-center">{pipelineError}</p>
          )}
          {qcFailureReasons && (
            <div className="p-3 bg-error-container/20 rounded-lg border border-error/30 text-center space-y-1">
              <p className="text-sm text-error font-semibold">
                Kualitas citra kurang memadai, silakan ambil ulang.
              </p>
              <p className="text-xs text-error">
                {qcFailureReasons
                  .map((reason) => QC_REASON_LABELS[reason] ?? reason)
                  .join(", ")}
              </p>
            </div>
          )}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-full py-4 bg-primary-bright hover:bg-primary active:scale-[0.98] text-white font-medium text-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Camera className="w-5 h-5 text-white" />
            <span>{isCapturing ? "Mengunggah..." : "Ambil Gambar"}</span>
          </button>
        </div>

      </div>

    </main>
  );
}
