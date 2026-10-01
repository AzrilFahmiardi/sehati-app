"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { Home, FileBarChart2, History, BookOpen, User } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const PATIENT_NAV_ITEMS: NavItem[] = [
  { label: "Beranda", href: ROUTES.PATIENT.BERANDA, icon: Home },
  { label: "Skrining", href: ROUTES.PATIENT.SKRINING, icon: FileBarChart2 },
  { label: "Riwayat", href: ROUTES.PATIENT.RIWAYAT, icon: History },
  { label: "Edukasi", href: ROUTES.PATIENT.EDUKASI, icon: BookOpen },
  { label: "Profil", href: ROUTES.PATIENT.PROFIL, icon: User },
];

export function PatientBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline/40 shadow-[0px_-2px_10px_rgba(0,0,0,0.05)] p-3">
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between">
        {PATIENT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === ROUTES.PATIENT.BERANDA
              ? pathname === ROUTES.PATIENT.BERANDA
              : pathname.startsWith(item.href) ||
                (item.href === ROUTES.PATIENT.SKRINING &&
                  (pathname.startsWith(ROUTES.PATIENT.HASIL) ||
                    pathname.startsWith(ROUTES.PATIENT.TINDAK_LANJUT)));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[64px] min-h-[52px]",
                isActive
                  ? "bg-tertiary-container text-tertiary-alt font-medium shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface font-medium"
              )}
            >
              <Icon
                className={cn(
                  "w-[18px] h-[18px] transition-transform",
                  isActive ? "text-tertiary-alt stroke-[2.2]" : "text-on-surface-variant stroke-[1.8]"
                )}
              />
              <span className="text-[13px] sm:text-sm leading-tight text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
