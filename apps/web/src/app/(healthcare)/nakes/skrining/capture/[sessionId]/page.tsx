"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Check,
  Camera,
  ArrowLeft,
  Info,
  Zap,
  CheckCircle2,
  RefreshCw,
  Video,
  SwitchCamera,
  AlertTriangle,
  Clock,
  Hand,
  Upload,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  uploadCapture,
  sha256Hex,
  submitRealScreening,
  startRealScreening,
  checkCaptureQuality,
  SubmitUpload,
} from "@/services/screening";
import { getPatientForOrganization, RealPatient } from "@/services/patients";
import { QC_REASON_LABELS } from "@/lib/qc-labels";

type CaptureSite = "conjunctiva" | "nail" | "palm";

const SITE_ORDER: CaptureSite[] = ["conjunctiva", "nail", "palm"];

export default function ImageCapturePage() {
  return (
    <Suspense>
      <ImageCaptureContent />
    </Suspense>
  );
}

function ImageCaptureContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const screeningId = (params?.sessionId as string) || "";

  const getInitialSite = (): CaptureSite => {
    const requested = searchParams.get("site");
    if (requested === "nail" || requested === "palm" || requested === "conjunctiva") {
      return requested;
    }
    return "conjunctiva";
  };

  // WebRTC Camera Refs & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [streamResolution, setStreamResolution] = useState<string | null>(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false); // Default to false (environment camera)
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture State Management
  const [activeSite, setActiveSite] = useState<CaptureSite>(getInitialSite());
  const [capturedSites, setCapturedSites] = useState<CaptureSite[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShutterFlash, setShowShutterFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [uploads, setUploads] = useState<SubmitUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [qcFailureReasons, setQcFailureReasons] = useState<string[] | null>(null);
  const [patient, setPatient] = useState<RealPatient | null>(null);
  const [nakesInitials, setNakesInitials] = useState("-");

  // Read camera preference on mount
  useEffect(() => {
    const savedFacingMode = sessionStorage.getItem("hv_screening_camera_facing");
    if (savedFacingMode === "user") {
      setUseFrontCamera(true);
    }
  }, []);

  useEffect(() => {
    const patientId = sessionStorage.getItem("hv_screening_patient");
    const organizationId = sessionStorage.getItem("hv_screening_org");
    if (!patientId || !organizationId) return;
    getPatientForOrganization(patientId, organizationId)
      .then(setPatient)
      .catch(() => setPatient(null));
  }, []);

  useEffect(() => {
    const name = sessionStorage.getItem("hv_user_name");
    if (name) {
      setNakesInitials(
        name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
      );
    }
  }, []);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Request & Start Browser Webcam
  const startCameraStream = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: useFrontCamera ? "user" : "environment",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("muted", "true");
        await videoRef.current.play();
        setHasWebcam(true);
        const settings = stream.getVideoTracks()[0]?.getSettings();
        setStreamResolution(
          settings?.width && settings?.height ? `${settings.width}x${settings.height}` : null
        );
      }
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      setHasWebcam(false);
      setCameraError("Browser belum memberi izin kamera atau webcam tidak terhubung.");
    }
  };

  useEffect(() => {
    if (!capturedImagePreview) {
      startCameraStream();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeSite, useFrontCamera, capturedImagePreview]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mengunggah blob citra (dari capture kamera maupun file dipilih) ke signed
  // URL situs aktif, dipakai bersama oleh handleTakePhoto dan handleFileSelected.
  //
  // Signed URL berlaku 15 menit sejak diterbitkan di /nakes/skrining/multisite,
  // dan kader bisa jadi butuh lebih lama dari itu untuk menyelesaikan ketiga
  // situs (izin kamera, reposisi pasien, dst). Maka signed URL selalu
  // diterbitkan ulang tepat sebelum unggah lewat idempotency_key yang sama,
  // bukan dipakai dari cache sessionStorage yang bisa sudah kedaluwarsa.
  const uploadBlobForActiveSite = async (blob: Blob): Promise<void> => {
    try {
      const patientId = sessionStorage.getItem("hv_screening_patient");
      const organizationId = sessionStorage.getItem("hv_screening_org");
      const idempotencyKey = sessionStorage.getItem("hv_screening_idempotency_key");
      if (!patientId || !organizationId || !idempotencyKey) {
        throw new Error("Konteks sesi skrining tidak lengkap");
      }

      const refreshed = await startRealScreening(
        patientId,
        organizationId,
        undefined,
        idempotencyKey
      );
      sessionStorage.setItem("hv_screening_uploads", JSON.stringify(refreshed.uploads));

      const target = refreshed.uploads.find((item) => item.site === activeSite);
      if (!target) {
        throw new Error("Signed URL untuk situs ini tidak ditemukan");
      }
      await uploadCapture(target.upload_url, blob);

      const quality = await checkCaptureQuality(
        screeningId,
        organizationId,
        activeSite,
        blob
      );
      if (quality.passedQc === false) {
        setQcFailureReasons(quality.reasons);
        throw new Error("qc_failed");
      }

      const sha256 = await sha256Hex(blob);
      setUploads((previous) => [
        ...previous.filter((item) => item.site !== activeSite),
        { site: activeSite, bytes: blob.size, sha256 },
      ]);
      if (!capturedSites.includes(activeSite)) {
        setCapturedSites([...capturedSites, activeSite]);
      }
    } catch (error: any) {
      if (error.message !== "qc_failed") {
        setPipelineError("Gagal mengunggah citra, coba lagi.");
        setCapturedImagePreview(null);
      }
      throw error;
    }
  };

  // Real Photo Capture from Video Canvas, diunggah langsung ke signed URL situs aktif
  const handleTakePhoto = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setPipelineError(null);
    setQcFailureReasons(null);

    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 250);

    setTimeout(async () => {
      if (!(videoRef.current && videoRef.current.readyState >= 2)) {
        setIsCapturing(false);
        setPipelineError("Kamera belum siap, tidak bisa mengambil citra tanpa live feed.");
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
      if (useFrontCamera) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImagePreview(photoDataUrl);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92)
      );
      if (!blob) {
        setIsCapturing(false);
        setPipelineError("Gagal membuat berkas citra untuk diunggah.");
        return;
      }

      try {
        await uploadBlobForActiveSite(blob);
      } catch (error: any) {
        if (error.message === "qc_failed") {
          setIsCapturing(false);
          // Biarkan preview tetap tampil, tapi render error QC sehingga nakes tau alasan foto ditolak
        }
      } finally {
        setIsCapturing(false);
      }
    }, 350);
  };

  // Unggah dari berkas yang sudah ada (bukan capture langsung dari kamera),
  // dipakai saat kader tidak bisa mengambil foto langsung di lokasi.
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsCapturing(true);
    setPipelineError(null);
    setQcFailureReasons(null);

    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setCapturedImagePreview(previewUrl);

    try {
      await uploadBlobForActiveSite(file);
    } catch {
      // pipelineError sudah diisi uploadBlobForActiveSite
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNextStep = async () => {
    setCapturedImagePreview(null);
    if (activeSite === "conjunctiva") {
      setActiveSite("nail");
      return;
    }
    if (activeSite === "nail") {
      setActiveSite("palm");
      return;
    }

    const organizationId = sessionStorage.getItem("hv_screening_org");
    if (!screeningId || !organizationId || uploads.length < SITE_ORDER.length) {
      setPipelineError("Sesi skrining tidak lengkap, ulangi dari daftar situs.");
      return;
    }

    setIsSubmitting(true);
    setPipelineError(null);
    try {
      await submitRealScreening(screeningId, organizationId, uploads);
      sessionStorage.removeItem("hv_screening_id");
      sessionStorage.removeItem("hv_screening_uploads");
      sessionStorage.removeItem("hv_screening_org");
      sessionStorage.removeItem("hv_screening_patient");
      sessionStorage.removeItem("hv_screening_idempotency_key");
      router.push(`${ROUTES.NAKES.HASIL}?screeningId=${screeningId}&organizationId=${organizationId}`);
    } catch {
      setPipelineError("Gagal mengirim skrining untuk diproses, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSiteTitle = () => {
    switch (activeSite) {
      case "conjunctiva":
        return "Pengambilan Citra Mata";
      case "nail":
        return "Pengambilan Citra Kuku/Jari";
      case "palm":
        return "Pengambilan Citra Telapak Tangan";
    }
  };

  const getSiteInstruction = () => {
    switch (activeSite) {
      case "conjunctiva":
        return "Posisikan mata di dalam area panduan. Pastikan kelopak mata bawah terbuka untuk menampakkan area konjungtiva secara jelas.";
      case "nail":
        return "Letakkan jari telunjuk pasien dengan kuku menghadap kamera. Pastikan kuku berada tepat di dalam kotak panduan putus-putus. Tahan posisi hingga sistem mengunci fokus.";
      case "palm":
        return "Posisikan seluruh permukaan telapak tangan di dalam bingkai panduan. Buka jari-jari dengan tenang & rileks.";
    }
  };

  const STEP_LABELS = ["Data Pasien", "Persiapan", "Mata", "Kuku/Jari", "Telapak", "Analisis"];
  const activeStepIndex = 2 + SITE_ORDER.indexOf(activeSite);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface font-sans text-on-surface p-4 sm:p-6 lg:p-8 gap-4">
      {/* Uniform Top Header Bar for All Sites (Mata, Kuku/Jari, Telapak) */}
      <div className="shrink-0 flex items-center justify-between border-b border-outline pb-4">
        <h1 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
          {getSiteTitle()}
        </h1>

        <div className="flex items-center gap-3">
          <Link
            href={`/nakes/skrining/panduan/${screeningId}?site=${activeSite}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline bg-white hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors shadow-2xs"
          >
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>Panduan Posisi</span>
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center outline outline-1 outline-outline bg-primary-light text-primary-dark font-bold text-xs">
            {nakesInitials}
          </div>
        </div>
      </div>

      {/* Compact Step Indicator (Mobile & Tablet) */}
      <div className="lg:hidden shrink-0 bg-white rounded-xl border border-outline p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
          <span>
            Langkah {activeStepIndex + 1} dari {STEP_LABELS.length}
          </span>
          <span className="font-bold text-primary">{STEP_LABELS[activeStepIndex]}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-outline-variant overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((activeStepIndex + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stepper Card (6 Steps, Desktop Only) */}
      <div className="hidden lg:block shrink-0 w-full bg-white rounded-xl border border-outline p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[768px] flex items-center justify-between relative px-4">
          {/* Step 1: Data Pasien */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-on-surface">Data Pasien</span>
          </div>

          <div className="flex-1 h-[2px] bg-primary mx-2" />

          {/* Step 2: Persiapan */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-on-surface">Persiapan</span>
          </div>

          <div className="flex-1 h-[2px] bg-primary mx-2" />

          {/* Step 3: Mata */}
          <div
            className="flex flex-col items-center gap-2 z-10 cursor-pointer"
            onClick={() => {
              setActiveSite("conjunctiva");
              setCapturedImagePreview(null);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeSite === "conjunctiva"
                  ? "bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2"
                  : capturedSites.includes("conjunctiva")
                  ? "bg-primary text-white"
                  : "bg-white outline outline-2 outline-outline text-on-surface-variant"
              }`}
            >
              {capturedSites.includes("conjunctiva") && activeSite !== "conjunctiva" ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                "3"
              )}
            </div>
            <span className={`text-xs sm:text-sm ${activeSite === "conjunctiva" ? "font-bold text-primary" : "font-medium text-on-surface"}`}>
              Mata
            </span>
          </div>

          <div className={`flex-1 h-[2px] mx-2 ${capturedSites.includes("conjunctiva") || activeSite === "nail" || activeSite === "palm" ? "bg-primary" : "bg-outline"}`} />

          {/* Step 4: Kuku/Jari */}
          <div
            className="flex flex-col items-center gap-2 z-10 cursor-pointer"
            onClick={() => {
              setActiveSite("nail");
              setCapturedImagePreview(null);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeSite === "nail"
                  ? "bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2"
                  : capturedSites.includes("nail")
                  ? "bg-primary text-white"
                  : "bg-white outline outline-2 outline-outline text-on-surface-variant"
              }`}
            >
              {capturedSites.includes("nail") && activeSite !== "nail" ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                "4"
              )}
            </div>
            <span className={`text-xs sm:text-sm ${activeSite === "nail" ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
              Kuku/Jari
            </span>
          </div>

          <div className={`flex-1 h-[2px] mx-2 ${capturedSites.includes("nail") || activeSite === "palm" ? "bg-primary" : "bg-outline opacity-50"}`} />

          {/* Step 5: Telapak */}
          <div
            className="flex flex-col items-center gap-2 z-10 cursor-pointer"
            onClick={() => {
              setActiveSite("palm");
              setCapturedImagePreview(null);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeSite === "palm"
                  ? "bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2"
                  : capturedSites.includes("palm")
                  ? "bg-primary text-white"
                  : "bg-white outline outline-2 outline-outline text-on-surface-variant"
              }`}
            >
              {capturedSites.includes("palm") && activeSite !== "palm" ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                "5"
              )}
            </div>
            <span className={`text-xs sm:text-sm ${activeSite === "palm" ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
              Telapak
            </span>
          </div>

          <div className="flex-1 h-[2px] bg-outline mx-2 opacity-50" />

          {/* Step 6: Analisis */}
          <div className="flex flex-col items-center gap-2 opacity-50 z-10">
            <div className="w-8 h-8 rounded-full bg-white outline outline-2 outline-outline flex items-center justify-center text-on-surface-variant font-bold text-sm">
              6
            </div>
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">Analisis</span>
          </div>
        </div>
      </div>

      {/* Content Layout: Uniform 2 Columns Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Span 4) - Status Perangkat / Status Deteksi Kamera, Instruksi Klinis & Buttons */}
        <div className="lg:col-span-4 space-y-6">
          {/* Instruksi Klinis Card */}
          <div className="bg-primary text-white rounded-xl p-5 border-l-4 border-primary-dark shadow-md space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-6 h-6 text-primary-container shrink-0" />
                <h3 className="text-xl font-bold text-white">Instruksi Klinis</h3>
              </div>
              <p className="text-sm text-primary-container leading-relaxed pl-8">
                {getSiteInstruction()}
              </p>
            </div>

            <div className="pl-8 pt-3 border-t border-primary-dark/30 space-y-2">
              <p className="text-sm font-bold text-white">Standar Kualitas Klinis:</p>
              <ul className="text-xs text-primary-container leading-relaxed space-y-1.5 list-disc pl-4">
                <li><strong className="text-white">Pencahayaan Terang:</strong> Hindari bayangan pada area fokus. Gunakan lampu senter jika ruangan redup.</li>
                <li><strong className="text-white">Fokus & Tajam:</strong> Tunggu hingga kamera mengunci fokus otomatis sebelum menekan tombol ambil gambar.</li>
                <li><strong className="text-white">Posisi Presisi:</strong> Posisikan organ tepat di dalam kotak panduan. Tidak terlalu jauh maupun terlalu dekat.</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {pipelineError && (
              <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
                {pipelineError}
              </div>
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
            {capturedImagePreview && !qcFailureReasons && !isCapturing ? (
              <button
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>
                  {isSubmitting
                    ? "Mengirim untuk dianalisis..."
                    : activeSite === "conjunctiva"
                    ? "Lanjut ke Pemeriksaan Kuku ➔"
                    : activeSite === "nail"
                    ? "Lanjut ke Pemeriksaan Telapak Tangan ➔"
                    : "Lanjutkan ke Analisis AI ➔"}
                </span>
              </button>
            ) : (
              <button
                onClick={handleTakePhoto}
                disabled={isCapturing}
                className="w-full py-4 bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-5 h-5 text-white" />
                <span>
                  {isCapturing && !capturedImagePreview
                    ? "Mengambil Gambar..."
                    : isCapturing
                    ? "Menganalisis..."
                    : activeSite === "conjunctiva"
                    ? "Ambil Gambar"
                    : activeSite === "nail"
                    ? "Ambil Citra Kuku/Jari"
                    : "Ambil Citra Telapak Tangan"}
                </span>
              </button>
            )}

            {!capturedImagePreview && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCapturing}
                  className="w-full py-3.5 bg-white border border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary-container/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Unggah dari Berkas</span>
                </button>
              </>
            )}

            <Link
              href="/nakes/skrining/multisite"
              className="block w-full text-center py-3.5 bg-white border border-primary text-primary font-bold text-sm rounded-xl hover:bg-primary-container/20 transition-all cursor-pointer"
            >
              {activeSite === "conjunctiva" ? "← Kembali" : "Tidak dapat mengambil citra ini"}
            </Link>
          </div>
        </div>

        {/* Right Column (Span 8) - Larger Live Viewfinder Camera Screen for Palm */}
        <div className="lg:col-span-8 space-y-4">
          <div
            className={`relative w-full bg-on-surface rounded-2xl border-4 border-outline-variant overflow-hidden shadow-2xl transition-all duration-300 max-h-[60vh] ${
              activeSite === "palm" ? "h-[46vh] min-h-[360px]" : "aspect-4/3"
            }`}
          >
            {/* Flash effect overlay */}
            {showShutterFlash && (
              <div className="absolute inset-0 bg-white z-50 animate-fade-out" />
            )}

            {/* Torch Flashlight Overlay */}
            {flashEnabled && (
              <div className="absolute inset-0 bg-warning/10 backdrop-brightness-125 z-10 pointer-events-none" />
            )}

            {/* Real HTML5 Live Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                useFrontCamera ? "transform -scale-x-100" : ""
              } ${capturedImagePreview ? "hidden" : "block"}`}
            />

            {/* Captured Photo Snapshot Result */}
            {capturedImagePreview ? (
              <img
                src={capturedImagePreview}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
            ) : !hasWebcam ? (
              /* Fallback Viewfinder Image if Webcam disabled */
              <img
                src={
                  activeSite === "conjunctiva"
                    ? "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?auto=format&fit=crop&w=1000&q=80"
                    : activeSite === "nail"
                    ? "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80"
                    : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80"
                }
                alt="Live Viewfinder"
                className="w-full h-full object-cover opacity-85"
              />
            ) : null}

            {/* Permission Prompt Overlay if camera stream not active */}
            {!hasWebcam && !capturedImagePreview && (
              <div className="absolute inset-0 bg-on-surface/80 flex flex-col items-center justify-center text-white p-6 space-y-4 text-center z-20">
                <Video className="w-12 h-12 text-primary animate-bounce" />
                <h3 className="text-lg font-bold">Kamera Browser Diperlukan</h3>
                <button
                  onClick={startCameraStream}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Aktifkan Kamera Live</span>
                </button>
              </div>
            )}

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_83%_at_50%_50%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.5)_80%)] pointer-events-none" />

            {/* Dynamic Viewfinder Reticle Target */}
            {!capturedImagePreview && (
              <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {activeSite === "palm" ? (
                  <div className="w-[310px] sm:w-[320px] h-[390px] sm:h-[410px] rounded-2xl outline-4 outline-primary-bright outline-offset-[-4px] border-2 border-dashed border-primary-bright opacity-95 shadow-2xl relative overflow-hidden flex items-center justify-center bg-transparent">
                    {/* Center Reticle Crosshair Notch */}
                    <div className="w-5 h-5 absolute top-0 left-1/2 -translate-x-1/2 border-t-2 border-r-2 border-primary-bright" />
                    <div className="w-5 h-5 absolute bottom-0 left-1/2 -translate-x-1/2 border-b-2 border-l-2 border-primary-bright" />
                    {/* Vertical Motion Laser Scanning Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow animate-float-gentle pointer-events-none" />
                  </div>
                ) : activeSite === "nail" ? (
                  <div className="w-[192px] h-[256px] rounded-t-[40px] rounded-b-[16px] border-2 border-white/70 shadow-2xl relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow-sm animate-float-gentle pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-[256px] h-[128px] rounded-xl border-2 border-white/70 shadow-2xl relative overflow-hidden flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    <div className="absolute inset-x-0 h-0.5 bg-tertiary-container-alt shadow-scan-glow-sm animate-float-gentle pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Top Live Feed Badge & Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-2 text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                <span className="text-xs font-mono tracking-wider">
                  LIVE FEED{streamResolution ? `: ${streamResolution}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setUseFrontCamera(!useFrontCamera)}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all cursor-pointer"
                >
                  <SwitchCamera className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all cursor-pointer"
                >
                  <Zap className={`w-5 h-5 ${flashEnabled ? "text-warning fill-warning" : "text-white"}`} />
                </button>
              </div>
            </div>

            {/* Loading Analysis Overlay */}
            {isCapturing && capturedImagePreview && (
              <div className="absolute inset-0 bg-on-surface/60 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-3 z-30">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center shadow-xl">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-bold">Menganalisis Kualitas...</h3>
                <p className="text-sm font-medium opacity-80 text-center max-w-xs">
                  Sedang memeriksa kejernihan dan pencahayaan gambar.
                </p>
              </div>
            )}

            {/* Captured Success Overlay Badge */}
            {!isCapturing && capturedImagePreview && !qcFailureReasons && (
              <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-30">
                <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center text-white shadow-xl animate-bounce">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold">
                  Citra {activeSite === "conjunctiva" ? "MATA" : activeSite === "nail" ? "KUKU/JARI" : "TELAPAK TANGAN"} Berhasil Diambil!
                </h3>
                <button
                  onClick={() => {
                    setCapturedImagePreview(null);
                    setQcFailureReasons(null);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
              </div>
            )}

            {/* Captured Error Overlay Badge */}
            {!isCapturing && capturedImagePreview && qcFailureReasons && (
              <div className="absolute inset-0 bg-error/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-3 z-30 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-error shadow-xl animate-bounce">
                  <AlertTriangle className="w-10 h-10 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold">Kualitas Citra Tidak Memadai</h3>
                <p className="text-sm font-medium opacity-90 max-w-xs">
                  {qcFailureReasons
                    .map((reason) => QC_REASON_LABELS[reason] ?? reason)
                    .join(", ")}
                </p>
                <button
                  onClick={() => {
                    setCapturedImagePreview(null);
                    setQcFailureReasons(null);
                  }}
                  className="mt-4 px-6 py-3 bg-white text-error hover:bg-slate-100 font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ambil Ulang Gambar</span>
                </button>
              </div>
            )}
          </div>

          {/* Patient Info Footer Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-3 py-2 text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  PASIEN
                </span>
                <span className="text-base font-semibold text-on-surface">
                  {patient?.displayName ?? "-"}
                </span>
              </div>
              <div className="border-l border-outline pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  ID
                </span>
                <span className="text-base font-mono text-on-surface">
                  {patient ? patient.id.slice(0, 8).toUpperCase() : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
              <Clock className="w-4 h-4 text-on-surface-variant" />
              <span>Waktu Sesi: {formatTimer(sessionTimer)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
