"""Modul identitas: pengguna, keanggotaan organisasi, dan akses darurat.

Autentikasi diserahkan sepenuhnya ke Google Cloud Identity Platform, sehingga tidak
ada kolom password di modul ini. Otorisasi dihitung dari basis data pada setiap
permintaan, tidak pernah dipercaya dari token claims, sesuai
hemavision/docs/adr/004-identity-platform.md.
"""
