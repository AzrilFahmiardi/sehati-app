import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/lib/routes";

/**
 * Halaman untuk alamat yang tidak dikenali.
 *
 * Memakai komponen EmptyState yang sudah ada agar bahasa visualnya konsisten dengan
 * keadaan kosong di dalam aplikasi, bukan halaman galat yang terasa berasal dari
 * sistem lain.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <EmptyState
          icon={<FileQuestion className="w-12 h-12 text-slate-300" />}
          title="Halaman tidak ditemukan"
          description="Alamat yang Anda tuju tidak tersedia. Kemungkinan tautannya sudah berubah atau salah ketik."
        />
        <div className="text-center">
          <Link
            href={ROUTES.PUBLIC.HOME}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
