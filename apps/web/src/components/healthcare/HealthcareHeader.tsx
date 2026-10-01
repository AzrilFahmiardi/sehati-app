"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HealthcareHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [initials, setInitials] = useState("-");

  useEffect(() => {
    const name = sessionStorage.getItem("hv_user_name");
    if (name) {
      setInitials(
        name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      );
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/nakes/pasien?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="hidden lg:flex items-center justify-between px-6 h-16 bg-surface border-b border-outline sticky top-0 z-20 w-full">
      {/* Search Input Pill */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Pasien atau ID..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant text-sm font-medium rounded-full outline-none border border-transparent focus:border-primary transition-all"
          />
        </div>
      </form>

      {/* User Profile Avatar */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center border border-outline shrink-0 bg-primary-light text-primary-dark font-bold text-sm">
        {initials}
      </div>
    </header>
  );
}
