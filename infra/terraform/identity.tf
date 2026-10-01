## Identity Platform

# Konfigurasi Identity Platform untuk project ini. Resource ini adalah singleton
# per project, sehingga tidak pernah dibuat lewat "terraform apply" dari nol,
# melainkan diimpor dari konfigurasi yang sudah diinisialisasi lewat REST API
# identitytoolkit.googleapis.com, sesuai
# hemavision/docs/adr/004-identity-platform.md bagian Provisioning Status.
resource "google_identity_platform_config" "default" {
  project = var.project_id

  sign_in {
    email {
      enabled           = true
      password_required = true
    }

    # Dideklarasikan eksplisit meski tidak dipakai (sesuai keputusan pasien
    # dan nakes memakai email dan password, bukan OTP SMS, pada
    # hemavision/docs/DECISION_LOG.md), supaya "terraform plan" tidak menganggap
    # blok computed ini sebagai perubahan yang perlu dihapus.
    phone_number {
      enabled = false
    }
  }

  mfa {
    state = "ENABLED"
  }

  # Satu tenant saja, hierarki organisasi sepenuhnya di Postgres, sesuai
  # hemavision/docs/adr/004-identity-platform.md bagian Trap to Avoid.
  multi_tenant {
    allow_tenants = false
  }
}

## Service account backend

resource "google_service_account" "core_api" {
  project      = var.project_id
  account_id   = "hemavision-api"
  display_name = "Hemavision Core API"
  description  = "Service account backend FastAPI untuk memanggil inference tier privat"
}

## Akses service account ke ketiga endpoint inference

# Diberikan per service, bukan pada tingkat project, sehingga service account
# ini tidak dapat memanggil layanan Cloud Run lain di luar ketiga endpoint
# inference. Prinsip least privilege yang sama dengan role basis data
# hemavision_app pada hemavision/docs/adr/003-database-provider.md.
resource "google_cloud_run_service_iam_member" "core_api_invokes_inference" {
  for_each = toset(var.inference_service_names)

  project  = var.project_id
  location = var.region
  service  = each.value
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.core_api.email}"
}
