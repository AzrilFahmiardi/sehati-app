"""Modul pemanggil inference tier.

Ketiga model machine learning (conjunctiva, palm, nail) sudah live sebagai Cloud Run
service privat dan tidak dikelola oleh repo ini. Modul ini adalah satu satunya tempat
di seluruh produk yang mengetahui alamat layanan tersebut, sesuai
hemavision/docs/adr/002-repository-boundary.md.
"""
