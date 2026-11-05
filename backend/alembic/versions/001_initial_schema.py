"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preferences', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    # User Profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True),
        sa.Column('current_level', sa.String(5), nullable=True),
        sa.Column('target_exam', sa.String(50), nullable=True),
        sa.Column('target_level', sa.String(20), nullable=True),
        sa.Column('exam_date', sa.Date(), nullable=True),
        sa.Column('native_language', sa.String(10), nullable=True),
        sa.Column('study_streak', sa.Integer(), default=0),
        sa.Column('last_study_date', sa.Date(), nullable=True),
        sa.Column('total_study_minutes', sa.Integer(), default=0),
        sa.Column('metadata', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Modules table
    op.create_table(
        'modules',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('slug', sa.String(50), unique=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Skills table
    op.create_table(
        'skills',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('parent_skill_id', sa.String(36), sa.ForeignKey('skills.id'), nullable=True),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('max_level', sa.Integer(), default=10),
        sa.Column('weight', sa.Float(), default=1.0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('module_id', 'slug', name='uq_skills_module_slug'),
    )

    # Skill Levels table
    op.create_table(
        'skill_levels',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('skill_id', sa.String(36), sa.ForeignKey('skills.id')),
        sa.Column('level', sa.Integer(), default=1),
        sa.Column('experience', sa.Integer(), default=0),
        sa.Column('last_practiced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_practice_seconds', sa.Integer(), default=0),
        sa.Column('correct_count', sa.Integer(), default=0),
        sa.Column('incorrect_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'skill_id', name='uq_skill_levels_user_skill'),
        sa.CheckConstraint('level >= 1 AND level <= 10', name='ck_skill_levels_level_range'),
    )

    # Topics table
    op.create_table(
        'topics',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('parent_topic_id', sa.String(36), sa.ForeignKey('topics.id'), nullable=True),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('difficulty_level', sa.Integer(), default=1),
        sa.Column('estimated_minutes', sa.Integer(), nullable=True),
        sa.Column('content', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('module_id', 'slug', name='uq_topics_module_slug'),
    )

    # Vocabulary Items table
    op.create_table(
        'vocabulary_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('topic_id', sa.String(36), sa.ForeignKey('topics.id'), nullable=True),
        sa.Column('word', sa.String(200), nullable=False, index=True),
        sa.Column('translation', sa.String(200), nullable=True),
        sa.Column('definition', sa.Text(), nullable=True),
        sa.Column('example_sentence', sa.Text(), nullable=True),
        sa.Column('example_translation', sa.Text(), nullable=True),
        sa.Column('part_of_speech', sa.String(20), nullable=True),
        sa.Column('difficulty_level', sa.Integer(), default=1),
        sa.Column('audio_url', sa.String(500), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String), default=list),
        sa.Column('metadata', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Vocabulary Progress table
    op.create_table(
        'vocabulary_progress',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('vocabulary_item_id', sa.String(36), sa.ForeignKey('vocabulary_items.id')),
        sa.Column('ease_factor', sa.Float(), default=2.5),
        sa.Column('interval_days', sa.Integer(), default=1),
        sa.Column('repetitions', sa.Integer(), default=0),
        sa.Column('next_review_date', sa.Date(), nullable=False),
        sa.Column('last_review_date', sa.Date(), nullable=True),
        sa.Column('last_quality', sa.Integer(), nullable=True),
        sa.Column('total_reviews', sa.Integer(), default=0),
        sa.Column('correct_streak', sa.Integer(), default=0),
        sa.Column('is_mastered', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'vocabulary_item_id', name='uq_vocab_progress_user_item'),
    )

    # Exercises table
    op.create_table(
        'exercises',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('topic_id', sa.String(36), sa.ForeignKey('topics.id'), nullable=True),
        sa.Column('skill_id', sa.String(36), sa.ForeignKey('skills.id'), nullable=True),
        sa.Column('exercise_type', sa.String(50), nullable=False),
        sa.Column('difficulty_level', sa.Integer(), default=1),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('correct_answer', sa.JSON(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('hints', sa.JSON(), default=list),
        sa.Column('estimated_seconds', sa.Integer(), nullable=True),
        sa.Column('is_ai_generated', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Learning Sessions table
    op.create_table(
        'learning_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('session_type', sa.String(50), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('summary', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Exercise Results table
    op.create_table(
        'exercise_results',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('exercise_id', sa.String(36), sa.ForeignKey('exercises.id')),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('learning_sessions.id'), nullable=True),
        sa.Column('user_answer', sa.JSON(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('time_spent_seconds', sa.Integer(), nullable=True),
        sa.Column('feedback', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Error Records table
    op.create_table(
        'error_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('exercise_id', sa.String(36), sa.ForeignKey('exercises.id'), nullable=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('learning_sessions.id'), nullable=True),
        sa.Column('error_type', sa.String(50), nullable=False),
        sa.Column('error_category', sa.String(100), nullable=True),
        sa.Column('error_subcategory', sa.String(100), nullable=True),
        sa.Column('user_answer', sa.Text(), nullable=False),
        sa.Column('correct_answer', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('context', sa.Text(), nullable=True),
        sa.Column('source', sa.String(50), default='exercise'),
        sa.Column('severity', sa.Float(), default=1.0),
        sa.Column('is_resolved', sa.Boolean(), default=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Error Reviews table
    op.create_table(
        'error_reviews',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('error_record_id', sa.String(36), sa.ForeignKey('error_records.id', ondelete='CASCADE'), unique=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('ease_factor', sa.Float(), default=2.5),
        sa.Column('interval_days', sa.Integer(), default=1),
        sa.Column('repetitions', sa.Integer(), default=0),
        sa.Column('next_review_date', sa.Date(), nullable=False),
        sa.Column('last_review_date', sa.Date(), nullable=True),
        sa.Column('last_quality', sa.Integer(), nullable=True),
        sa.Column('review_count', sa.Integer(), default=0),
        sa.Column('is_mastered', sa.Boolean(), default=False),
        sa.Column('mastered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Writing Submissions table
    op.create_table(
        'writing_submissions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('topic_id', sa.String(36), sa.ForeignKey('topics.id'), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('current_version', sa.Integer(), default=1),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Writing Versions table
    op.create_table(
        'writing_versions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('submission_id', sa.String(36), sa.ForeignKey('writing_submissions.id', ondelete='CASCADE')),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('word_count', sa.Integer(), nullable=True),
        sa.Column('time_spent_seconds', sa.Integer(), nullable=True),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('submission_id', 'version_number', name='uq_writing_version'),
    )

    # Writing Evaluations table
    op.create_table(
        'writing_evaluations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('version_id', sa.String(36), sa.ForeignKey('writing_versions.id', ondelete='CASCADE')),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('grammar_score', sa.Float(), nullable=True),
        sa.Column('vocabulary_score', sa.Float(), nullable=True),
        sa.Column('coherence_score', sa.Float(), nullable=True),
        sa.Column('argumentation_score', sa.Float(), nullable=True),
        sa.Column('structure_score', sa.Float(), nullable=True),
        sa.Column('feedback_summary', sa.Text(), nullable=True),
        sa.Column('inline_corrections', sa.JSON(), default=list),
        sa.Column('suggestions', sa.JSON(), default=list),
        sa.Column('llm_model', sa.String(100), nullable=True),
        sa.Column('llm_tokens_used', sa.Integer(), nullable=True),
        sa.Column('evaluation_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Speaking Submissions table
    op.create_table(
        'speaking_submissions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id')),
        sa.Column('topic_id', sa.String(36), sa.ForeignKey('topics.id'), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('audio_url', sa.String(500), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(20), default='submitted'),
        sa.Column('metadata', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Speaking Evaluations table
    op.create_table(
        'speaking_evaluations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('submission_id', sa.String(36), sa.ForeignKey('speaking_submissions.id', ondelete='CASCADE')),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('grammar_score', sa.Float(), nullable=True),
        sa.Column('vocabulary_score', sa.Float(), nullable=True),
        sa.Column('fluency_score', sa.Float(), nullable=True),
        sa.Column('pronunciation_score', sa.Float(), nullable=True),
        sa.Column('coherence_score', sa.Float(), nullable=True),
        sa.Column('argumentation_score', sa.Float(), nullable=True),
        sa.Column('feedback_summary', sa.Text(), nullable=True),
        sa.Column('corrections', sa.JSON(), default=list),
        sa.Column('suggestions', sa.JSON(), default=list),
        sa.Column('llm_model', sa.String(100), nullable=True),
        sa.Column('llm_tokens_used', sa.Integer(), nullable=True),
        sa.Column('evaluation_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Learning Plans table
    op.create_table(
        'learning_plans',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('plan_date', sa.Date(), nullable=False),
        sa.Column('plan_data', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('completion_percentage', sa.Float(), default=0),
        sa.Column('ai_generated', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'plan_date', name='uq_learning_plan_user_date'),
    )

    # Daily Analytics table
    op.create_table(
        'daily_analytics',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE')),
        sa.Column('analysis_date', sa.Date(), nullable=False),
        sa.Column('study_minutes', sa.Integer(), default=0),
        sa.Column('exercises_completed', sa.Integer(), default=0),
        sa.Column('accuracy_rate', sa.Float(), nullable=True),
        sa.Column('new_errors_count', sa.Integer(), default=0),
        sa.Column('resolved_errors_count', sa.Integer(), default=0),
        sa.Column('writing_sessions', sa.Integer(), default=0),
        sa.Column('speaking_sessions', sa.Integer(), default=0),
        sa.Column('skill_snapshot', sa.JSON(), default=dict),
        sa.Column('top_weaknesses', sa.JSON(), default=list),
        sa.Column('recommendations', sa.JSON(), default=list),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'analysis_date', name='uq_daily_analytics_user_date'),
    )

    # RAG Documents table
    op.create_table(
        'rag_documents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('module_id', sa.String(36), sa.ForeignKey('modules.id'), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('source_name', sa.String(200), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), default=0),
        sa.Column('chunk_total', sa.Integer(), default=1),
        sa.Column('embedding', sa.JSON(), nullable=True),
        sa.Column('metadata', sa.JSON(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # AI Evaluation Logs table
    op.create_table(
        'ai_evaluation_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('evaluation_type', sa.String(50), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=True),
        sa.Column('output_tokens', sa.Integer(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('cost_usd', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), default=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('request_payload', sa.JSON(), nullable=True),
        sa.Column('response_payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('ai_evaluation_logs')
    op.drop_table('rag_documents')
    op.drop_table('daily_analytics')
    op.drop_table('learning_plans')
    op.drop_table('speaking_evaluations')
    op.drop_table('speaking_submissions')
    op.drop_table('writing_evaluations')
    op.drop_table('writing_versions')
    op.drop_table('writing_submissions')
    op.drop_table('error_reviews')
    op.drop_table('error_records')
    op.drop_table('exercise_results')
    op.drop_table('learning_sessions')
    op.drop_table('exercises')
    op.drop_table('vocabulary_progress')
    op.drop_table('vocabulary_items')
    op.drop_table('topics')
    op.drop_table('skill_levels')
    op.drop_table('skills')
    op.drop_table('modules')
    op.drop_table('user_profiles')
    op.drop_table('users')
