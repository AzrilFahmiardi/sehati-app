"use client";

import React from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md z-50 sticky top-0"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Tidak ada koneksi internet. Beberapa fungsi SEHATI memerlukan koneksi untuk memproses data skrining.
      </span>
    </div>
  );
}
