"use client";

import React, { useEffect, useState } from "react";
import { UserCheck, Check, X as XIcon } from "lucide-react";
import {
  approveClaim,
  Claim,
  getPatientForOrganization,
  listPendingClaims,
  rejectClaim,
} from "@/services/patients";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ClaimRow extends Claim {
  patientDisplayName: string;
}

export default function ClaimRequestsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ claim: ClaimRow; action: "approve" | "reject" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load(orgId: string) {
    setIsLoading(true);
    listPendingClaims(orgId)
      .then(async (pending) => {
        const rows = await Promise.all(
          pending.map(async (claim) => {
            try {
              const patient = await getPatientForOrganization(claim.patientId, orgId);
              return { ...claim, patientDisplayName: patient.displayName };
            } catch {
              return { ...claim, patientDisplayName: "Tidak diketahui" };
            }
          })
        );
        setClaims(rows);
      })
      .catch(() => setLoadError("Gagal memuat daftar permintaan klaim."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    const orgId = sessionStorage.getItem("hv_org_id");
    setOrganizationId(orgId);
    if (!orgId) {
      setLoadError("Sesi organisasi tidak ditemukan, silakan login ulang.");
      setIsLoading(false);
      return;
    }
    load(orgId);
  }, []);

  async function handleConfirm() {
    if (!confirmTarget || !organizationId) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (confirmTarget.action === "approve") {
        await approveClaim(confirmTarget.claim.id);
      } else {
        await rejectClaim(confirmTarget.claim.id);
      }
      setConfirmTarget(null);
      load(organizationId);
    } catch {
      setActionError("Gagal memproses permintaan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
          Permintaan Tarik Data
        </h1>
        <p className="text-sm text-on-surface-variant">
          Pasien yang registrasi mandiri dan meminta riwayat skrining lama mereka ditautkan ke akun baru.
        </p>
      </div>

      {loadError && (
        <div className="p-3 bg-error-container/20 border border-error-container rounded-lg text-sm text-error font-medium">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="p-8 bg-white rounded-xl outline outline-1 outline-outline shadow-sm text-center text-on-surface-variant text-sm">
          Memuat...
        </div>
      ) : claims.length === 0 ? (
        <div className="p-8 bg-white rounded-xl outline outline-1 outline-outline shadow-sm text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
          <UserCheck className="w-8 h-8 text-on-surface-variant" />
          <p>Tidak ada permintaan tarik data yang menunggu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-4 bg-white rounded-xl outline outline-1 outline-outline shadow-sm flex items-center justify-between gap-4"
            >
              <span className="text-sm font-semibold text-on-surface">{claim.patientDisplayName}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<XIcon className="w-4 h-4" />}
                  onClick={() => setConfirmTarget({ claim, action: "reject" })}
                >
                  Tolak
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={() => setConfirmTarget({ claim, action: "approve" })}
                >
                  Setujui
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.action === "approve" ? "Setujui Permintaan" : "Tolak Permintaan"}
        description={confirmTarget?.claim.patientDisplayName}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant={confirmTarget?.action === "approve" ? "primary" : "destructive"}
              size="sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi"}
            </Button>
          </>
        }
      >
        {actionError && <p className="text-sm text-error font-medium mb-2">{actionError}</p>}
        <p className="text-sm text-on-surface-variant">
          {confirmTarget?.action === "approve"
            ? "Riwayat skrining lama pasien ini akan ditautkan ke akun baru mereka."
            : "Permintaan tarik data ini akan ditolak."}
        </p>
      </Modal>
    </div>
  );
}
