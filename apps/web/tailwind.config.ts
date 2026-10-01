import type { Config } from "tailwindcss";

/**
 * Token warna SEHATI Design System berbasis palet Ocean Teal.
 *
 * Aturan yang harus dijaga: nilai heksadesimal mentah tidak boleh muncul
 * di dalam className. Selalu pakai nama token, agar tidak tumbuh bahasa
 * desain kedua.
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
          DEFAULT: "#0D5C75",
          dark: "#0A4C61",
          darkest: "#004357",
          medium: "#16728F",
          accent: "#80D5CB",
          light: "#D8E3FB",
          tint: "#E7EEFF",
          container: "#F0F3FF",
          deep: "#004357",
          bright: "#16728F",
          "bright-dark": "#0D5C75",
          vivid: "#248BAA",
        },
        secondary: {
          DEFAULT: "#1E3A5F",
          darkest: "#001F2A",
          dark: "#001C3B",
          light: "#455F87",
          muted: "#6A83AB",
          container: "#D5E3FF",
        },
        surface: {
          DEFAULT: "#F9F9FF",
          "container-low": "#F0F3FF",
          container: "#E7EEFF",
          "container-high": "#D8E3FB",
          "container-highest": "#CBD5E1",
          "container-alt": "#F0F3FF",
          tint: "#E7EEFF",
          white: "#FFFFFF",
        },
        "on-surface": {
          DEFAULT: "#111C2D",
          variant: "#40484C",
          muted: "#70787D",
          subtle: "#94A3B8",
          deep: "#111C2D",
          neutral: "#475569",
        },
        outline: {
          DEFAULT: "#D8E3FB",
          variant: "#E7EEFF",
          strong: "#CBD5E1",
          muted: "#E2E8F0",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
          light: "#FF8A7A",
          dark: "#93000A",
        },
        tertiary: {
          DEFAULT: "#004641",
          alt: "#0F766E",
          emerald: "#059669",
          container: "#ECFDF5",
          "container-alt": "#D1FAE5",
          muted: "#80D5CB",
          bright: "#9CF2E8",
        },
        warning: {
          DEFAULT: "#D97706",
          accent: "#B45309",
          darkest: "#78350F",
          container: "#FFFBEB",
          "container-low": "#FEF3C7",
          "container-lowest": "#FFFBEB",
          bright: "#F59E0B",
          "bright-dark": "#D97706",
          vivid: "#EA580C",
          light: "#FDE68A",
          dark: "#92400E",
        },
        success: {
          DEFAULT: "#059669",
          dark: "#065F46",
          container: "#ECFDF5",
          light: "#A7F3D0",
        },
      },
      boxShadow: {
        "guide-glow": "0 0 30px rgba(13, 92, 117, 0.3)",
        "scan-glow": "0 0 12px #9CF2E8",
        "scan-glow-sm": "0 0 10px #9CF2E8",
        "scan-line": "0 0 12px #80D5CB",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -40%) scale(1)",
          },
        },
      },
      animation: {
        spotlight: "spotlight 2s ease 0.75s 1 forwards",
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
        mono: [
          "Liberation Mono",
          "Menlo",
          "Courier",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
