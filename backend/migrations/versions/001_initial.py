"""001 — Initial schema with PostGIS and all AquaVane tables.

Revision ID: 001_initial
Revises: None
Create Date: 2026-10-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # --- profiles ---
    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="viewer"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- watersheds ---
    op.create_table(
        "watersheds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("watershed_code", sa.String(100), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("basin_name", sa.String(255)),
        sa.Column("area_sq_km", sa.Float),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="MULTIPOLYGON", srid=4326)),
        sa.Column("centroid", geoalchemy2.Geometry(geometry_type="POINT", srid=4326)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_watersheds_geom", "watersheds", ["geom"], postgresql_using="gist")
    op.create_index("idx_watersheds_code", "watersheds", ["watershed_code"])
    op.create_index("idx_watersheds_state", "watersheds", ["state"])
    op.create_index("idx_watersheds_district", "watersheds", ["district"])
    op.create_index("idx_watersheds_basin", "watersheds", ["basin_name"])

    # --- datasets ---
    op.create_table(
        "datasets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dataset_name", sa.String(255), nullable=False),
        sa.Column("provider", sa.String(255)),
        sa.Column("dataset_type", sa.String(50), nullable=False),
        sa.Column("source_url", sa.Text),
        sa.Column("licence_or_attribution", sa.Text),
        sa.Column("reference_start", sa.DateTime(timezone=True)),
        sa.Column("reference_end", sa.DateTime(timezone=True)),
        sa.Column("native_resolution", sa.String(100)),
        sa.Column("units", sa.String(100)),
        sa.Column("crs", sa.String(50)),
        sa.Column("file_format", sa.String(50)),
        sa.Column("storage_path", sa.Text),
        sa.Column("checksum", sa.String(128)),
        sa.Column("metadata_json", postgresql.JSONB, server_default="{}"),
        sa.Column("status", sa.String(50), nullable=False, server_default="registered"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- dataset_versions ---
    op.create_table(
        "dataset_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_tag", sa.String(100), nullable=False),
        sa.Column("checksum", sa.String(128)),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("validation_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("processing_version", sa.String(100)),
        sa.Column("provenance_json", postgresql.JSONB, server_default="{}"),
        sa.UniqueConstraint("dataset_id", "version_tag", name="uq_dataset_version"),
    )

    # --- processing_jobs ---
    op.create_table(
        "processing_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("datasets.id", ondelete="SET NULL")),
        sa.Column("job_type", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("progress", sa.Float, server_default="0"),
        sa.Column("parameters_json", postgresql.JSONB, server_default="{}"),
        sa.Column("output_metadata_json", postgresql.JSONB, server_default="{}"),
        sa.Column("error_summary", sa.Text),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.CheckConstraint("progress >= 0 AND progress <= 100", name="ck_job_progress_range"),
    )

    # --- watershed_indicators ---
    op.create_table(
        "watershed_indicators",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("watershed_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("watersheds.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("datasets.id", ondelete="SET NULL")),
        sa.Column("indicator_code", sa.String(100), nullable=False),
        sa.Column("raw_value", sa.Float),
        sa.Column("normalized_score", sa.Float),
        sa.Column("unit", sa.String(50)),
        sa.Column("reference_start", sa.DateTime(timezone=True)),
        sa.Column("reference_end", sa.DateTime(timezone=True)),
        sa.Column("method_version", sa.String(50), nullable=False, server_default="v1.0"),
        sa.Column("quality_status", sa.String(50), nullable=False, server_default="computed"),
        sa.Column("uncertainty_note", sa.Text),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "watershed_id", "indicator_code", "method_version",
            "reference_start", "reference_end",
            name="uq_watershed_indicator",
        ),
    )
    op.create_index("idx_indicator_code", "watershed_indicators", ["indicator_code"])

    # --- scoring_profiles ---
    op.create_table(
        "scoring_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("weights_json", postgresql.JSONB, nullable=False),
        sa.Column("indicator_schema_version", sa.String(50), nullable=False, server_default="v1.0"),
        sa.Column("is_default", sa.Boolean, server_default="false"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- scoring_runs ---
    op.create_table(
        "scoring_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scoring_profile_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("scoring_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reference_period_start", sa.DateTime(timezone=True)),
        sa.Column("reference_period_end", sa.DateTime(timezone=True)),
        sa.Column("method_version", sa.String(50), nullable=False, server_default="v1.0"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("input_dataset_versions_json", postgresql.JSONB, server_default="{}"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
    )

    # --- priority_scores ---
    op.create_table(
        "priority_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scoring_run_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("scoring_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("watershed_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("watersheds.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.Float, nullable=False),
        sa.Column("priority_category", sa.String(50), nullable=False),
        sa.Column("rank_position", sa.Integer, nullable=False),
        sa.Column("indicator_breakdown_json", postgresql.JSONB, server_default="{}"),
        sa.Column("data_completeness", sa.Float, server_default="1.0"),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("scoring_run_id", "watershed_id", name="uq_score_run_watershed"),
        sa.CheckConstraint("overall_score >= 0 AND overall_score <= 100", name="ck_score_range"),
        sa.CheckConstraint("data_completeness >= 0 AND data_completeness <= 1", name="ck_data_completeness_range"),
    )

    # --- scenarios ---
    op.create_table(
        "scenarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("baseline_scoring_run_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("scoring_runs.id", ondelete="SET NULL")),
        sa.Column("weights_json", postgresql.JSONB, nullable=False),
        sa.Column("assumptions_json", postgresql.JSONB, server_default="{}"),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- scenario_results ---
    op.create_table(
        "scenario_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("watershed_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("watersheds.id", ondelete="CASCADE"), nullable=False),
        sa.Column("baseline_score", sa.Float, nullable=False),
        sa.Column("scenario_score", sa.Float, nullable=False),
        sa.Column("baseline_rank", sa.Integer, nullable=False),
        sa.Column("scenario_rank", sa.Integer, nullable=False),
        sa.Column("score_delta", sa.Float, nullable=False),
        sa.Column("rank_delta", sa.Integer, nullable=False),
        sa.Column("indicator_breakdown_json", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("scenario_id", "watershed_id", name="uq_scenario_watershed"),
    )

    # --- Dashboard summary view ---
    op.execute("""
        CREATE OR REPLACE VIEW v_dashboard_summary AS
        SELECT
            (SELECT COUNT(*) FROM watersheds) AS total_watersheds,
            (SELECT COUNT(*) FROM priority_scores WHERE priority_category = 'critical') AS critical_count,
            (SELECT COUNT(*) FROM priority_scores WHERE priority_category = 'high') AS high_count,
            (SELECT COUNT(*) FROM datasets) AS total_datasets,
            (SELECT MAX(calculated_at) FROM priority_scores) AS last_scoring_date,
            (SELECT MAX(finished_at) FROM processing_jobs WHERE status = 'completed') AS last_processing_date
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_dashboard_summary")
    op.drop_table("scenario_results")
    op.drop_table("scenarios")
    op.drop_table("priority_scores")
    op.drop_table("scoring_runs")
    op.drop_table("scoring_profiles")
    op.drop_table("watershed_indicators")
    op.drop_table("processing_jobs")
    op.drop_table("dataset_versions")
    op.drop_table("datasets")
    op.drop_table("watersheds")
    op.drop_table("profiles")
