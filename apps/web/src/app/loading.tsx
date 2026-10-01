import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Keadaan memuat bawaan untuk seluruh rute.
 *
 * Bentuknya sengaja menyerupai kerangka kartu dan tabel agar pergeseran tata letak
 * saat konten sungguhan tiba terasa kecil, bukan berupa pemuat berputar yang tidak
 * memberi petunjuk apa pun tentang isi yang sedang disiapkan.
 */
export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat konten</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
