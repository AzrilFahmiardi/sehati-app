"use client";

import React from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { ArrowRight, Camera, BarChart3, ClipboardCheck, Zap, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/sehati-logo.png"
              alt="SEHATI"
              className="w-8 h-8 object-contain"
            />
            <span className="text-primary font-bold text-lg tracking-tight">SEHATI</span>
          </div>
          <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
            <Button variant="primary" size="sm">
              Masuk
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/40 via-surface to-surface pointer-events-none" />
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-primary-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-primary-light/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <ScrollReveal direction="up" durationMs={800}>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] tracking-tight">
                Skrining anemia,{" "}
                <span className="text-primary">tanpa rasa sakit.</span>
              </h1>
              <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-xl">
                SEHATI membantu tenaga kesehatan melakukan skrining awal anemia secara non-invasif melalui foto sederhana, tanpa memerlukan pengambilan darah.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delayMs={200} durationMs={800}>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Masuk sebagai Tenaga Kesehatan
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
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="py-20 sm:py-24 px-6 bg-white border-t border-outline-variant">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Tiga langkah sederhana
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
                Proses skrining yang dirancang agar cepat dan mudah digunakan di lapangan.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerMs={150}>
            {[
              {
                icon: Camera,
                step: "01",
                title: "Ambil Foto",
                desc: "Tenaga kesehatan mengambil foto konjungtiva, telapak tangan, atau kuku pasien menggunakan kamera ponsel biasa.",
              },
              {
                icon: BarChart3,
                step: "02",
                title: "Analisis Otomatis",
                desc: "Sistem menganalisis citra dan memberikan estimasi kadar hemoglobin beserta tingkat risiko anemia pasien.",
              },
              {
                icon: ClipboardCheck,
                step: "03",
                title: "Hasil dan Tindak Lanjut",
                desc: "Tenaga kesehatan melihat hasil, melakukan validasi klinis, dan menentukan langkah selanjutnya untuk pasien.",
              },
            ].map((item, i) => (
              <StaggerItem key={item.step} index={i}>
                <div className="relative p-6 rounded-2xl bg-surface border border-outline hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
                  <span className="text-5xl font-black text-primary/10 font-mono absolute top-4 right-5 select-none group-hover:text-primary/20 transition-colors">
                    {item.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-primary-container text-primary flex items-center justify-center mb-4">
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
      <section className="py-20 sm:py-24 px-6 border-t border-outline-variant">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Mengapa SEHATI?
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
                Dirancang khusus untuk mendukung tenaga kesehatan di fasilitas pelayanan primer.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6" staggerMs={150}>
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
                <div className="text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{item.title}</h3>
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
      <section className="py-20 sm:py-24 px-6 bg-white border-t border-outline-variant">
        <ScrollReveal direction="up" durationMs={800}>
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Mulai skrining di fasilitas Anda
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Daftarkan fasilitas kesehatan Anda dan mulai gunakan SEHATI untuk skrining anemia yang lebih efisien.
            </p>
            <Link href={ROUTES.PUBLIC.LOGIN_NAKES}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="mx-auto"
              >
                Mulai Sekarang
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Bottom Bar */}
      <footer className="border-t border-outline-variant bg-surface px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <p className="text-center text-sm text-on-surface-variant">
            Apakah Anda seorang pasien? Silakan buka{" "}
            <Link
              href={ROUTES.PATIENT.ROOT}
              className="text-primary font-semibold hover:underline"
            >
              portal Pasien
            </Link>
            .
          </p>
          <p className="text-center text-xs text-on-surface-muted leading-relaxed max-w-lg mx-auto">
            SEHATI adalah alat bantu skrining awal dan tidak menggantikan diagnosis oleh tenaga kesehatan. Hasil estimasi hemoglobin harus dikonfirmasi melalui pemeriksaan laboratorium.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <img src="/sehati-logo.png" alt="" className="w-5 h-5 object-contain opacity-50" />
            <span className="text-xs text-on-surface-muted">SEHATI 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
