"use client";

import React, { Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ScreeningGuidanceView,
  ScreeningSiteType,
} from "@/components/screening/ScreeningGuidanceView";

export default function NakesScreeningGuidancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams?.sessionId || "demo-session";

  return (
    <Suspense fallback={<GuidanceLoadingSkeleton />}>
      <NakesScreeningGuidanceContent sessionId={sessionId} />
    </Suspense>
  );
}

function NakesScreeningGuidanceContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const siteParam = searchParams.get("site");
  const initialSite: ScreeningSiteType =
    siteParam === "nail" || siteParam === "palm" || siteParam === "conjunctiva"
      ? siteParam
      : "conjunctiva";

  const patientId =
    searchParams.get("patientId") ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("hv_screening_patient")
      : null);
  const organizationId =
    searchParams.get("organizationId") ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("hv_screening_org")
      : null);

  const backHref =
    patientId && organizationId
      ? `/nakes/skrining/multisite?patientId=${patientId}&organizationId=${organizationId}`
      : "/nakes/skrining/multisite";

  const handleProceedToCamera = (site: ScreeningSiteType) => {
    router.push(`/capture/${sessionId}?site=${site}`);
  };

  return (
    <ScreeningGuidanceView
      initialSite={initialSite}
      sessionId={sessionId}
      patientId={patientId}
      organizationId={organizationId}
      onProceedToCamera={handleProceedToCamera}
      backHref={backHref}
    />
  );
}

function GuidanceLoadingSkeleton() {
  return (
    <div className="w-full min-h-screen bg-surface p-6 space-y-6 animate-pulse font-sans">
      <div className="h-16 bg-surface-container rounded-xl w-full" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-20 bg-surface-container rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 bg-surface-container rounded-2xl" />
          <div className="lg:col-span-7 h-96 bg-surface-container rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
