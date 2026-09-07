"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Sun,
  AlertTriangle,
  FileCheck2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function PatientEducationPage() {
  // State for active clicked category card
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [heroExpanded, setHeroExpanded] = useState<boolean>(false);

  const categories = [
    {
      id: 0,
      title: "Mengenal Anemia",
      subtitle: "Dasar-dasar tentang kondisi ini.",
      icon: BookOpen,
      iconBg: "bg-tertiary-container",
      iconColor: "text-tertiary-alt",
      details: [
        "Anemia terjadi ketika kadar hemoglobin atau sel darah merah dalam tubuh berada di bawah batas normal.",
        "Hemoglobin berfungsi membawa oksigen dari paru-paru ke seluruh jaringan tubuh Anda.",
        "Penyebab paling umum adalah kekurangan zat besi (Fe), suplemen asam folat, atau faktor nutrisi harian."
      ]
    },
    {
      id: 1,
      title: "Gejala Umum",
      subtitle: "Tanda-tanda yang perlu diwaspadai.",
      icon: Sun,
      iconBg: "bg-warning-accent/20",
      iconColor: "text-warning",
      details: [
        "Rasa lelah kronis, lesu, letih, lemah, dan pusing yang menetap.",
        "Pucat pada bagian konjungtiva mata, telapak tangan, dan bantalan kuku.",
        "Sesak napas saat beraktivitas ringan dan sering merasakan detak jantung berdebar cepat."
      ]
    },
    {
      id: 2,
      title: "Faktor Risiko",
      subtitle: "Siapa yang lebih rentan terkena.",
      icon: AlertTriangle,
      iconBg: "bg-error-container",
      iconColor: "text-error-dark",
      details: [
        "Wanita usia subur dan remaja putri yang mengalami masa menstruasi harian.",
        "Ibu hamil yang membutuhkan asupan nutrisi ganda untuk pertumbuhan janin.",
        "Pola makan vegetarian tanpa asupan suplemen pengganti zat besi heme."
      ]
    },
    {
      id: 3,
      title: "Mitos vs Fakta",
      subtitle: "Meluruskan kesalahpahaman umum.",
      icon: FileCheck2,
      iconBg: "bg-outline-variant",
      iconColor: "text-on-surface",
      details: [
        "Mitos: 'Muka pucat pasti selalu disebabkan karena anemia.' (Fakta: Pucat bisa dipengaruhi oleh sirkulasi darah dan suhu tubuh).",
        "Mitos: 'Minum teh saat makan bisa menambah zat besi.' (Fakta: Kandungan tanin pada teh justru menghambat penyerapan zat besi).",
        "Fakta: Vitamin C membantu mempercepat penyerapan zat besi non-heme dalam usus."
      ]
    }
  ];

  return (
    <div className="w-full max-w-[672px] mx-auto px-4 py-6 space-y-8 pb-32">
      
      {/* SECTION 1: HEADER TITLES */}
      <div className="space-y-2">
        <h1 className="text-on-surface text-2xl sm:text-3xl font-bold tracking-tight">
          Kenali Anemia
        </h1>
        <p className="text-on-surface-variant text-base font-normal leading-relaxed">
          Pusat edukasi dan informasi seputar kesehatan darah Anda.
        </p>
      </div>

      {/* SECTION 2: HERO FEATURE CARD (BLUE BANNER) */}
      <div className="w-full bg-primary-bright text-white rounded-xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        {/* Ambient Overlay Blur */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-tint leading-tight">
            Sering lemas atau cepat<br />lelah, apakah selalu<br />anemia?
          </h2>

          <p className="text-surface-tint/90 text-base font-normal leading-relaxed">
            Kelelahan bisa menjadi tanda berbagai kondisi medis, bukan hanya anemia. Ketahui perbedaannya dan kapan Anda perlu khawatir.
          </p>

          <Link
            href={ROUTES.PATIENT.EDUKASI_DETAIL}
            className="px-6 py-3 bg-primary hover:bg-primary-deep active:scale-[0.98] text-white font-semibold text-sm rounded-lg shadow-md transition-all cursor-pointer inline-flex items-center gap-2 group/btn"
          >
            <span>Pelajari Lebih Lanjut</span>
            <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
          </Link>

          {heroExpanded && (
            <div className="pt-4 border-t border-white/20 text-sm text-surface-tint space-y-2 animate-fade-in">
              <p>
                Rasa lelah akibat anemia umumnya disertai gejala spesifik seperti pucat pada mukosa mata atau kuku. Jika kelelahan terjadi bersamaan dengan pusing atau napas pendek saat beraktivitas ringan, lakukan skrining awal dan konsultasikan ke dokter.
              </p>
            </div>
          )}
        </div>

        {/* Feature Illustration Image */}
        <div className="w-full h-48 sm:h-56 rounded-lg overflow-hidden border border-white/20 shadow-md relative group-hover:scale-[1.01] transition-transform duration-500">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
            alt="Edukasi Kesehatan Darah"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-bright/80 via-transparent to-transparent" />
        </div>
      </div>

      {/* SECTION 3: KATEGORI PEMBELAJARAN */}
      <section className="space-y-6">
        <h2 className="text-on-surface text-2xl font-bold tracking-tight">
          Kategori Pembelajaran
        </h2>

        {/* Cards Stack */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full bg-surface rounded-xl p-6 transition-all duration-300 cursor-pointer space-y-4 relative group ${
                  isSelected
                    ? "border-2 border-primary-vivid shadow-[0px_4px_16px_rgba(37,99,235,0.22)] scale-[1.01]"
                    : "border border-outline hover:border-primary-vivid/60 hover:shadow-md"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Circle Icon Badge */}
                    <div className={`w-12 h-12 rounded-full ${cat.iconBg} flex items-center justify-center ${cat.iconColor} group-hover:scale-110 transition-transform shadow-2xs`}>
                      <IconComp className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-on-surface text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-on-surface-variant text-sm font-normal">
                        {cat.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Top-Right "Pelajari ↗" Link */}
                  <div className={`flex items-center gap-1 text-sm font-semibold transition-all ${
                    isSelected ? "text-primary translate-x-0.5" : "text-primary group-hover:translate-x-0.5"
                  }`}>
                    <span>Pelajari</span>
                    <ArrowUpRight className="w-4 h-4 text-primary stroke-[2.5]" />
                  </div>
                </div>

                {/* Expanded Details when Clicked */}
                {isSelected && (
                  <div className="pt-4 border-t border-outline/40 space-y-2.5 text-sm text-on-surface-variant animate-fade-in">
                    {cat.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-normal">{detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: MEDICAL DISCLAIMER CARD */}
      <div className="w-full bg-surface-container-low border border-outline rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs hover:shadow-md transition-shadow group">
        <div className="w-16 h-16 bg-surface border border-outline rounded-full mx-auto flex items-center justify-center text-tertiary shadow-2xs group-hover:scale-110 transition-transform">
          <Stethoscope className="w-8 h-8 text-tertiary" />
        </div>

        <p className="text-on-surface text-base font-normal leading-relaxed max-w-md mx-auto">
          Gejala tersebut dapat memiliki berbagai penyebab.{" "}
          <span className="text-primary font-semibold">Pemeriksaan diperlukan</span>{" "}
          untuk mengetahui kondisi Anda lebih lanjut. Konsultasikan dengan tenaga kesehatan jika gejala menetap atau memburuk.
        </p>
      </div>

    </div>
  );
}
