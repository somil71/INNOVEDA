"""Initial migration

Revision ID: 4e9968c07830
Revises:
Create Date: 2026-03-01 21:28:04.129502

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = '4e9968c07830'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("village", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
    )

    op.create_table(
        "patients",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("medical_history", sa.Text(), nullable=True),
        sa.Column("auto_pay_enabled", sa.Boolean(), default=False),
    )

    op.create_table(
        "doctors",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("specialization", sa.String(), nullable=True),
        sa.Column("consultation_fee", sa.Float(), default=0),
        sa.Column("rating", sa.Float(), default=0),
    )

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("date", sa.String(), nullable=False),
        sa.Column("status", sa.String(), default="pending"),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "ai_chat_history",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("requires_emergency", sa.Boolean(), default=False),
        sa.Column("extracted_symptoms", sa.Text(), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), default=False),
        sa.Column("safety_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "prescriptions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "medicines",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("prescription_id", sa.Integer(), sa.ForeignKey("prescriptions.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("dosage", sa.String(), nullable=False),
        sa.Column("duration", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), default=0),
    )

    op.create_table(
        "patient_cart_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("medicine_name", sa.String(), nullable=False),
        sa.Column("dosage", sa.String(), nullable=True),
        sa.Column("duration", sa.String(), nullable=True),
        sa.Column("price", sa.Float(), default=0),
        sa.Column("added_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "disease_reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("village", sa.String(), nullable=False),
        sa.Column("disease_type", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "outbreak_events",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("village", sa.String(), nullable=False, index=True),
        sa.Column("disease_type", sa.String(), nullable=False, index=True),
        sa.Column("detection_method", sa.String(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("baseline", sa.Float(), nullable=False),
        sa.Column("current_count", sa.Integer(), nullable=False),
        sa.Column("week_start", sa.String(), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "emergency_requests",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("emergency_requests")
    op.drop_table("outbreak_events")
    op.drop_table("disease_reports")
    op.drop_table("documents")
    op.drop_table("patient_cart_items")
    op.drop_table("medicines")
    op.drop_table("prescriptions")
    op.drop_table("ai_chat_history")
    op.drop_table("messages")
    op.drop_table("appointments")
    op.drop_table("doctors")
    op.drop_table("patients")
    op.drop_table("users")
