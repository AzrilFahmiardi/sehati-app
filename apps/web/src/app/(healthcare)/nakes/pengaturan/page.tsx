"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/Button";

const ROLE_LABELS: Record<string, string> = {
  kader: "Kader",
  bidan: "Bidan",
  dokter: "Dokter",
  admin_faskes: "Admin Faskes",
  admin_dinkes: "Admin Dinkes",
  platform_admin: "Platform Admin",
};

export default function PengaturanPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserName(sessionStorage.getItem("hv_user_name"));
    setUserEmail(sessionStorage.getItem("hv_user_email"));
    setUserRole(sessionStorage.getItem("hv_user_role"));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(auth);
    } catch {
      // lanjutkan logout meski salah satu langkah gagal
    }
    sessionStorage.clear();
    router.push(ROUTES.PUBLIC.LOGIN_NAKES);
  };

  return (
    <div className="w-full min-h-screen bg-surface font-sans text-on-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Pengaturan</h1>
        <p className="text-sm text-on-surface-variant">Informasi akun dan preferensi portal.</p>
      </div>

      <div className="max-w-xl bg-white rounded-xl border border-outline shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-on-surface border-b border-outline pb-3">Akun</h2>

        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="text-xs text-on-surface-variant block">Nama</span>
            <span className="text-sm font-bold text-on-surface">{userName ?? "-"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="text-xs text-on-surface-variant block">Email</span>
            <span className="text-sm font-bold text-on-surface">{userEmail ?? "-"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="text-xs text-on-surface-variant block">Peran</span>
            <span className="text-sm font-bold text-on-surface">
              {userRole ? ROLE_LABELS[userRole] ?? userRole : "-"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-outline">
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Keluar
          </Button>
        </div>
      </div>

      <div className="max-w-xl p-4 bg-surface-container-low rounded-xl border border-outline text-sm text-on-surface-variant">
        Preferensi portal lainnya (notifikasi, tampilan, dll) akan hadir di sini.
      </div>
    </div>
  );
}
