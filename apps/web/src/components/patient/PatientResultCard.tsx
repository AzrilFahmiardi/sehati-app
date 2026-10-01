import React from "react";
import Link from "next/link";
import { ScreeningResult } from "@/types/result";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { PatientRiskBadge } from "../ui/Badge";
import { formatHb } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

export function PatientResultCard({ result }: { result: ScreeningResult }) {
  return (
    <Card className="overflow-hidden border-primary-container shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-primary-container">
            Hasil Skrining Terakhir
          </span>
          <PatientRiskBadge risk={result.riskLevel} />
        </div>
        <CardTitle className="text-white text-xl mt-2">
          Estimasi Skrining Hb: <span className="font-mono">{formatHb(result.estimatedHb)}</span>
        </CardTitle>
        <p className="text-xs text-primary-container mt-1">
          Kadar estimasi berbasis citra non-invasif (bukan diagnosis lab).
        </p>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
          <strong className="block text-slate-900 font-bold mb-1">Rekomendasi Skrining:</strong>
          {result.recommendation}
        </div>

        {result.requiresConfirmation && (
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Diperlukan tes darah laboratorium langsung di Fasilitas Kesehatan terdekat untuk memastikan kadar hemoglobin Anda.
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 bg-slate-50 border-t border-slate-100">
        <Link href={ROUTES.PATIENT.TINDAK_LANJUT} className="w-full">
          <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Lihat Panduan Tindak Lanjut
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
