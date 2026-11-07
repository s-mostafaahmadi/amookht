"""premium personal PDF and notes library

Revision ID: 010_premium_library
Revises: 009_global_content_entries
"""
from typing import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "010_premium_library"
down_revision: str | None = "009_global_content_entries"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table("library_folders", sa.Column("id", sa.String(36), nullable=False), sa.Column("user_id", sa.String(36), nullable=False), sa.Column("parent_id", sa.String(36)), sa.Column("name", sa.String(120), nullable=False), sa.Column("color", sa.String(20), server_default="#7c3aed", nullable=False), sa.Column("position", sa.Integer(), server_default="0", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["parent_id"], ["library_folders.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("user_id", "parent_id", "name", name="uq_library_folder_sibling_name"))
    op.create_index("ix_library_folders_user_id", "library_folders", ["user_id"]); op.create_index("ix_library_folders_user_parent", "library_folders", ["user_id", "parent_id"])
    op.create_table("library_documents", sa.Column("id", sa.String(36), nullable=False), sa.Column("user_id", sa.String(36), nullable=False), sa.Column("folder_id", sa.String(36)), sa.Column("title", sa.String(240), nullable=False), sa.Column("original_filename", sa.String(255), nullable=False), sa.Column("storage_key", sa.String(500), nullable=False), sa.Column("mime_type", sa.String(100), server_default="application/pdf", nullable=False), sa.Column("size_bytes", sa.Integer(), nullable=False), sa.Column("page_count", sa.Integer()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.CheckConstraint("size_bytes > 0", name="ck_library_document_positive_size"), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["folder_id"], ["library_folders.id"], ondelete="SET NULL"), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("storage_key"))
    op.create_index("ix_library_documents_user_id", "library_documents", ["user_id"]); op.create_index("ix_library_documents_user_folder_updated", "library_documents", ["user_id", "folder_id", "updated_at"])
    op.create_table("library_notes", sa.Column("id", sa.String(36), nullable=False), sa.Column("user_id", sa.String(36), nullable=False), sa.Column("folder_id", sa.String(36)), sa.Column("title", sa.String(240), nullable=False), sa.Column("content", sa.Text(), server_default="", nullable=False), sa.Column("color", sa.String(20), server_default="#fef3c7", nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["folder_id"], ["library_folders.id"], ondelete="SET NULL"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_library_notes_user_id", "library_notes", ["user_id"]); op.create_index("ix_library_notes_user_folder_updated", "library_notes", ["user_id", "folder_id", "updated_at"])
    op.create_table("pdf_annotations", sa.Column("id", sa.String(36), nullable=False), sa.Column("user_id", sa.String(36), nullable=False), sa.Column("document_id", sa.String(36), nullable=False), sa.Column("page_number", sa.Integer(), nullable=False), sa.Column("annotation_type", sa.String(20), nullable=False), sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False), sa.CheckConstraint("page_number >= 1", name="ck_pdf_annotation_page"), sa.CheckConstraint("annotation_type IN ('pen','highlight','underline','strikeout','text')", name="ck_pdf_annotation_type"), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["document_id"], ["library_documents.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_pdf_annotations_user_id", "pdf_annotations", ["user_id"]); op.create_index("ix_pdf_annotations_document_id", "pdf_annotations", ["document_id"]); op.create_index("ix_pdf_annotations_document_page", "pdf_annotations", ["document_id", "page_number"])


def downgrade() -> None:
    op.drop_table("pdf_annotations"); op.drop_table("library_notes"); op.drop_table("library_documents"); op.drop_table("library_folders")
