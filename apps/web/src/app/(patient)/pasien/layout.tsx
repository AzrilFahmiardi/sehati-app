"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { PatientBottomNavigation } from "@/components/patient/PatientBottomNavigation";
import { ROUTES } from "@/lib/routes";

/**
 * Rute yang tampil penuh satu layar, tanpa header atas dan navigasi bawah.
 *
 * Alur pengisian data, pengambilan citra, dan halaman baca panjang sengaja
 * dibuat imersif agar pasien tidak terdistraksi. Halaman selesai tidak masuk
 * daftar ini karena berperan sebagai titik kembali ke navigasi normal.
 *
 * Gerbang pada ROOT ditangani terpisah lewat perbandingan persis, bukan lewat
 * daftar ini, karena startsWith terhadap ROOT akan cocok untuk seluruh rute
 * pasien dan mematikan navigasi di semua halaman.
 */
const FULL_PAGE_ROUTES = [
  ROUTES.PATIENT.PROFIL_LENGKAPI,
  ROUTES.PATIENT.SKRINING_KONDISI,
  ROUTES.PATIENT.SKRINING_GEJALA,
  ROUTES.PATIENT.SKRINING_TINJAU,
  ROUTES.PATIENT.SKRINING_PERSIAPAN,
  ROUTES.PATIENT.SKRINING_PERIKSA_KAMERA,
  ROUTES.PATIENT.SKRINING_CAPTURE,
  ROUTES.PATIENT.SKRINING_PROSES,
  ROUTES.PATIENT.SKRINING_BANTUAN,
  ROUTES.PATIENT.HASIL_DETAIL,
  ROUTES.PATIENT.HASIL_PENJELASAN,
  ROUTES.PATIENT.TINDAK_LANJUT,
  ROUTES.PATIENT.EDUKASI_DETAIL,
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isGate = pathname === ROUTES.PATIENT.ROOT;
  const isFullPage =
    isGate || FULL_PAGE_ROUTES.some((route) => pathname.startsWith(route));

  if (isFullPage) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between relative pb-24">
      <PatientHeader />
      <main className="flex-1 w-full max-w-[640px] mx-auto">{children}</main>
      <PatientBottomNavigation />
    </div>
  );
}
