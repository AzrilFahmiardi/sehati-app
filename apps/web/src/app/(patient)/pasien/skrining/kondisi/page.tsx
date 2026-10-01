"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Info, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function Step2ScreeningPage() {
  const router = useRouter();

  // State for Q1: Diagnosis Anemia (Single select)
  const [anemiaHistory, setAnemiaHistory] = useState<string>("Tidak");

  // State for Q2: Conditions (Multi select)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  // State for Q3: Medication/Supplement (Single select)
  const [takingMedication, setTakingMedication] = useState<string>("Tidak");

  // State for Q4: Pregnancy Trimester
  const [pregnancyTrimester, setPregnancyTrimester] = useState<string>("");

  const conditionsList = [
    "Penyakit Ginjal Kronis",
    "Penyakit hati kronis",
    "Talasemia atau kelainan darah bawaan",
    "Penyakit Autoimun",
    "Riwayat Kanker / sedang menjalani kemoterapi",
    "Riwayat perdarahan kronis (seperti BAB hitam, muntah darah, atau menstruasi sangat banyak)",
    "Gangguan Pendarahan",
    "Tidak ada / Tidak yakin",
  ];

  const toggleCondition = (item: string) => {
    if (item === "Tidak ada / Tidak yakin") {
      setSelectedConditions(["Tidak ada / Tidak yakin"]);
      return;
    }
    const filtered = selectedConditions.filter((c) => c !== "Tidak ada / Tidak yakin");
    if (filtered.includes(item)) {
      setSelectedConditions(filtered.filter((c) => c !== item));
    } else {
      setSelectedConditions([...filtered, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(ROUTES.PATIENT.SKRINING_GEJALA);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface-container-low to-surface flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[640px] mx-auto space-y-6">
        
        {/* Step Indicator Header (LANGKAH 1 DARI 2) */}
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between">
            <span className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-[0.35px]">
              LANGKAH 1 DARI 2
            </span>
          </div>
          {/* Progress Bar (50% filled) */}
          <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden flex">
            <div className="w-1/2 h-full bg-primary rounded-full transition-all duration-500" />
            <div className="w-1/2 h-full bg-transparent" />
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white rounded-xl shadow-[0px_4px_24px_rgba(0,0,0,0.04)] border border-outline/50 p-6 sm:p-8 space-y-8">
          
          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-on-surface text-2xl font-semibold leading-8">
              Informasi Kesehatan
            </h1>
            <p className="text-on-surface-variant text-base font-normal leading-6">
              Beberapa informasi berikut membantu memberikan konteks terhadap proses skrining Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Question 1: Diagnosis Anemia Sebelumnya */}
            <div className="space-y-3">
              <label className="block text-on-surface text-sm font-semibold leading-5">
                Apakah Anda pernah didiagnosis anemia sebelumnya?
              </label>
              <div className="space-y-2">
                {["Ya", "Tidak", "Tidak Tahu"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnemiaHistory(option)}
                    className={`w-full py-3 px-4 rounded-lg text-center text-base transition-all cursor-pointer border ${
                      anemiaHistory === option
                        ? "bg-surface border-primary text-primary font-semibold shadow-xs ring-1 ring-primary"
                        : "bg-white border-outline text-on-surface-variant font-normal hover:bg-surface"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-outline/30" />

            {/* Question 2: Kondisi Kesehatan Tertentu */}
            <div className="space-y-3">
              <div>
                <label className="block text-on-surface text-sm font-semibold leading-5">
                  Apakah Anda memiliki kondisi kesehatan tertentu?
                </label>
                <p className="text-on-surface-variant text-sm font-normal leading-5 mt-1">
                  Pilih semua yang sesuai.
                </p>
              </div>

              <div className="space-y-2">
                {conditionsList.map((item) => {
                  const isChecked = selectedConditions.includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleCondition(item)}
                      className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-surface border-primary text-on-surface font-medium"
                          : "bg-white border-outline/60 text-on-surface font-normal hover:bg-surface"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                          isChecked
                            ? "bg-primary border-primary text-white"
                            : "bg-white border-outline"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-outline/30" />

            {/* Question 3: Pengobatan atau Suplemen */}
            <div className="space-y-3">
              <label className="block text-on-surface text-sm font-semibold leading-5">
                Apakah Anda sedang menjalani pengobatan atau suplemen?
              </label>
              <div className="flex items-center gap-6">
                {["Ya", "Tidak"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="takingMedication"
                      value={option}
                      checked={takingMedication === option}
                      onChange={() => setTakingMedication(option)}
                      className="w-4 h-4 text-primary border-outline focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-base text-on-surface font-normal">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 4: Trimester Kehamilan */}
            <div className="space-y-2">
              <label className="block text-on-surface text-sm font-semibold leading-5">
                Jika Anda sedang hamil, sedang di trimester berapa?
              </label>
              <input
                type="text"
                value={pregnancyTrimester}
                onChange={(e) => setPregnancyTrimester(e.target.value)}
                placeholder="Masukkan trimester"
                className="w-full py-3.5 px-4 bg-surface border border-outline rounded-lg text-base text-on-surface placeholder-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Disclaimer Box */}
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg flex items-start gap-3 text-sm leading-relaxed text-on-surface-variant">
              <Info className="w-5 h-5 text-on-surface-muted flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-on-surface font-semibold">Catatan:</strong> Informasi ini bukan diagnosis tunggal dan hanya digunakan untuk melengkapi data penunjang analisis laboratorium Anda.
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className="pt-4 border-t border-outline flex items-center justify-between gap-4">
              <Link
                href={ROUTES.PATIENT.SKRINING}
                className="flex-1 py-3 px-4 bg-white border border-outline hover:bg-surface text-primary font-semibold text-sm rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </Link>
              
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>

      </div>
    </main>
  );
}
