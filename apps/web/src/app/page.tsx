"use client";

import React from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { ArrowRight, Camera, BarChart3, ClipboardCheck, Zap, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { FlipWords } from "@/components/ui/aceternity/flip-words";
import { Spotlight } from "@/components/ui/aceternity/spotlight";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { FloatingNav } from "@/components/ui/aceternity/floating-navbar";

const NAV_ITEMS = [
  { name: "Cara Kerja", link: "#cara-kerja" },
  { name: "Keunggulan", link: "#keunggulan" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans">
      <FloatingNav navItems={NAV_ITEMS} />

      {/* Static Top Navbar */}
      <nav className="relative z-50 bg-transparent">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <img
              src="/sehati-logo.png"
              alt="SEHATI"
              className="w-8 h-8 object-contain"
            />
            <span className="text-primary font-bold text-lg tracking-tight">SEHATI</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#cara-kerja" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              Cara Kerja
            </a>
            <a href="#keunggulan" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              Keunggulan
            </a>
            <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
              <Button variant="primary" size="sm">
                Masuk
              </Button>
            </Link>
          </div>
          <Link href={ROUTES.PUBLIC.LOGIN_NAKES} className="sm:hidden">
            <Button variant="primary" size="sm">
              Masuk
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-b from-primary-container/30 via-surface to-surface">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#0D5C75"
        />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #0D5C75 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] tracking-tight">
                  Skrining anemia,
                  <br />
                  <FlipWords
                    words={["tanpa rasa sakit.", "tanpa tusukan jarum.", "cepat dan akurat."]}
                    duration={3000}
                    className="text-primary"
                  />
                </h1>

                <TextGenerateEffect
                  words="SEHATI membantu tenaga kesehatan melakukan skrining awal anemia secara non-invasif melalui foto sederhana dari kamera ponsel."
                  className="max-w-lg"
                  duration={0.4}
                />
              </div>

              <ScrollReveal direction="up" delayMs={800} durationMs={600}>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Masuk sebagai Nakes
                    </Button>
                  </Link>
                  <a href="#cara-kerja">
                    <Button variant="secondary" size="lg">
                      Pelajari Cara Kerja
                    </Button>
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Decorative Medical SVG */}
            <ScrollReveal direction="scale" delayMs={400} durationMs={1000}>
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-80 h-80">
                  {/* Outer ring */}
                  <svg viewBox="0 0 320 320" className="w-full h-full" fill="none">
                    <circle cx="160" cy="160" r="150" stroke="#0D5C75" strokeWidth="1" strokeDasharray="8 6" opacity="0.2" />
                    <circle cx="160" cy="160" r="120" stroke="#0D5C75" strokeWidth="1.5" opacity="0.1" />
                    <circle cx="160" cy="160" r="80" stroke="#80D5CB" strokeWidth="2" opacity="0.3" />

                    {/* Pulse line */}
                    <path
                      d="M40 160 L100 160 L115 120 L135 200 L155 100 L175 220 L195 140 L210 160 L280 160"
                      stroke="#0D5C75"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    >
                      <animate attributeName="stroke-dashoffset" from="600" to="0" dur="2s" fill="freeze" />
                      <animate attributeName="stroke-dasharray" from="0 600" to="600 0" dur="2s" fill="freeze" />
                    </path>

                    {/* Cross */}
                    <rect x="148" y="40" width="24" height="24" rx="4" fill="#0D5C75" opacity="0.15" />
                    <line x1="160" y1="44" x2="160" y2="60" stroke="#0D5C75" strokeWidth="2" strokeLinecap="round" />
                    <line x1="152" y1="52" x2="168" y2="52" stroke="#0D5C75" strokeWidth="2" strokeLinecap="round" />

                    {/* Dots orbiting */}
                    <circle cx="60" cy="100" r="4" fill="#80D5CB" opacity="0.6">
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="260" cy="220" r="5" fill="#0D5C75" opacity="0.4">
                      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="240" cy="80" r="3" fill="#248BAA" opacity="0.5">
                      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Eye icon (konjungtiva) */}
                    <g transform="translate(60, 220)" opacity="0.5">
                      <ellipse cx="16" cy="10" rx="14" ry="9" stroke="#0D5C75" strokeWidth="1.5" fill="none" />
                      <circle cx="16" cy="10" r="4" fill="#0D5C75" opacity="0.3" />
                    </g>

                    {/* Hand icon (palm) */}
                    <g transform="translate(240, 130)" opacity="0.4">
                      <rect x="0" y="8" width="20" height="14" rx="7" stroke="#0D5C75" strokeWidth="1.5" fill="none" />
                      <line x1="5" y1="8" x2="5" y2="2" stroke="#0D5C75" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="10" y1="8" x2="10" y2="0" stroke="#0D5C75" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="15" y1="8" x2="15" y2="2" stroke="#0D5C75" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="py-24 sm:py-28 px-6 bg-white border-t border-outline-variant">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Alur Skrining</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-3">
                Tiga langkah sederhana
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
                Proses skrining yang dirancang agar cepat dan mudah digunakan di lapangan.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerMs={150}>
            {[
              {
                icon: Camera,
                step: "01",
                title: "Ambil Foto",
                desc: "Tenaga kesehatan mengambil foto konjungtiva, telapak tangan, atau kuku pasien menggunakan kamera ponsel.",
                color: "from-primary/5 to-primary-accent/10",
              },
              {
                icon: BarChart3,
                step: "02",
                title: "Analisis Otomatis",
                desc: "Sistem menganalisis citra dan memberikan estimasi kadar hemoglobin beserta tingkat risiko anemia.",
                color: "from-primary-accent/10 to-tertiary-container/30",
              },
              {
                icon: ClipboardCheck,
                step: "03",
                title: "Hasil dan Tindak Lanjut",
                desc: "Tenaga kesehatan melihat hasil, melakukan validasi klinis, dan menentukan langkah selanjutnya.",
                color: "from-tertiary-container/20 to-primary-container/20",
              },
            ].map((item, i) => (
              <StaggerItem key={item.step} index={i}>
                <div className={`relative p-7 rounded-2xl bg-gradient-to-br ${item.color} border border-outline/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 h-full flex flex-col group`}>
                  <span className="text-6xl font-black text-primary/[0.07] font-mono absolute top-3 right-5 select-none group-hover:text-primary/[0.12] transition-colors duration-500">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-white border border-outline/50 text-primary flex items-center justify-center mb-5 shadow-sm group-hover:shadow-md transition-shadow">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Keunggulan */}
      <section id="keunggulan" className="py-24 sm:py-28 px-6 border-t border-outline-variant relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-accent/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Keunggulan</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-3">
                Mengapa SEHATI?
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
                Dirancang khusus untuk mendukung tenaga kesehatan di fasilitas pelayanan primer.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-8" staggerMs={150}>
            {[
              {
                icon: Heart,
                title: "Non-Invasif",
                desc: "Tanpa pengambilan darah atau tusukan jarum. Cukup foto dari kamera ponsel, pasien bebas dari rasa cemas.",
              },
              {
                icon: Zap,
                title: "Hasil Cepat",
                desc: "Estimasi kadar hemoglobin tersedia dalam hitungan detik setelah foto diambil dan divalidasi kualitasnya.",
              },
              {
                icon: Shield,
                title: "Rekam Medis Terintegrasi",
                desc: "Seluruh hasil skrining tersimpan terstruktur, lengkap dengan riwayat dan validasi tenaga kesehatan.",
              },
            ].map((item, i) => (
              <StaggerItem key={item.title} index={i}>
                <div className="text-center p-8 rounded-2xl bg-white border border-outline/50 hover:border-primary/20 hover:shadow-lg transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-primary-light text-primary flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-3">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 sm:py-28 px-6 bg-white border-t border-outline-variant relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container/20 to-transparent pointer-events-none" />

        <ScrollReveal direction="up" durationMs={800}>
          <div className="relative max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Mulai skrining di fasilitas Anda
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-lg mx-auto">
              Daftarkan fasilitas kesehatan Anda dan mulai gunakan SEHATI untuk skrining anemia yang lebih efisien.
            </p>
            <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="mx-auto mt-2"
              >
                Mulai Sekarang
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-5">
          <p className="text-center text-sm text-on-surface-variant">
            Apakah Anda seorang pasien? Silakan buka{" "}
            <Link
              href={ROUTES.PATIENT.ROOT}
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              portal Pasien
            </Link>
            .
          </p>
          <div className="h-px w-16 mx-auto bg-outline" />
          <p className="text-center text-xs text-on-surface-muted leading-relaxed max-w-lg mx-auto">
            SEHATI adalah alat bantu skrining awal dan tidak menggantikan diagnosis oleh tenaga kesehatan.
            Hasil estimasi hemoglobin harus dikonfirmasi melalui pemeriksaan laboratorium.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <img src="/sehati-logo.png" alt="" className="w-4 h-4 object-contain opacity-40" />
            <span className="text-xs text-on-surface-muted">SEHATI 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
