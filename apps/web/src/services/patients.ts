import { MOCK_PATIENTS } from "@/data/mock/patients";
import { Patient } from "@/types/patient";
import { apiFetch } from "@/services/screening";

export async function getPatientById(id: string): Promise<Patient | null> {
  const patient = MOCK_PATIENTS.find((p) => p.id === id);
  return Promise.resolve(patient || null);
}

export interface RealPatient {
  id: string;
  displayName: string;
  dob: string;
  sex: "M" | "F";
}

export interface CreateRealPatientInput {
  organizationId: string;
  displayName: string;
  nik: string;
  dob: string;
  sex: "M" | "F";
}

export class NikAlreadyRegisteredError extends Error {
  constructor() {
    super("NIK sudah terdaftar pada pasien lain");
    this.name = "NikAlreadyRegisteredError";
  }
}

export async function createPatientForOrganization(
  input: CreateRealPatientInput
): Promise<{ patientId: string }> {
  const response = await apiFetch("/v1/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organizationId,
      display_name: input.displayName,
      nik: input.nik,
      dob: input.dob,
      sex: input.sex,
    }),
  });
  if (response.status === 409) {
    throw new NikAlreadyRegisteredError();
  }
  if (!response.ok) {
    throw new Error("Gagal membuat pasien");
  }
  const body = await response.json();
  return { patientId: body.patient_id };
}

export async function listPatientsForOrganization(organizationId: string): Promise<RealPatient[]> {
  try {
    const response = await apiFetch(`/v1/patients?organization_id=${organizationId}`);
    if (!response.ok) {
      throw new Error("Gagal membaca daftar pasien");
    }
    const body = await response.json();
    return body.map((patient: { id: string; display_name: string; dob: string; sex: "M" | "F" }) => ({
      id: patient.id,
      displayName: patient.display_name,
      dob: patient.dob,
      sex: patient.sex,
    }));
  } catch {
    return MOCK_PATIENTS.map((p) => ({
      id: p.id,
      displayName: p.name,
      dob: p.dateOfBirth,
      sex: p.sex === "male" ? "M" : "F",
    }));
  }
}

export async function getPatientForOrganization(
  patientId: string,
  organizationId: string
): Promise<RealPatient> {
  const response = await apiFetch(`/v1/patients/${patientId}?organization_id=${organizationId}`);
  if (!response.ok) {
    throw new Error("Gagal membaca data pasien");
  }
  const body = await response.json();
  return { id: body.id, displayName: body.display_name, dob: body.dob, sex: body.sex };
}

export interface OwnedPatient {
  patientId: string;
  organizationId: string;
  organizationPath: string;
}

export async function getOwnPatient(): Promise<OwnedPatient | null> {
  const response = await apiFetch("/v1/patients/me");
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Gagal membaca data pasien milik sendiri");
  }
  const body = await response.json();
  return {
    patientId: body.patient_id,
    organizationId: body.organization_id,
    organizationPath: body.organization_path,
  };
}

export type ClaimStatus = "offered" | "pending" | "approved" | "rejected";

export interface Claim {
  id: string;
  patientId: string;
  status: ClaimStatus;
}

function toClaim(body: { id: string; patient_id: string; status: ClaimStatus }): Claim {
  return { id: body.id, patientId: body.patient_id, status: body.status };
}

export async function getMyClaim(): Promise<Claim | null> {
  const response = await apiFetch("/v1/patients/claims/me");
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Gagal membaca status permintaan klaim");
  }
  return toClaim(await response.json());
}

export async function requestClaim(claimId: string): Promise<Claim> {
  const response = await apiFetch(`/v1/patients/claims/${claimId}/request`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Gagal mengajukan permintaan tarik data");
  }
  return toClaim(await response.json());
}

export async function listPendingClaims(organizationId: string): Promise<Claim[]> {
  const response = await apiFetch(`/v1/patients/claims?organization_id=${organizationId}`);
  if (!response.ok) {
    throw new Error("Gagal membaca daftar permintaan klaim");
  }
  const body = await response.json();
  return body.map(toClaim);
}

export async function approveClaim(claimId: string): Promise<Claim> {
  const response = await apiFetch(`/v1/patients/claims/${claimId}/approve`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Gagal menyetujui permintaan klaim");
  }
  return toClaim(await response.json());
}

export async function rejectClaim(claimId: string): Promise<Claim> {
  const response = await apiFetch(`/v1/patients/claims/${claimId}/reject`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Gagal menolak permintaan klaim");
  }
  return toClaim(await response.json());
}
