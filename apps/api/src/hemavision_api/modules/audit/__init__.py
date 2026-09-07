"""Modul audit log tamper evident.

Setiap baris merantai hash baris sebelumnya, sehingga satu baris yang diubah atau
dihapus memutus rantai dan terdeteksi verifier terjadwal, sesuai
hemavision/docs/DECISION_LOG.md bagian kepatuhan UU PDP. Hak UPDATE dan DELETE
dicabut dari role aplikasi lewat migrasi, bukan lewat kode Python.
"""
