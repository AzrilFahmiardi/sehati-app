# SEHATI App

Monorepo produk untuk sistem skrining anemia non invasif berbasis citra Hemavision. Repo ini memuat seluruh permukaan produk, yaitu aplikasi web progresif untuk kader dan pasien, dashboard untuk tenaga kesehatan dan Dinas Kesehatan, serta core API yang menjadi backend keduanya.

Model machine learning tidak berada di repo ini. Ketiga model per situs anatomis (conjunctiva, palm, nail) sudah dilatih dan berjalan sebagai layanan terpisah, dan repo ini mengonsumsinya lewat HTTPS.

## Workspace Layout

```
apps/web         Next.js 15 App Router, satu aplikasi dengan tiga route group
apps/api         FastAPI modular monolith, core API dan worker handler
packages/*       Kode yang dipakai bersama antar aplikasi
infra/terraform  Infrastructure as code
```

Aplikasi web memakai satu berkas untuk tiga permukaan yang dipisahkan route group. Grup `(public)` memuat halaman masuk dan pendaftaran, grup `(patient)` memuat portal pasien, dan grup `(healthcare)` memuat dashboard klinis serta surveilans.

## Requirements

Node 20.11 atau lebih baru, pnpm 9 yang diaktifkan lewat corepack, dan Python 3.12 atau lebih baru dengan uv untuk core API.

## Getting Started

Menyiapkan dependensi seluruh workspace JavaScript:

```
corepack enable pnpm
pnpm install
```

Menyiapkan dependensi core API:

```
cd apps/api
uv sync --extra dev
```

## Common Commands

Dijalankan dari akar repo, dan Turborepo meneruskannya ke setiap workspace yang memilikinya.

```
pnpm dev          menjalankan seluruh aplikasi dalam mode pengembangan
pnpm build        membangun seluruh aplikasi
pnpm typecheck    memeriksa tipe seluruh workspace
pnpm test         menjalankan pengujian seluruh workspace
pnpm lint         menjalankan linter
pnpm format       merapikan format berkas
```

Perintah khusus core API dijalankan dari `apps/api`.

```
uv run uvicorn hemavision_api.main:app --reload
uv run ruff check src
uv run mypy src
uv run pytest
```

## Clinical Positioning

Sistem ini adalah alat skrining, bukan alat diagnosis. Keluarannya berupa estimasi hemoglobin beserta ketidakpastiannya, dan sistem secara sengaja dapat menyatakan bahwa hasil tidak dapat disimpulkan ketika bukti visualnya tidak memadai. Setiap peringatan keandalan yang menyertai hasil wajib ditampilkan apa adanya kepada pengguna akhir.
