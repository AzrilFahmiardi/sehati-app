"""Modul sesi skrining: capture, hasil per situs, antrean, dan idempotency.

Ketiga situs diproses paralel sebagai pekerjaan terpisah, sesuai
hemavision/docs/adr/005-async-polling.md.
"""
