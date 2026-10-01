# Infrastructure as Code

Konfigurasi ini mendeklarasikan Identity Platform, service account backend, dan hak aksesnya ke inference tier. Provisioning nyata dijalankan lebih dulu lewat `gcloud` dan REST API `identitytoolkit.googleapis.com` (dicatat di `hemavision/docs/adr/004-identity-platform.md` bagian Provisioning Status), lalu resource yang sudah ada diimpor ke sini lewat `terraform import`, sehingga file ini benar-benar mencerminkan kondisi nyata, dibuktikan `terraform plan` yang melaporkan nol perubahan.

## Keterbatasan yang diketahui

State Terraform (`terraform.tfstate`) saat ini tersimpan lokal di mesin pengembangan, bukan di backend jarak jauh, dan sengaja tidak masuk git karena dapat memuat data sensitif. Konsekuensinya bila mesin ini hilang, state harus diimpor ulang satu per satu memakai perintah yang sama seperti saat pertama kali. Resource GCP sendiri tetap ada dan tidak hilang, hanya catatan Terraform tentangnya yang hilang. Migrasi ke backend jarak jauh (bucket GCS) adalah pekerjaan lanjutan sebelum tim lain ikut menjalankan Terraform ini.

## Menjalankan

Autentikasi memakai token sesi akun pengembang, bukan Application Default Credentials, karena ADC belum dikonfigurasi di lingkungan pengembangan ini.

```
export GOOGLE_OAUTH_ACCESS_TOKEN=$(gcloud auth print-access-token)
terraform plan
```
