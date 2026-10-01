"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

interface PatientHeaderBannerProps {
  name?: string;
  medicalRecordNumber?: string;
  age?: number;
  sex?: string;
  startScreeningHref?: string;
}

export function PatientHeaderBanner({
  name = "-",
  medicalRecordNumber = "-",
  age,
  sex,
  startScreeningHref = ROUTES.NAKES.SKRINING_BARU,
}: PatientHeaderBannerProps) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="w-full bg-white pt-6 px-6 sm:px-8 pb-8">
      <div className="w-full flex flex-col gap-8">
        {/* Main Info Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          {/* Avatar and Patient Info */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar Box */}
            <div className="w-24 h-24 rounded-2xl outline outline-2 outline-blue-600 outline-offset-[-2px] shadow-sm shrink-0 bg-primary-container flex items-center justify-center text-primary-darkest text-2xl font-bold">
              {initials}
            </div>

            {/* Content Column */}
            <div className="flex flex-col gap-3">
              {/* Name & ID Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-[32px] font-semibold text-on-surface leading-10">
                  {name}
                </h1>
                <span className="px-3 py-0.5 bg-surface-container-high text-on-surface-variant text-xs font-medium font-mono rounded-full">
                  {medicalRecordNumber}
                </span>
              </div>

              {/* Tag Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {age !== undefined && (
                  <span className="px-3 py-1 bg-primary-container text-primary-darkest text-xs font-bold rounded-lg">
                    {age >= 18 ? "Dewasa" : "Anak-anak"}
                  </span>
                )}
                {age !== undefined && (
                  <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg">
                    {age} Tahun
                  </span>
                )}
                {sex && (
                  <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg">
                    {sex}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link href={startScreeningHref}>
            <Button type="button" size="lg" className="shrink-0" leftIcon={<PlusCircle className="w-5 h-5" />}>
              Mulai Skrining Baru
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
