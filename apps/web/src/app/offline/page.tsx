import React from "react";
import Link from "next/link";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/Button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineFallbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <AppContainer size="narrow" className="flex flex-col items-center gap-4">
        <div className="p-4 bg-amber-100 text-amber-700 rounded-full">
          <WifiOff className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Anda sedang Offline</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Koneksi internet Anda saat ini terputus. Beberapa fitur skrining dan pengolahan citra SEHATI memerlukan koneksi server aktif.
        </p>
        <Link href="/" className="mt-2">
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Coba Muat Ulang
          </Button>
        </Link>
      </AppContainer>
    </main>
  );
}
