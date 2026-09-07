"""Satu titik impor seluruh model modul, agar Base.metadata lengkap.

Alembic autogenerate dan pengujian yang membuat skema dari metadata (misalnya lewat
testcontainers) mengimpor modul ini, bukan mengimpor tiap modul.models satu per
satu, sehingga menambah modul baru cukup menambah satu baris impor di sini.
"""

from hemavision_api.core.db import Base
from hemavision_api.modules.audit import models as audit_models
from hemavision_api.modules.consent import models as consent_models
from hemavision_api.modules.fusion import models as fusion_models
from hemavision_api.modules.identity import models as identity_models
from hemavision_api.modules.patients import models as patients_models
from hemavision_api.modules.privacy import models as privacy_models
from hemavision_api.modules.referral import models as referral_models
from hemavision_api.modules.screening import models as screening_models
from hemavision_api.modules.tenancy import models as tenancy_models

__all__ = [
    "Base",
    "audit_models",
    "consent_models",
    "fusion_models",
    "identity_models",
    "patients_models",
    "privacy_models",
    "referral_models",
    "screening_models",
    "tenancy_models",
]
