"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Info,
  ArrowLeft,
  ArrowRight,
  Frown,
  BatteryLow,
  Activity,
  HelpCircle,
  Wind,
  HeartPulse,
  AlertCircle,
  Check,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface SymptomOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function Step3ScreeningPage() {
  const router = useRouter();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [noSymptoms, setNoSymptoms] = useState<boolean>(false);
  const [otherSymptom, setOtherSymptom] = useState<string>("");

  const symptomsList: SymptomOption[] = [
    { id: "lelah", label: "Mudah lelah", icon: <Frown className="w-6 h-6 text-primary" /> },
    { id: "lemas", label: "Lemas", icon: <BatteryLow className="w-6 h-6 text-primary" /> },
    { id: "pusing", label: "Pusing", icon: <Activity className="w-6 h-6 text-primary" /> },
    { id: "konsentrasi", label: "Sulit konsentrasi", icon: <HelpCircle className="w-6 h-6 text-primary" /> },
    { id: "sesak", label: "Sesak", icon: <Wind className="w-6 h-6 text-primary" /> },
    { id: "jantung", label: "Jantung berdebar", icon: <HeartPulse className="w-6 h-6 text-primary" /> },
    { id: "sakit_kepala", label: "Sakit kepala", icon: <AlertCircle className="w-6 h-6 text-primary" /> },
  ];

  const toggleSymptom = (id: string) => {
    if (noSymptoms) setNoSymptoms(false);
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleToggleNoSymptoms = () => {
    if (!noSymptoms) {
      setSelectedSymptoms([]);
      setNoSymptoms(true);
    } else {
      setNoSymptoms(false);
    }
  };

  const handleNext = () => {
    router.push(ROUTES.PATIENT.SKRINING_PERSIAPAN);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface-container-low to-surface flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[640px] mx-auto space-y-6">
        
        {/* Step Indicator Header (LANGKAH 2 DARI 2) */}
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between">
            <span className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-[0.35px]">
              LANGKAH 2 DARI 2
            </span>
          </div>
          {/* Progress Bar (100% filled with 2 active segments) */}
          <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden flex">
            <div className="w-1/2 h-full bg-primary border-r border-white rounded-l-full transition-all duration-500" />
            <div className="w-1/2 h-full bg-primary rounded-r-full transition-all duration-500" />
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-surface rounded-xl shadow-[0px_4px_24px_rgba(0,0,0,0.04)] border border-outline-variant p-6 sm:p-8 space-y-8">
          
          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-on-surface text-2xl font-semibold leading-8">
              Apakah Ada Gejala yang<br className="hidden sm:inline" /> Anda Rasakan?
            </h1>
            <p className="text-on-surface-variant text-base font-normal leading-6">
              Pilih jika Anda sedang mengalami salah satu kondisi berikut.
            </p>
          </div>

          {/* Grid of Symptoms (2 Columns) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {symptomsList.map((item) => {
              const isSelected = selectedSymptoms.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSymptom(item.id)}
                  className={`p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all cursor-pointer select-none text-center border ${
                    isSelected
                      ? "bg-surface border-2 border-primary shadow-xs"
                      : "bg-surface border-outline hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-center py-1">
                    {item.icon}
                  </div>
                  <span
                    className={`text-sm leading-tight ${
                      isSelected ? "text-primary font-semibold" : "text-on-surface font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-2">
            {/* Checkbox: Tidak ada gejala */}
            <label
              onClick={handleToggleNoSymptoms}
              className={`w-full p-3.5 rounded-lg border flex items-center gap-3 transition-all cursor-pointer select-none ${
                noSymptoms
                  ? "bg-surface border-2 border-primary text-primary font-semibold"
                  : "bg-surface border-outline text-on-surface font-normal hover:border-primary/50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                  noSymptoms
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-outline"
                }`}
              >
                {noSymptoms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-base leading-snug">Tidak ada gejala</span>
            </label>

            {/* Input: Gejala lainnya */}
            <div className="space-y-1.5">
              <label className="block text-on-surface text-sm font-semibold leading-5">
                Gejala lainnya
              </label>
              <input
                type="text"
                value={otherSymptom}
                onChange={(e) => setOtherSymptom(e.target.value)}
                placeholder="Sebutkan jika ada..."
                className="w-full py-3 px-3.5 bg-surface border border-outline rounded-lg text-base text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Info Note Box */}
          <div className="p-3.5 bg-surface-container-low rounded-lg flex items-start gap-2.5 text-sm leading-relaxed text-on-surface-variant">
            <Info className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
            <p className="italic font-medium text-on-surface-variant">
              Gejala tersebut tidak secara otomatis menunjukkan anemia.
            </p>
          </div>

          {/* Action Footer Buttons (Stacked vertically as requested in design mockup) */}
          <div className="space-y-3 pt-2">
            {/* Link button: Lewati untuk sekarang */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full text-center text-on-surface-variant hover:text-on-surface text-sm font-semibold py-2 transition-all cursor-pointer"
            >
              Lewati untuk sekarang
            </button>

            {/* Primary button: Lanjutkan */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <span>Lanjutkan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Outline button: Kembali */}
            <Link
              href={ROUTES.PATIENT.SKRINING_KONDISI}
              className="w-full py-3 px-6 bg-white border border-outline hover:bg-surface text-primary font-semibold text-sm rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}
