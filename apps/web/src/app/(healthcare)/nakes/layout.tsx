import React from "react";
import { HealthcareSidebar } from "@/components/healthcare/HealthcareSidebar";
import { HealthcareHeader } from "@/components/healthcare/HealthcareHeader";

export default function HealthcareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <HealthcareSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <HealthcareHeader />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
