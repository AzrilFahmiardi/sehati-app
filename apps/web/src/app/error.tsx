"use client";

import { useEffect } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Batas galat bawaan untuk seluruh rute.
 *
 * Pesan yang ditampilkan sengaja tidak memuat isi galat teknis, karena pada konteks
 * klinis pesan seperti itu tidak dapat ditindaklanjuti pengguna dan berpotensi
 * membocorkan detail internal. Yang ditampilkan adalah kode digest yang dapat
 * disebutkan pengguna saat melapor, sehingga tetap dapat ditelusuri operator.
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="danger" title="Terjadi gangguan saat memuat halaman">
          Silakan coba muat ulang. Jika gangguan berulang, catat kode di bawah dan
          sampaikan kepada admin fasilitas kesehatan Anda.
          {error.digest && (
            <span className="mt-2 block font-mono text-xs opacity-80">
              Kode: {error.digest}
            </span>
          )}
        </Alert>
        <Button variant="primary" onClick={reset} className="w-full">
          Coba lagi
        </Button>
      </div>
    </div>
  );
}
