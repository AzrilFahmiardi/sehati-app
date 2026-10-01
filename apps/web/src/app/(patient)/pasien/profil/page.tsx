"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  User,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { auth } from "@/lib/firebase/client";
import { getOwnPatient, getPatientForOrganization, RealPatient } from "@/services/patients";

const SEX_LABELS: Record<string, string> = {
  M: "Laki-laki",
  F: "Perempuan",
};

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-full">
      Segera Hadir
    </span>
  );
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [patient, setPatient] = useState<RealPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOwnPatient()
      .then((owned) => {
        if (!owned) return null;
        return getPatientForOrganization(owned.patientId, owned.organizationId);
      })
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(auth);
    } catch {
      /* lanjutkan keluar meski salah satu langkah gagal */
    }
    sessionStorage.clear();
    router.push(ROUTES.PATIENT.ROOT);
  };

  return (
    <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-8 pb-32">

      {/* SECTION 1: HEADER */}
      <div className="space-y-2">
        <h1 className="text-on-surface text-2xl sm:text-3xl font-bold tracking-tight">
          Profil Pasien
        </h1>
        <p className="text-on-surface-variant text-base font-normal leading-relaxed">
          Kelola informasi pribadi, faktor risiko, dan kontak darurat Anda dengan aman.
        </p>
      </div>

      {/* SECTION 2: MAIN AVATAR & IDENTITAS CARD */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 sm:p-8 text-center space-y-4 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">

        {/* Profile Avatar Image */}
        <div className="relative w-32 h-32 mx-auto">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover group-hover:scale-105 transition-transform duration-300 mx-auto"
          />
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <h2 className="text-on-surface text-2xl font-bold">
            {isLoading ? "Memuat..." : patient?.displayName ?? "Belum terdaftar sebagai pasien"}
          </h2>
        </div>

        {/* Verified Badge */}
        {patient && (
          <div className="pt-2">
            <span className="bg-surface-container text-on-surface text-sm font-medium px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-outline/40 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Akun Terverifikasi</span>
            </span>
          </div>
        )}
      </div>

      {/* SECTION 3: KONTAK DARURAT */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error">
              <PhoneCall className="w-4 h-4 text-error" />
            </div>
            <h3 className="text-on-surface text-xl font-bold">
              Kontak Darurat
            </h3>
          </div>
          <ComingSoonBadge />
        </div>
      </div>

      {/* SECTION 4: DATA DIRI */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 border-b border-outline/60 pb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-on-surface text-xl font-bold">
            Data Diri
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-on-surface-variant text-sm font-semibold block">
              Nama Lengkap
            </label>
            <div className="w-full bg-surface-container-low border border-outline rounded-lg p-3 text-on-surface text-base font-normal">
              {patient?.displayName ?? "-"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-on-surface-variant text-sm font-semibold flex items-center gap-2">
              <span>Nomor Rekam Medis (RM)</span>
              <ComingSoonBadge />
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-on-surface-variant text-sm font-semibold block">
              Usia
            </label>
            <div className="w-full bg-surface-container-low border border-outline rounded-lg p-3 text-on-surface text-base font-normal">
              {patient ? `${calculateAge(patient.dob)} Tahun` : "-"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-on-surface-variant text-sm font-semibold block">
              Gender
            </label>
            <div className="w-full bg-surface-container-low border border-outline rounded-lg p-3 text-on-surface text-base font-normal">
              {patient ? SEX_LABELS[patient.sex] ?? patient.sex : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: FAKTOR RISIKO */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-on-surface text-xl font-bold">
              Faktor Risiko
            </h3>
          </div>
          <ComingSoonBadge />
        </div>
      </div>

      {/* SECTION 6: INFORMASI KESEHATAN */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <span className="text-primary font-semibold text-xs uppercase tracking-wider">
            INFORMASI KESEHATAN
          </span>
          <ComingSoonBadge />
        </div>
      </div>

      {/* SECTION 7: GEJALA SAAT INI */}
      <div className="w-full bg-white rounded-xl border border-outline p-6 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <span className="text-primary font-semibold text-xs uppercase tracking-wider">
            GEJALA SAAT INI
          </span>
          <ComingSoonBadge />
        </div>
      </div>

      {/* SECTION 8: KELUAR AKUN */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full py-3.5 px-4 bg-white border border-error/40 text-error hover:bg-error-container active:scale-[0.99] disabled:opacity-60 font-semibold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>{isLoggingOut ? "Mengeluarkan..." : "Keluar Akun"}</span>
      </button>

    </div>
  );
}
