"use client";

import React, { useState, useEffect, use } from "react";
import { getPatientForOrganization, RealPatient } from "@/services/patients";
import { listScreenings, ScreeningSummary } from "@/services/screening";
import { PatientHeaderBanner } from "@/components/patient/PatientHeaderBanner";
import { PatientDetailTabs } from "@/components/patient/PatientDetailTabs";
import { LastResultCard } from "@/components/patient/LastResultCard";
import { HemoglobinTrendCard } from "@/components/patient/HemoglobinTrendCard";
import { RecommendedActionsCard } from "@/components/patient/RecommendedActionsCard";
import { RiskFactorsCard } from "@/components/patient/RiskFactorsCard";
import { CurrentSymptomsCard } from "@/components/patient/CurrentSymptomsCard";
import { RecentActivitiesCard } from "@/components/patient/RecentActivitiesCard";
import { ScreeningHistoryList } from "@/components/screening/ScreeningHistoryList";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams?.patientId || "ID-9921";
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [patient, setPatient] = useState<RealPatient | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [screeningsLoaded, setScreeningsLoaded] = useState(false);

  useEffect(() => {
    const orgId = sessionStorage.getItem("hv_org_id");
    setOrganizationId(orgId);
    if (!orgId) return;
    getPatientForOrganization(patientId, orgId)
      .then(setPatient)
      .catch(() => setPatient(null));
  }, [patientId]);

  useEffect(() => {
    if (!organizationId || screeningsLoaded) return;
    listScreenings(organizationId, patientId)
      .then((result) => {
        setScreenings(result);
        setScreeningsLoaded(true);
      })
      .catch(() => setScreeningsLoaded(true));
  }, [organizationId, patientId, screeningsLoaded]);

  const displayAge = patient
    ? new Date().getFullYear() - new Date(patient.dob).getFullYear()
    : undefined;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Patient Header Banner */}
      <PatientHeaderBanner
        name={patient?.displayName}
        medicalRecordNumber={patientId.startsWith("ID-") ? patientId : `ID-${patientId}`}
        age={displayAge}
        sex={patient ? (patient.sex === "M" ? "Laki-laki" : "Perempuan") : undefined}
        startScreeningHref={
          organizationId
            ? `/nakes/skrining/multisite?patientId=${patientId}&organizationId=${organizationId}`
            : undefined
        }
      />

      {/* Tabs Navigation */}
      <PatientDetailTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-6 sm:px-8 py-8 sm:py-10 w-full space-y-8">
        {activeTab === "ringkasan" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {screeningsLoaded ? (
              <>
                <LastResultCard
                  screening={
                    [...screenings]
                      .filter((s) => s.status === "completed")
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
                  }
                />
                <HemoglobinTrendCard screenings={screenings} />
              </>
            ) : (
              <>
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </>
            )}
            <RecommendedActionsCard />
            <RiskFactorsCard />
            <CurrentSymptomsCard />
            {screeningsLoaded ? (
              <RecentActivitiesCard screenings={screenings} />
            ) : (
              <Skeleton className="h-64 rounded-xl" />
            )}
          </div>
        )}

        {activeTab === "riwayat" && organizationId && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface">Riwayat Skrining Pasien</h3>
            {!screeningsLoaded ? (
              <TableSkeleton columns={4} />
            ) : (
              <ScreeningHistoryList
                screenings={screenings}
                showPatientColumn={false}
                organizationId={organizationId}
              />
            )}
          </div>
        )}

        {activeTab === "tindak-lanjut" && (
          <div className="p-8 bg-white rounded-xl outline outline-1 outline-outline shadow-sm text-center text-slate-600">
            <h3 className="text-lg font-bold text-on-surface">Rencana Tindak Lanjut</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Daftar rekomendasi intervensi medis dan jadwal kontrol ulang.
            </p>
          </div>
        )}

        {activeTab === "laporan" && (
          <div className="p-8 bg-white rounded-xl outline outline-1 outline-outline shadow-sm text-center text-slate-600">
            <h3 className="text-lg font-bold text-on-surface">Laporan Hasil Lab & AI</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Unduh atau cetak laporan diagnostik lengkap SEHATI.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
