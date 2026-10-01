"""Modular monolith: setiap subpaket adalah satu bounded context.

Batas antar modul ditegakkan mesin lewat import-linter, bukan kedisiplinan kode,
sesuai hemavision/docs/adr/001-modular-monolith.md. Modul lain hanya boleh
dipanggil lewat service.py publiknya, dan tidak boleh saling mengimpor kode
Python secara langsung.
"""
