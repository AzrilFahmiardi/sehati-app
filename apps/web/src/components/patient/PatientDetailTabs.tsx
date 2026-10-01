"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PatientDetailTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "riwayat", label: "Riwayat Skrining" },
  { id: "tindak-lanjut", label: "Tindak Lanjut" },
  { id: "laporan", label: "Laporan" },
];

export function PatientDetailTabs({
  activeTab = "ringkasan",
  onTabChange,
}: PatientDetailTabsProps) {
  return (
    <div className="w-full bg-white border-b border-outline px-6 sm:px-8">
      <div className="w-full flex items-center gap-10 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                "relative pb-4 pt-3 px-2 text-base transition-colors cursor-pointer whitespace-nowrap",
                isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant font-normal hover:text-on-surface"
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
