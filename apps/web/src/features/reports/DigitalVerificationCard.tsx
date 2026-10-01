"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, PenTool, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface DigitalSignatureData {
  signerName: string;
  signerRole: string;
  facilityName: string;
  signedAt: string;
}

interface DigitalVerificationCardProps {
  screeningId?: string;
  timestamp?: string;
  nakesName?: string;
  facilityName?: string;
  modelHash?: string;
  isSigned?: boolean;
  signatureData?: DigitalSignatureData | null;
  onSign?: () => Promise<void> | void;
}

export function DigitalVerificationCard({
  screeningId = "SEHATI-SCR-0000",
  timestamp,
  nakesName = "Tenaga Kesehatan",
  facilityName = "Fasilitas Kesehatan",
  modelHash = "hemavision-multisite-v1",
  isSigned = false,
  signatureData,
  onSign,
}: DigitalVerificationCardProps) {
  const [signed, setSigned] = useState(isSigned);
  const [signing, setSigning] = useState(false);

  const displayTimestamp = timestamp ?? new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + " WIB";

  const handleSign = async () => {
    setSigning(true);
    try {
      await onSign?.();
      setSigned(true);
    } catch {
      setSigning(false);
    }
  };

  const effectivelySigned = signed || !!signatureData;

  return (
    <div className="bg-white rounded-xl border border-outline shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
            Lembar Verifikasi Digital
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
          Tervalidasi Sistem
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
          <span className="text-on-surface-variant">ID Sesi Skrining</span>
          <span className="font-mono font-bold text-on-surface">{screeningId}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
          <span className="text-on-surface-variant">Waktu Komputasi</span>
          <span className="font-mono text-on-surface">{displayTimestamp}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
          <span className="text-on-surface-variant">Nakes Pemeriksa</span>
          <span className="font-semibold text-on-surface">{nakesName}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-outline-variant/40">
          <span className="text-on-surface-variant">Faskes Pelaksana</span>
          <span className="text-on-surface">{facilityName}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-on-surface-variant">AI Model Hash</span>
          <span className="font-mono text-[11px] text-on-surface-variant">{modelHash}</span>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border border-emerald-500 bg-white flex items-center justify-center shrink-0">
            {effectivelySigned ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            ) : (
              <PenTool className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <div>
            <span className="font-bold text-xs text-on-surface block">
              Tanda Tangan Elektronik
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {effectivelySigned ? "Tertanda sah secara digital" : "Siap Ditandatangani Nakes"}
            </span>
          </div>
        </div>

        <div>
          {effectivelySigned ? (
            <span className="px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ditandatangani</span>
            </span>
          ) : (
            <Button variant="primary" size="sm" onClick={handleSign} isLoading={signing}>
              Tanda Tangani
            </Button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant/80 leading-relaxed text-center">
        Dokumen ini diterbitkan secara elektronik untuk rekam medis terpadu sesuai standar interoperabilitas CDSS Kemenkes RI.
      </p>
    </div>
  );
}
