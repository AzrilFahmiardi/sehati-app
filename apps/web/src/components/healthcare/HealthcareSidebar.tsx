"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { auth } from "@/lib/firebase/client";
import {
  LayoutGrid,
  Users,
  PlusCircle,
  History,
  BarChart3,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserCheck,
} from "lucide-react";
import { Button } from "../ui/Button";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.NAKES.DASHBOARD, icon: LayoutGrid },
  { label: "Pasien", href: ROUTES.NAKES.PASIEN_LIST, icon: Users },
  { label: "Skrining Baru", href: ROUTES.NAKES.SKRINING_BARU, icon: PlusCircle },
  { label: "Riwayat & Monitoring", href: ROUTES.NAKES.MONITORING, icon: History },
  { label: "Permintaan Tarik Data", href: ROUTES.NAKES.PERMINTAAN, icon: UserCheck },
  { label: "Laporan", href: ROUTES.NAKES.LAPORAN, icon: BarChart3 },
  { label: "Pengaturan", href: "/nakes/pengaturan", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  kader: "Kader",
  bidan: "Bidan",
  dokter: "Dokter",
  admin_faskes: "Admin Faskes",
  admin_dinkes: "Admin Dinkes",
  platform_admin: "Platform Admin",
};

function resolveActiveHref(pathname: string): string {
  if (pathname === ROUTES.NAKES.DASHBOARD) {
    return ROUTES.NAKES.DASHBOARD;
  }
  const isScreeningFlow =
    pathname.startsWith(ROUTES.NAKES.SKRINING_OVERVIEW) || pathname.startsWith(ROUTES.NAKES.PASIEN_BARU);
  if (isScreeningFlow) {
    return ROUTES.NAKES.SKRINING_BARU;
  }
  if (pathname.startsWith(ROUTES.NAKES.PASIEN_LIST)) {
    return ROUTES.NAKES.PASIEN_LIST;
  }
  if (pathname.startsWith(ROUTES.NAKES.MONITORING)) {
    return ROUTES.NAKES.MONITORING;
  }
  if (pathname.startsWith(ROUTES.NAKES.PERMINTAAN)) {
    return ROUTES.NAKES.PERMINTAAN;
  }
  if (pathname.startsWith(ROUTES.NAKES.LAPORAN)) {
    return ROUTES.NAKES.LAPORAN;
  }
  if (pathname.startsWith("/nakes/pengaturan")) {
    return "/nakes/pengaturan";
  }
  return pathname;
}

export function HealthcareSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const activeHref = resolveActiveHref(pathname);

  useEffect(() => {
    setUserName(sessionStorage.getItem("hv_user_name"));
    setUserRole(sessionStorage.getItem("hv_user_role"));
  }, []);

  const initials = userName
    ? userName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "-";
  const roleLabel = userRole ? ROLE_LABELS[userRole] ?? userRole : "Tenaga Kesehatan";

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

  const desktopNavContent = (
    <nav className="flex flex-col gap-1 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex items-center text-base transition-all relative border-r-4 rounded-l-lg",
              isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3 mx-2",
              isActive
                ? "bg-surface-container-low text-primary border-primary font-bold"
                : "text-on-surface-variant hover:bg-slate-100 hover:text-slate-900 border-transparent font-normal"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const mobileNavContent = (
    <nav className="flex flex-col gap-1 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 mx-2 text-base transition-all relative border-r-4 rounded-l-lg",
              isActive
                ? "bg-surface-container-low text-primary border-primary font-bold"
                : "text-on-surface-variant hover:bg-slate-100 hover:text-slate-900 border-transparent font-normal"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-outline sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/sehati-logo.png"
            alt="SEHATI Logo"
            className="w-8 h-8 object-contain shrink-0"
          />
          <h1 className="font-bold text-primary text-xl tracking-tight truncate">SEHATI</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-surface z-50 shadow-2xl flex flex-col transition-transform duration-300 transform border-r border-outline",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-outline flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/sehati-logo.png"
              alt="SEHATI Logo"
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-bold text-primary text-2xl tracking-tight truncate">SEHATI</h2>
              <p className="text-sm text-on-surface-variant opacity-70 truncate">Portal Tenaga Kesehatan</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5 text-on-surface-variant" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">{mobileNavContent}</div>
        <div className="p-6 border-t border-outline flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-on-surface text-base block leading-tight truncate">
              {userName ?? "Tenaga Kesehatan"}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block truncate">
              {roleLabel}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-all cursor-pointer shrink-0"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-outline bg-surface min-h-screen shrink-0 sticky top-0 h-screen justify-between transition-all duration-300 select-none",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div>
          {/* Header with Toggle Button */}
          <div
            className={cn(
              "p-6 pb-8 border-b border-outline/40 flex items-center transition-all",
              isCollapsed ? "justify-center flex-col gap-3 px-3" : "justify-between"
            )}
          >
            {!isCollapsed ? (
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/sehati-logo.png"
                  alt="SEHATI Logo"
                  className="w-10 h-10 object-contain drop-shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-bold text-primary text-2xl tracking-tight leading-8 truncate">SEHATI</h2>
                  <p className="text-sm font-medium text-on-surface-variant opacity-70 truncate">Portal Tenaga Kesehatan</p>
                </div>
              </div>
            ) : (
              <img
                src="/sehati-logo.png"
                alt="SEHATI Logo"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
              title={isCollapsed ? "Buka Sidebar (Expand)" : "Tutup Sidebar (Collapse)"}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-2">{desktopNavContent}</div>
        </div>

        {/* Profile Footer */}
        <div
          className={cn(
            "p-6 border-t border-outline flex items-center transition-all",
            isCollapsed ? "justify-center px-2" : "gap-3"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-light text-primary-dark font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <>
              <div className="overflow-hidden flex-1 min-w-0">
                <span className="font-bold text-on-surface text-base block leading-tight truncate">
                  {userName ?? "Tenaga Kesehatan"}
                </span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block truncate">
                  {roleLabel}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-all cursor-pointer shrink-0"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
