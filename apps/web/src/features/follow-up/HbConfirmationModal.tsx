"use client";

import React, { useState } from "react";
import { X, FlaskConical, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface LabConfirmationData {
  patientId: string;
  screeningId?: string;
  labHbValue: number;
  testDate: string;
  method: string;
  labFacility: string;
  analystName: string;
  status: "normal" | "mild" | "moderate" | "severe";
  notes?: string;
}

interface HbConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientRm?: string;
  patientId?: string;
  screeningId?: string;
  estimatedAiHb?: number;
  onSave: (data: LabConfirmationData) => void;
}

export function HbConfirmationModal({
  isOpen,
  onClose,
  patientName = "Ny. Siti Marwah",
  patientRm = "RM-2024-09881",
  patientId = "p-002",
  screeningId = "SKR-20261024-0082",
  estimatedAiHb = 10.4,
  onSave,
}: HbConfirmationModalProps) {
  const [labHb, setLabHb] = useState<string>("11.2");
  const [testDate, setTestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = useState("auto_analyzer");
  const [labFacility, setLabFacility] = useState("Laboratorium Puskesmas Kebayoran Baru");
  const [analystName, setAnalystName] = useState("Analis Dian, A.Md.AK");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(labHb);
    if (isNaN(val) || val <= 0) {
      alert("Silakan masukkan nilai Hemoglobin laboratorium yang valid.");
      return;
    }

    setIsSubmitting(true);
    let category: "normal" | "mild" | "moderate" | "severe" = "normal";
    if (val < 7.0) category = "severe";
    else if (val < 10.0) category = "moderate";
    else if (val < 11.0) category = "mild";
    else category = "normal";

    setTimeout(() => {
      onSave({
        patientId,
        screeningId,
        labHbValue: val,
        testDate,
        method:
          method === "auto_analyzer"
            ? "Uji Darah Lengkap (Auto-Analyzer)"
            : "Point-of-Care Fotometri Terstandar",
        labFacility,
        analystName,
        status: category,
        notes,
      });
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full border border-outline shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">
                Input Hasil Konfirmasi Laboratorium
              </h3>
              <p className="text-xs text-on-surface-variant">
                {patientName} • <span className="font-mono">{patientRm}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* AI vs Lab comparison alert */}
          <div className="p-3 bg-surface-container-low rounded-lg border border-outline flex items-center justify-between">
            <span className="text-on-surface-variant">Estimasi Pra-Skrining AI SEHATI:</span>
            <span className="font-bold text-primary font-mono text-sm">
              {estimatedAiHb.toFixed(1)} g/dL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-on-surface block mb-1">
                Kadar Hb Laboratorium (g/dL) *
              </label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="22.0"
                required
                value={labHb}
                onChange={(e) => setLabHb(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:border-primary font-mono"
                placeholder="misal: 11.2"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface block mb-1">
                Tanggal Pemeriksaan *
              </label>
              <input
                type="date"
                required
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">
              Metode Pemeriksaan Laboratorium
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-outline rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary bg-white"
            >
              <option value="auto_analyzer">Uji Darah Lengkap Vena (Hematology Auto-Analyzer)</option>
              <option value="poc_photometry">Point-of-Care Hb Fotometri Terstandar (Microcuvette)</option>
              <option value="cyanmethemoglobin">Metode Rujukan Sianmethemoglobin (ICSH)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-on-surface block mb-1">
                Laboratorium Pelaksana
              </label>
              <input
                type="text"
                value={labFacility}
                onChange={(e) => setLabFacility(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-on-surface block mb-1">
                Petugas Analis / Pemeriksa
              </label>
              <input
                type="text"
                value={analystName}
                onChange={(e) => setAnalystName(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">
              Catatan Validasi Klinis &amp; Terapi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catat kondisi hidrasi, asupan TTD, atau rekomendasi Sp.OG..."
              className="w-full px-3 py-2 border border-outline rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Mandatory Clinical Separation Note */}
          <div className="p-3 bg-surface-container-low rounded border border-outline text-[11px] text-on-surface-variant flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Pemisahan Data Diagnostik:</strong> Nilai Hb Laboratorium dicatat sebagai baku emas (gold standard) dan disimpan berdampingan namun terpisah secara tegas dari estimasi pra-skrining AI.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-outline-variant">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Simpan Hasil Konfirmasi Lab
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
