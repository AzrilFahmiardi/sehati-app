"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phone, setPhone] = useState("");

  const calculateAge = (dateString: string) => {
    if (!dateString) return "";
    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} Tahun` : "";
  };

  const computedAge = calculateAge(birthDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(ROUTES.PATIENT.BERANDA);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-surface-container-low to-surface flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[600px] mx-auto space-y-6">
        
        {/* Section Label */}
        <div className="space-y-2 px-1">
          <span className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-[0.35px]">
            LENGKAPI PROFIL
          </span>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white rounded-xl shadow-[0px_4px_24px_rgba(0,0,0,0.04)] border border-outline/50 p-6 sm:p-8 space-y-8">
          
          {/* Card Title Section */}
          <div className="space-y-2">
            <h1 className="text-on-surface text-2xl font-semibold leading-8">
              Kenali Anda Lebih Baik
            </h1>
            <p className="text-on-surface-variant text-base font-normal leading-6">
              Informasi ini membantu SEHATI memberikan pengalaman skrining yang lebih sesuai.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Field 1: Nama Lengkap */}
            <div className="space-y-2">
              <label className="block text-on-surface text-sm font-medium leading-5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap sesuai identitas"
                className="w-full py-3.5 px-4 bg-surface border border-outline rounded-lg text-base text-on-surface placeholder-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            {/* Field 2 & 3: Tanggal Lahir & Usia */}
            <div className="space-y-6">
              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <label className="block text-on-surface text-sm font-medium leading-5">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full py-3 px-4 bg-surface border border-outline rounded-lg text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  required
                />
              </div>

              {/* Usia (Auto-filled) */}
              <div className="space-y-2">
                <label className="block text-on-surface text-sm font-medium leading-5">
                  Usia
                </label>
                <input
                  type="text"
                  value={computedAge || "Otomatis terisi"}
                  disabled
                  className="w-full py-3.5 px-4 bg-surface-container-high border border-transparent rounded-lg text-base text-on-surface-neutral font-normal cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Field 4: Jenis Kelamin */}
            <div className="space-y-2">
              <label className="block text-on-surface text-sm font-medium leading-5">
                Jenis Kelamin
              </label>
              <div className="w-full p-1 bg-surface-container-high rounded-lg flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex-1 py-2 rounded-md text-center text-sm transition-all ${
                    gender === "male"
                      ? "bg-white text-primary font-bold shadow-xs border border-outline/30"
                      : "text-on-surface-variant font-medium hover:text-on-surface"
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex-1 py-2 rounded-md text-center text-sm transition-all ${
                    gender === "female"
                      ? "bg-white text-primary font-bold shadow-xs border border-outline/30"
                      : "text-on-surface-variant font-medium hover:text-on-surface"
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>

            {/* Field 5: Nomor Telepon */}
            <div className="space-y-2">
              <label className="block text-on-surface text-sm font-medium leading-5">
                Nomor Telepon
              </label>
              <div className="flex items-center w-full">
                <div className="py-3.5 px-4 bg-surface-container-high border border-outline border-r-0 rounded-l-lg text-base text-on-surface-variant font-normal select-none flex-shrink-0">
                  +62
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="812 3456 7890"
                  className="w-full py-3.5 px-4 bg-surface border border-outline rounded-r-lg text-base text-on-surface placeholder-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Divider & Submit Button */}
            <div className="pt-6 border-t border-outline/50 space-y-3">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary-deep active:scale-[0.99] text-white font-bold text-sm leading-5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Simpan dan Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href={ROUTES.PATIENT.BERANDA}
                className="w-full py-3.5 px-4 bg-white border border-outline text-on-surface-variant hover:bg-surface-container-low active:scale-[0.99] font-semibold text-sm leading-5 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              >
                Lewati untuk sekarang
              </Link>
            </div>

          </form>

        </div>

      </div>
    </main>
  );
}
