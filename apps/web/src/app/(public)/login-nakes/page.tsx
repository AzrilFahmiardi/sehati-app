"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AppContainer } from "@/components/layout/AppContainer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { auth } from "@/lib/firebase/client";

const HEALTHCARE_ROLES = new Set([
  "kader",
  "bidan",
  "dokter",
  "admin_faskes",
  "admin_dinkes",
  "platform_admin",
]);

interface MeResponse {
  display_name: string;
  email: string;
  memberships: Array<{ role: string; organization_id: string }>;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        throw new Error("Gagal membuat sesi");
      }

      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/me`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!meResponse.ok) {
        throw new Error("Akun belum diprovisioning atau ditangguhkan");
      }
      const me = (await meResponse.json()) as MeResponse;

      const healthcareMembership = me.memberships.find((membership) =>
        HEALTHCARE_ROLES.has(membership.role)
      );
      if (!healthcareMembership) {
        throw new Error("Akun ini tidak memiliki akses tenaga kesehatan");
      }
      sessionStorage.setItem("hv_org_id", healthcareMembership.organization_id);
      sessionStorage.setItem("hv_user_name", me.display_name);
      sessionStorage.setItem("hv_user_role", healthcareMembership.role);
      sessionStorage.setItem("hv_user_email", me.email);

      const next = searchParams.get("next") ?? ROUTES.NAKES.DASHBOARD;
      router.push(next);
    } catch {
      setError("Email atau kata sandi salah, atau akun tidak memiliki akses");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <AppContainer size="narrow">
        <Card className="p-6 bg-white border-outline space-y-6 shadow-lg">
          <div className="text-center space-y-2">
            <img
              src="/sehati-logo.png"
              alt="SEHATI Logo"
              className="w-12 h-12 object-contain mx-auto"
            />
            <h1 className="text-2xl font-black text-on-surface">Masuk SEHATI</h1>
            <p className="text-xs text-on-surface-variant">Akses khusus tenaga kesehatan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="nama@faskes.id"
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

            <p className="min-h-[20px] text-sm text-error font-medium">{error ?? ""}</p>

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant">
            Akun tenaga kesehatan dibuat oleh admin fasilitas Anda.
          </p>
        </Card>
      </AppContainer>
    </main>
  );
}
