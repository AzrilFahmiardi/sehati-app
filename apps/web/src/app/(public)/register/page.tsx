"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { AppContainer } from "@/components/layout/AppContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { auth } from "@/lib/firebase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [nik, setNik] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("F");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{16}$/.test(nik)) {
      setError("NIK harus 16 digit angka");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/patients/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ display_name: displayName, nik, dob, sex }),
        }
      );
      if (!registerResponse.ok) {
        const body = await registerResponse.json().catch(() => null);
        throw new Error(body?.detail ?? "Registrasi gagal");
      }
      const registered = (await registerResponse.json()) as {
        patient_id: string | null;
        organization_id: string | null;
        has_pending_claim_offer: boolean;
      };

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        throw new Error("Gagal membuat sesi");
      }

      if (registered.has_pending_claim_offer) {
        router.push(ROUTES.PATIENT.BERANDA);
        return;
      }

      sessionStorage.setItem("hv_patient_id", registered.patient_id ?? "");
      sessionStorage.setItem("hv_org_id", registered.organization_id ?? "");
      router.push(ROUTES.PATIENT.PROFIL_LENGKAPI);
    } catch (submitError) {
      const code = (submitError as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar");
      } else if (submitError instanceof Error && submitError.message === "Email sudah terdaftar") {
        setError("Email sudah terdaftar");
      } else if (submitError instanceof Error && submitError.message === "NIK sudah terdaftar") {
        setError("NIK sudah terdaftar");
      } else {
        setError("Registrasi gagal, periksa kembali data Anda");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <AppContainer size="narrow">
        <Card className="p-6 bg-white border-outline space-y-6 shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-on-surface">Daftar Akun Pasien</h1>
            <p className="text-xs text-on-surface-variant">Untuk melihat hasil skrining dan riwayat Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              placeholder="Nama lengkap"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
            <Input
              label="NIK"
              placeholder="16 digit NIK"
              inputMode="numeric"
              maxLength={16}
              value={nik}
              onChange={(event) => setNik(event.target.value)}
              required
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
              required
            />
            <Select
              label="Jenis Kelamin"
              value={sex}
              onChange={(event) => setSex(event.target.value)}
              options={[
                { label: "Perempuan", value: "F" },
                { label: "Laki-laki", value: "M" },
              ]}
            />
            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Input
              label="Konfirmasi Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            {error && <p className="text-sm text-error font-medium">{error}</p>}

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Mendaftarkan..." : "Daftar Akun"}
            </Button>
          </form>

          <div className="text-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant">
            Sudah memiliki akun?{" "}
            <Link href={ROUTES.PUBLIC.LOGIN_PASIEN} className="font-bold text-primary hover:underline">
              Masuk
            </Link>
          </div>
        </Card>
      </AppContainer>
    </main>
  );
}
