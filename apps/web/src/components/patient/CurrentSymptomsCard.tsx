"use client";

import React from "react";
import { UserCheck, Activity } from "lucide-react";

const SYMPTOMS = ["Kelelahan", "Pusing"];

export function CurrentSymptomsCard() {
  return (
    <div className="h-full bg-surface-container-low rounded-xl outline outline-1 outline-outline p-6 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-tertiary" />
        <h3 className="text-base font-bold text-on-surface">
          Gejala Terkini
        </h3>
      </div>

      {/* Symptom Chips */}
      <div className="flex flex-wrap items-center gap-3">
        {SYMPTOMS.map((symptom) => (
          <div
            key={symptom}
            className="px-4 py-2 bg-white rounded-lg outline outline-1 outline-outline shadow-sm flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-on-surface">{symptom}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
