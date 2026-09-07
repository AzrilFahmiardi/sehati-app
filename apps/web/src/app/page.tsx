import React from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Stethoscope, UserCheck, ArrowRight } from "lucide-react";

export default function RootHomePage() {
  return (
    <main className="w-full min-h-screen bg-surface font-sans text-on-surface flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-3">
        <img
          src="/sehati-logo.png"
          alt="SEHATI Logo"
          className="w-16 h-16 object-contain"
        />
        <span className="text-primary font-bold text-2xl tracking-tight">SEHATI</span>

        <h1 className="text-xl sm:text-2xl font-bold text-on-surface leading-snug tracking-tight pt-2">
          Kenali Risiko Anemia Lebih Awal
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
          Akses hasil skrining, riwayat pemeriksaan, dan rekomendasi tindak lanjut Anda dalam satu tempat.
        </p>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4 mt-10">
        <Link
          href={ROUTES.PUBLIC.LOGIN_NAKES}
          className="flex items-center gap-4 p-5 bg-white border border-outline rounded-2xl hover:border-primary transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-primary-container text-primary flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-on-surface">Tenaga Kesehatan</p>
            <p className="text-xs text-on-surface-variant">Kelola pasien dan sesi skrining</p>
          </div>
          <ArrowRight className="w-4 h-4 text-on-surface-muted" />
        </Link>

        <Link
          href={ROUTES.PATIENT.ROOT}
          className="flex items-center gap-4 p-5 bg-white border border-outline rounded-2xl hover:border-primary transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-primary-container text-primary flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-on-surface">Pasien</p>
            <p className="text-xs text-on-surface-variant">Lihat hasil dan riwayat skrining Anda</p>
          </div>
          <ArrowRight className="w-4 h-4 text-on-surface-muted" />
        </Link>
      </div>

      <p className="text-xs text-on-surface-muted text-center leading-normal px-2 mt-10 max-w-md">
        SEHATI merupakan alat bantu skrining awal dan tidak menggantikan diagnosis tenaga kesehatan.
      </p>
    </main>
  );
}
