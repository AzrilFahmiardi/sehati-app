"""row level security policies

Revision ID: 5c5cda9239b6
Revises: f421071622af
Create Date: 2026-07-29 01:41:16.583336

Menegakkan isolasi antar organisasi di level basis data untuk tabel yang secara
langsung memuat organization_id, yaitu organizations (lewat kolom path), patients,
screenings, dan idempotency_keys. Sesuai hemavision/docs/DECISION_LOG.md bagian
multi-tenancy: bug pada satu query aplikasi tidak dapat membocorkan pasien
organisasi lain, karena isolasi ditegakkan basis data, bukan kedisiplinan kode.

FORCE ROW LEVEL SECURITY dipakai, bukan hanya ENABLE, supaya policy tetap berlaku
bahkan untuk role pemilik tabel. Ini penting khusus untuk Neon, karena satu-satunya
role yang tersedia pada tingkat free tier adalah pemilik skema itu sendiri, yang
pada Postgres normalnya dikecualikan dari row security kecuali FORCE diaktifkan.

Cakupan yang sengaja belum tercakup, dicatat sebagai keputusan bukan kelalaian:
tabel yang menurunkan keterkaitan organisasi secara transitif lewat screening_id
atau patient_id (site_results, screening_captures, fused_results, referrals,
reference_measurements, follow_ups, consents, patient_baselines, dsar_requests)
untuk saat ini dilindungi di lapisan aplikasi lewat query yang selalu di-join ke
induknya. Keputusan mendenormalisasi organization_id ke tabel tabel itu, atau
menulis policy dengan subquery berkorelasi, punya trade off performa dan
konsistensi yang layak dibahas dalam ADR tersendiri sebelum diterapkan, bukan
diputuskan diam diam di sini. emergency_access_grants juga belum diberi policy
karena tabel itu justru dirancang untuk akses lintas organisasi, sehingga aturan
siapa boleh membuat atau membaca grant adalah persoalan otorisasi lapisan
aplikasi, bukan isolasi data.

Dua temuan penting dari pengujian yang mengoreksi draf awal migrasi ini.

Pertama, tanpa WITH CHECK ditulis eksplisit, Postgres tidak menurunkannya dari
USING untuk policy FOR ALL pada versi yang diuji, sehingga INSERT tidak
terlindungi sama sekali kalau hanya USING yang ditulis. Karena itu setiap policy
di bawah menulis USING dan WITH CHECK dengan ekspresi yang identik secara
eksplisit, bukan mengandalkan penurunan otomatis.

Kedua, current_setting atas variabel kustom yang belum pernah dipakai dalam suatu
koneksi mengembalikan NULL, tetapi begitu pernah di-SET LOCAL sekali saja,
Postgres menganggapnya variabel yang sudah dikenal untuk sisa umur koneksi
tersebut, dan RESET berikutnya mengembalikannya ke string kosong, bukan ke NULL.
Karena string kosong pada ltree juga bermakna akar hierarki yang menjadi leluhur
setiap path, kedua keadaan itu tidak boleh disamakan dengan penjaga
IS NOT NULL saja, sebab pada koneksi yang connection pool-nya dipakai ulang,
konteks yang lupa ditetapkan akan terbaca kosong dan diperlakukan seolah akses
akar. Karena itu penjaga memakai NULLIF(current_setting(...), '') IS NOT NULL,
yang memperlakukan NULL maupun string kosong sama sama sebagai konteks tidak
ada. Konsekuensinya, akses tingkat akar untuk platform_admin tidak lagi
direpresentasikan sebagai path kosong, melainkan sebagai label akar hierarki
yang sesungguhnya, sesuai konvensi penamaan path organisasi.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "5c5cda9239b6"
down_revision: str | None = "f421071622af"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TENANT_TABLES = ("patients", "screenings", "idempotency_keys")


def upgrade() -> None:
    op.execute("ALTER TABLE organizations ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE organizations FORCE ROW LEVEL SECURITY")
    organizations_predicate = """
        NULLIF(current_setting('app.current_org_path', true), '') IS NOT NULL
        AND path <@ current_setting('app.current_org_path', true)::ltree
    """
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON organizations
        USING ({organizations_predicate})
        WITH CHECK ({organizations_predicate})
        """
    )

    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        table_predicate = """
            NULLIF(current_setting('app.current_org_path', true), '') IS NOT NULL
            AND organization_id IN (
                SELECT id FROM organizations
                WHERE path <@ current_setting('app.current_org_path', true)::ltree
            )
        """
        op.execute(
            f"""
            CREATE POLICY tenant_isolation ON {table}
            USING ({table_predicate})
            WITH CHECK ({table_predicate})
            """
        )

    op.execute("REVOKE UPDATE, DELETE ON audit_events FROM CURRENT_USER")

    op.create_index(
        "ix_audit_events_resource", "audit_events", ["resource_type", "resource_id", "occurred_at"]
    )
    op.create_index("ix_screenings_org_created_at", "screenings", ["organization_id", "created_at"])
    op.create_index("ix_screenings_patient_created_at", "screenings", ["patient_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_screenings_patient_created_at", table_name="screenings")
    op.drop_index("ix_screenings_org_created_at", table_name="screenings")
    op.drop_index("ix_audit_events_resource", table_name="audit_events")

    op.execute("GRANT UPDATE, DELETE ON audit_events TO CURRENT_USER")

    for table in TENANT_TABLES:
        op.execute(f"DROP POLICY tenant_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY tenant_isolation ON organizations")
    op.execute("ALTER TABLE organizations NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE organizations DISABLE ROW LEVEL SECURITY")
