"""Pengujian endpoint /v1/me.

Dependency get_current_user di-override langsung, karena router ini hanya
bertugas menyerahkan hasil resolusi identitas apa adanya sebagai JSON. Perilaku
verifikasi token dan resolusi identitas sudah diuji terpisah pada
test_security.py dan test_service.py.
"""

import uuid

from fastapi.testclient import TestClient

from hemavision_api.main import create_app
from hemavision_api.modules.identity.dependencies import get_current_user
from hemavision_api.modules.identity.models import Membership
from hemavision_api.modules.identity.service import AuthenticatedUser


def _membership(*, organization_id: uuid.UUID, role: str) -> Membership:
    membership = Membership()
    membership.organization_id = organization_id
    membership.organization_path = "id.jatim.uji"
    membership.role = role
    return membership


class TestGetMe:
    def test_missing_authorization_header_is_rejected(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/v1/me")

        assert response.status_code == 401

    def test_resolved_identity_is_returned_as_is(self) -> None:
        app = create_app()
        user_id = uuid.uuid4()
        organization_id = uuid.uuid4()
        authenticated = AuthenticatedUser(
            id=user_id,
            email="dokter@example.test",
            display_name="Dokter Uji",
            memberships=(_membership(organization_id=organization_id, role="dokter"),),
        )
        app.dependency_overrides[get_current_user] = lambda: authenticated

        client = TestClient(app)
        response = client.get("/v1/me", headers={"Authorization": "Bearer token-apa-saja"})

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(user_id)
        assert body["email"] == "dokter@example.test"
        assert body["memberships"] == [
            {
                "organization_id": str(organization_id),
                "organization_path": "id.jatim.uji",
                "role": "dokter",
            }
        ]
