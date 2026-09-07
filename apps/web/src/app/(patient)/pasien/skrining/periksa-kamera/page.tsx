"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  User,
  ShieldCheck,
  SwitchCamera,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

const MIN_LONG_SIDE = 1280;
const MIN_SHORT_SIDE = 720;
const CAMERA_FACING_STORAGE_KEY = "hv_screening_camera_facing";

type CheckStatus = "pending" | "ok" | "failed";
type CameraFacing = "user" | "environment";



export default function CameraCheckPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<CameraFacing>("environment");
  const [isSwitching, setIsSwitching] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("pending");
  const [resolutionStatus, setResolutionStatus] = useState<CheckStatus>("pending");
  const [resolutionLabel, setResolutionLabel] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    async function runDeviceCheck() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus("failed");
        setResolutionStatus("failed");
        return;
      }

      setCameraStatus("pending");
      setResolutionStatus("pending");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        // Request the larger ideal for both axes so the browser picks the
        // best resolution regardless of portrait vs landscape orientation.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: MIN_LONG_SIDE },
            height: { ideal: MIN_LONG_SIDE },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStatus("ok");

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          if (video.readyState < 2) {
            await new Promise<void>((resolve) => {
              const onReady = () => {
                video.removeEventListener("loadedmetadata", onReady);
                resolve();
              };
              video.addEventListener("loadedmetadata", onReady);
              setTimeout(resolve, 1500);
            });
          }
        }

        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings();
        const capabilities = track?.getCapabilities ? track.getCapabilities() : undefined;
        const width = video?.videoWidth || settings?.width || 0;
        const height = video?.videoHeight || settings?.height || 0;
        // Orientation-agnostic check: compare longer side against MIN_LONG_SIDE
        // and shorter side against MIN_SHORT_SIDE, regardless of portrait/landscape.
        const longSide = Math.max(width, height);
        const shortSide = Math.min(width, height);
        setResolutionLabel(`${width}x${height}`);
        setResolutionStatus(longSide >= MIN_LONG_SIDE && shortSide >= MIN_SHORT_SIDE ? "ok" : "failed");
        sessionStorage.setItem(CAMERA_FACING_STORAGE_KEY, facingMode);
      } catch (error) {
        if (!cancelled) {
          setCameraStatus("failed");
          setResolutionStatus("failed");
        }
      } finally {
        if (!cancelled) {
          setIsSwitching(false);
        }
      }
    }

    runDeviceCheck();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const isReady = cameraStatus === "ok" && resolutionStatus === "ok";

  const handleSwitchCamera = () => {
    setIsSwitching(true);
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleContinueScreening = () => {
    router.push(ROUTES.PATIENT.SKRINING_CAPTURE);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface to-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[512px] mx-auto space-y-6">

        {/* Main Card */}
        <div className="w-full bg-white rounded-xl border border-outline/40 shadow-xs p-6 sm:p-8 space-y-6">

          {/* Header Section */}
          <div className="space-y-2 text-center">
            <h1 className="text-primary text-2xl font-semibold leading-8">
              Periksa Perangkat
            </h1>
            <p className="text-on-surface-variant text-base font-normal leading-relaxed">
              Memastikan kamera dan resolusi memadai untuk akurasi skrining.
            </p>
          </div>

          {/* Camera Live Preview */}
          <div className="relative w-full h-44 sm:h-48 bg-surface-container-high rounded-xl border border-outline overflow-hidden flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraStatus === "ok" ? "opacity-100" : "opacity-0"
              }`}
            />
            {cameraStatus !== "ok" && (
              <div className="w-48 h-32 border-2 border-primary/30 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 bg-outline-variant/30 backdrop-blur-2xs">
                <User className="w-12 h-12 text-on-surface-muted/40" />
              </div>
            )}

            {cameraStatus === "ok" && (
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-surface/90 backdrop-blur-xs rounded-full border border-white/60 shadow-xs flex items-center gap-1.5">
                <Video className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary text-xs font-medium">Preview Aktif</span>
              </div>
            )}

            {cameraStatus !== "pending" && (
              <button
                onClick={handleSwitchCamera}
                disabled={isSwitching}
                className="absolute bottom-3 right-3 p-2 bg-surface/90 backdrop-blur-xs rounded-full border border-white/60 shadow-xs text-primary active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                aria-label="Putar kamera"
              >
                <SwitchCamera className={`w-4 h-4 ${isSwitching ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          {/* Check Items */}
          <div className="space-y-2.5 pt-1">

            {/* Item 1: Kamera terdeteksi */}
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline/20 flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                {cameraStatus === "ok" ? (
                  <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 animate-pop-in" />
                ) : cameraStatus === "failed" ? (
                  <XCircle className="w-5 h-5 text-error flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                )}
                <span className="text-on-surface text-base font-normal">
                  Kamera terdeteksi
                </span>
              </div>
              <div>
                {cameraStatus === "ok" ? (
                  <span className="text-tertiary font-mono text-sm font-semibold tracking-wide animate-pop-in">
                    OK
                  </span>
                ) : cameraStatus === "failed" ? (
                  <span className="text-error font-mono text-sm font-semibold tracking-wide">
                    Gagal
                  </span>
                ) : (
                  <span className="text-on-surface-muted font-mono text-xs animate-pulse">
                    Memeriksa...
                  </span>
                )}
              </div>
            </div>

            {/* Item 2: Resolusi kamera memadai */}
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline/20 flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                {resolutionStatus === "ok" ? (
                  <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 animate-pop-in" />
                ) : resolutionStatus === "failed" ? (
                  <XCircle className="w-5 h-5 text-error flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                )}
                <span className="text-on-surface text-base font-normal">
                  Resolusi kamera memadai
                </span>
              </div>
              <div>
                {resolutionStatus === "ok" ? (
                  <span className="text-tertiary font-mono text-sm font-semibold tracking-wide animate-pop-in">
                    {resolutionLabel}
                  </span>
                ) : resolutionStatus === "failed" ? (
                  <span className="text-error font-mono text-sm font-semibold tracking-wide">
                    {resolutionLabel ?? "Gagal"}
                  </span>
                ) : (
                  <span className="text-on-surface-muted font-mono text-xs animate-pulse">
                    Memeriksa...
                  </span>
                )}
              </div>
            </div>

            {/* Ready Banner */}
            {isReady && (
              <div className="pt-1 animate-pop-in">
                <div className="p-3 bg-tertiary-container/20 rounded-lg border border-tertiary-muted/30 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-tertiary flex-shrink-0" />
                  <span className="text-tertiary-alt text-sm font-semibold">
                    Perangkat Siap Digunakan
                  </span>
                </div>
              </div>
            )}

            {/* Blocking Reason Banner */}
            {(cameraStatus === "failed" || resolutionStatus === "failed") && (
              <div className="pt-1">
                <div className="p-3 bg-error-container/20 rounded-lg border border-error/30 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-error flex-shrink-0" />
                  <span className="text-error text-sm font-semibold">
                    {cameraStatus === "failed"
                      ? "Kamera tidak dapat diakses. Periksa izin kamera pada browser Anda."
                      : `Resolusi kamera terlalu rendah, minimum ${MIN_LONG_SIDE}x${MIN_SHORT_SIDE}. Gunakan perangkat dengan kamera lebih baik.`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Area & Disclaimer */}
          <div className="space-y-4 pt-2 border-t border-outline/20">
            <button
              onClick={handleContinueScreening}
              disabled={!isReady}
              className={`w-full py-3.5 px-6 font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isReady
                  ? "bg-primary-bright hover:bg-primary active:scale-[0.99] text-white shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-80"
              }`}
            >
              <span>Lanjutkan Skrining</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-2 opacity-80 pt-1">
              <Info className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
              <p className="text-on-surface-variant text-xs leading-relaxed text-center">
                Kualitas gambar dapat bervariasi bergantung pada spesifikasi perangkat keras dan kondisi pencahayaan lingkungan Anda. Hasil skrining bersifat indikatif.
              </p>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
