"""Antrean job inferensi async lewat Cloud Tasks.

Satu job per situs per sesi skrining, dipanggil submit_screening setelah objek
GCS diverifikasi ada. Target HTTP-nya diautentikasi lewat token OIDC yang
diterbitkan Cloud Tasks sendiri, diverifikasi ulang oleh
hemavision_api.workers sebelum job dijalankan.
"""

import json
from functools import lru_cache
from uuid import UUID

from google.cloud import tasks_v2

from hemavision_api.core.config import get_settings


@lru_cache(maxsize=1)
def _client() -> tasks_v2.CloudTasksClient:
    return tasks_v2.CloudTasksClient()


def enqueue_inference_job(*, screening_id: UUID, site: str, organization_path: str) -> None:
    """Menambahkan satu task HTTP ke antrean untuk memproses satu situs.

    organization_path disertakan di payload job, bukan dibaca ulang oleh
    worker dari tabel screenings, karena screenings dilindungi Row Level
    Security dan worker tidak punya konteks organisasi apa pun sebelum baris
    itu sendiri berhasil dibaca, lingkaran ayam dan telur yang sama seperti
    didokumentasikan pada docstring
    hemavision_api.modules.identity.models.Membership.
    """
    settings = get_settings()
    client = _client()
    parent = client.queue_path(
        settings.identity_platform_project_id,
        settings.tasks_queue_location,
        settings.tasks_queue_name,
    )

    task = tasks_v2.Task(
        http_request=tasks_v2.HttpRequest(
            http_method=tasks_v2.HttpMethod.POST,
            url=f"{settings.public_base_url}/internal/jobs/infer",
            headers={"Content-Type": "application/json"},
            body=json.dumps(
                {
                    "screening_id": str(screening_id),
                    "site": site,
                    "organization_path": organization_path,
                }
            ).encode("utf-8"),
            oidc_token=tasks_v2.OidcToken(
                service_account_email=settings.worker_service_account_email,
                audience=settings.public_base_url,
            ),
        ),
    )

    client.create_task(parent=parent, task=task)
