"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { ArrowLeft } from "lucide-react";

export function PatientHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const showBackButton = pathname.startsWith("/pasien/tindak-lanjut");

  return (
    <header className="bg-surface border-b border-outline sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2.5">
        {showBackButton && (
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/70 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
        )}
        <Link href={ROUTES.PATIENT.BERANDA} className="flex items-center gap-2">
          <span className="font-bold text-primary text-2xl tracking-tight leading-8">
            SEHATI
          </span>
        </Link>
      </div>

      <Link
        href={ROUTES.PATIENT.PROFIL}
        className="w-8 h-8 rounded-full overflow-hidden border border-outline hover:opacity-90 transition-opacity flex-shrink-0"
        aria-label="Profil Saya"
      >
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </Link>
    </header>
  );
}
