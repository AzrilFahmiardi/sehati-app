## Bucket upload skrining

# Menampung foto dan video mentah hasil capture pasien, sampai lifecycle rule
# retensi tujuh hari ditambahkan pada stage privasi (belum dikerjakan, dicatat
# sebagai utang pada hemavision/docs/DECISION_LOG.md).
resource "google_storage_bucket" "screening_uploads" {
  project                     = var.project_id
  name                        = "${var.project_id}-screening-uploads"
  location                    = var.region
  uniform_bucket_level_access = true

  # CORS di sini ditegakkan GCS sendiri terhadap permintaan browser, terpisah
  # dari CORSMiddleware pada apps/api, karena browser mengunggah langsung ke
  # signed URL tanpa lewat backend sama sekali.
  cors {
    origin          = ["https://hemavision.my.id", "https://www.hemavision.my.id", "http://localhost:3000"]
    method          = ["PUT"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "core_api_writes_screening_uploads" {
  bucket = google_storage_bucket.screening_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.core_api.email}"
}

## Antrean Cloud Tasks untuk job inferensi async

resource "google_cloud_tasks_queue" "inference_jobs" {
  project  = var.project_id
  location = var.region
  name     = "hemavision-inference-jobs"
}

## Izin service account sendiri: menandatangani signed URL (IAM SignBlob) dan
## bertindak sebagai dirinya sendiri saat membuat task Cloud Tasks ber-OIDC

resource "google_service_account_iam_member" "core_api_signs_own_urls" {
  service_account_id = google_service_account.core_api.name
  role                = "roles/iam.serviceAccountTokenCreator"
  member              = "serviceAccount:${google_service_account.core_api.email}"
}

resource "google_service_account_iam_member" "core_api_acts_as_self" {
  service_account_id = google_service_account.core_api.name
  role                = "roles/iam.serviceAccountUser"
  member              = "serviceAccount:${google_service_account.core_api.email}"
}

resource "google_project_iam_member" "core_api_enqueues_tasks" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.core_api.email}"
}
