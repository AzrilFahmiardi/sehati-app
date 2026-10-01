import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Konfigurasi eslint format flat, menggantikan .eslintrc.json yang formatnya sudah
 * tidak sesuai dengan eslint 9 yang terpasang.
 *
 * Aturan no-restricted-syntax di bawah menegakkan keputusan pada
 * hemavision/docs/adr/008-design-language.md, yaitu nilai heksadesimal mentah tidak
 * boleh muncul lagi di dalam className. Tanpa penegakan mesin, bahasa desain kedua
 * akan tumbuh kembali dalam hitungan minggu.
 */
export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/\\[#[0-9A-Fa-f]{3,8}\\]/]",
          message:
            "Nilai heksadesimal mentah dilarang di className. Pakai nama token warna dari tailwind.config.ts.",
        },
        {
          selector: "TemplateElement[value.raw=/\\[#[0-9A-Fa-f]{3,8}\\]/]",
          message:
            "Nilai heksadesimal mentah dilarang di className. Pakai nama token warna dari tailwind.config.ts.",
        },
      ],
    },
  },
];
