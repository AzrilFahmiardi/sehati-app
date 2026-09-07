import type { Config } from "tailwindcss";

/**
 * Token warna mengikuti palet Material 3 yang dipakai pada desain Figma Hemavision.
 *
 * Setiap nilai di sini identik dengan nilai heksadesimal yang sebelumnya ditulis
 * langsung di dalam className, sehingga promosi menjadi token tidak mengubah
 * tampilan sama sekali. Alasan arah rekonsiliasi ini dijelaskan pada
 * hemavision/docs/adr/008-design-language.md.
 *
 * Aturan yang harus dijaga: nilai heksadesimal mentah tidak boleh muncul lagi di
 * dalam className. Selalu pakai nama token, agar tidak tumbuh bahasa desain kedua.
 *
 * Token deep, bright, bright-dark, vivid, tint, container-alt, neutral, muted,
 * dark, dan light berasal dari slicing portal pasien. Nilainya dipertahankan
 * persis seperti hasil desain agar tampilan tidak bergeser, namun beberapa di
 * antaranya hanya berjarak tipis dari token induknya. Saat portal pasien sudah
 * stabil, tinjau ulang apakah token tersebut bisa dilebur ke token induk.
 */
const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004AC6",
          dark: "#003EA8",
          darkest: "#00174B",
          accent: "#85A3FF",
          light: "#B4C5FF",
          container: "#DBE1FF",
          deep: "#003DA3",
          bright: "#2563EB",
          "bright-dark": "#1D4ED8",
          vivid: "#2676FC",
        },
        surface: {
          DEFAULT: "#FAF8FF",
          "container-low": "#F3F3FE",
          container: "#E7E7F3",
          "container-high": "#EDEDF9",
          "container-highest": "#E8E8FB",
          "container-alt": "#F1F3F9",
          tint: "#EEEFFF",
        },
        "on-surface": {
          DEFAULT: "#191B23",
          variant: "#434655",
          muted: "#737686",
          subtle: "#949494",
          deep: "#2E3039",
          neutral: "#6B7280",
        },
        outline: {
          DEFAULT: "#C3C6D7",
          variant: "#E1E2ED",
          strong: "#B0B4C7",
          muted: "#D9D9E5",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
          light: "#FF8A7A",
          dark: "#93000A",
        },
        tertiary: {
          DEFAULT: "#006A61",
          alt: "#006F66",
          container: "#86F2E4",
          "container-alt": "#89F5E7",
          muted: "#6BD8CB",
        },
        warning: {
          DEFAULT: "#943700",
          accent: "#BC4800",
          darkest: "#360F00",
          container: "#FFB596",
          "container-low": "#FFDBCD",
          "container-lowest": "#FFEDE6",
          bright: "#F59E0B",
          "bright-dark": "#D97706",
          vivid: "#D85A18",
          light: "#FF9E78",
        },
      },
      boxShadow: {
        "guide-glow": "0 0 30px rgba(133, 163, 255, 0.3)",
        "scan-glow": "0 0 12px #89F5E7",
        "scan-glow-sm": "0 0 10px #89F5E7",
        "scan-line": "0 0 12px #86F2E4",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
