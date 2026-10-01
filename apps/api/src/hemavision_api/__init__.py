"""Core API untuk sistem skrining anemia non invasif Hemavision.

Paket ini berisi modular monolith FastAPI yang menjadi satu satunya backend produk.
Batas antar modul dijelaskan pada hemavision/docs/adr/001-modular-monolith.md, dan
inference tier dikonsumsi sebagai layanan eksternal sesuai
hemavision/docs/adr/002-repository-boundary.md.
"""

__version__ = "0.1.0"
