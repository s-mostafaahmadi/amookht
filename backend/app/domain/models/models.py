import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    String, Boolean, Integer, Float, Text, Date, DateTime,
    ForeignKey, CheckConstraint, UniqueConstraint, Index, JSON, ARRAY,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.connection import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    access_role: Mapped[str] = mapped_column(String(20), nullable=False, default="normal", server_default="normal")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(back_populates="user", uselist=False)
    goals: Mapped[list["LearningGoal"]] = relationship(back_populates="user")
    sessions: Mapped[list["LearningSession"]] = relationship(back_populates="user")
    skill_levels: Mapped[list["SkillLevel"]] = relationship(back_populates="user")
    error_records: Mapped[list["ErrorRecord"]] = relationship(back_populates="user")
    vocabulary_progress: Mapped[list["VocabularyProgress"]] = relationship(back_populates="user")
    writing_submissions: Mapped[list["WritingSubmission"]] = relationship(back_populates="user")
    speaking_submissions: Mapped[list["SpeakingSubmission"]] = relationship(back_populates="user")
    learning_plans: Mapped[list["LearningPlan"]] = relationship(back_populates="user")
    daily_analytics: Mapped[list["DailyAnalytics"]] = relationship(back_populates="user")
    app_state: Mapped[Optional["UserAppState"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    current_level: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    target_exam: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    target_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    exam_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    native_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    study_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_study_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_study_minutes: Mapped[int] = mapped_column(Integer, default=0)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="profile")


class LearningGoal(Base):
    __tablename__ = "learning_goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="goals")

class UserAppState(Base):
    """Versioned full client state for cross-device continuity."""
    __tablename__ = "user_app_states"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    schema_version: Mapped[int] = mapped_column(Integer, default=1)
    state_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="app_state")

class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    skills: Mapped[list["Skill"]] = relationship(back_populates="module")
    topics: Mapped[list["Topic"]] = relationship(back_populates="module")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="module")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    parent_skill_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("skills.id"), nullable=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_level: Mapped[int] = mapped_column(Integer, default=10)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("module_id", "slug", name="uq_skills_module_slug"),
    )

    module: Mapped["Module"] = relationship(back_populates="skills")
    parent_skill: Mapped[Optional["Skill"]] = relationship(remote_side="Skill.id")
    sub_skills: Mapped[list["Skill"]] = relationship(back_populates="parent_skill")
    skill_levels: Mapped[list["SkillLevel"]] = relationship(back_populates="skill")


class SkillLevel(Base):
    __tablename__ = "skill_levels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"))
    level: Mapped[int] = mapped_column(Integer, default=1)
    experience: Mapped[int] = mapped_column(Integer, default=0)
    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_practice_seconds: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_skill_levels_user_skill"),
        CheckConstraint("level >= 1 AND level <= 10", name="ck_skill_levels_level_range"),
    )

    user: Mapped["User"] = relationship(back_populates="skill_levels")
    skill: Mapped["Skill"] = relationship(back_populates="skill_levels")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    parent_topic_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("topics.id"), nullable=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1)
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    content: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("module_id", "slug", name="uq_topics_module_slug"),
    )

    module: Mapped["Module"] = relationship(back_populates="topics")
    parent_topic: Mapped[Optional["Topic"]] = relationship(remote_side="Topic.id")
    sub_topics: Mapped[list["Topic"]] = relationship(back_populates="parent_topic")
    vocabulary_items: Mapped[list["VocabularyItem"]] = relationship(back_populates="topic")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="topic")


class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id"))
    mastery_level: Mapped[str] = mapped_column(String(20), default="not_started")
    score: Mapped[float] = mapped_column(Float, default=0)
    completed_exercises: Mapped[int] = mapped_column(Integer, default=0)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0)
    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_topic_mastery_user_topic"),
        CheckConstraint(
            "mastery_level IN ('not_started', 'in_progress', 'review', 'mastered')",
            name="ck_topic_mastery_level"
        ),
    )


class VocabularyItem(Base):
    __tablename__ = "vocabulary_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    topic_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("topics.id"), nullable=True)
    word: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    translation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    definition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    example_sentence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    example_translation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    part_of_speech: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1)
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(String), default=list)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    module: Mapped["Module"] = relationship()
    topic: Mapped[Optional["Topic"]] = relationship(back_populates="vocabulary_items")
    progress_records: Mapped[list["VocabularyProgress"]] = relationship(back_populates="vocabulary_item")


class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    vocabulary_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("vocabulary_items.id"))
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_quality: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    correct_streak: Mapped[int] = mapped_column(Integer, default=0)
    is_mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "vocabulary_item_id", name="uq_vocab_progress_user_item"),
        CheckConstraint("last_quality >= 0 AND last_quality <= 5", name="ck_vocab_progress_quality"),
    )

    user: Mapped["User"] = relationship(back_populates="vocabulary_progress")
    vocabulary_item: Mapped["VocabularyItem"] = relationship(back_populates="progress_records")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    topic_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("topics.id"), nullable=True)
    skill_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("skills.id"), nullable=True)
    exercise_type: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    correct_answer: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hints: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    estimated_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "exercise_type IN ('grammar', 'vocabulary', 'writing_prompt', 'speaking_prompt', "
            "'listening', 'reading', 'fill_blank', 'translation', 'multiple_choice')",
            name="ck_exercises_type"
        ),
    )

    module: Mapped["Module"] = relationship(back_populates="exercises")
    topic: Mapped[Optional["Topic"]] = relationship(back_populates="exercises")
    results: Mapped[list["ExerciseResult"]] = relationship(back_populates="exercise")


class ExerciseResult(Base):
    __tablename__ = "exercise_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    exercise_id: Mapped[str] = mapped_column(String(36), ForeignKey("exercises.id"))
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("learning_sessions.id"), nullable=True)
    user_answer: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    exercise: Mapped["Exercise"] = relationship(back_populates="results")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    session_type: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    summary: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "session_type IN ('practice', 'review', 'exam', 'writing', 'speaking', 'plan')",
            name="ck_sessions_type"
        ),
    )

    user: Mapped["User"] = relationship(back_populates="sessions")


class ErrorRecord(Base):
    __tablename__ = "error_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    exercise_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("exercises.id"), nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("learning_sessions.id"), nullable=True)
    error_type: Mapped[str] = mapped_column(String(50), nullable=False)
    error_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="exercise")
    severity: Mapped[float] = mapped_column(Float, default=1.0)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "error_type IN ('grammar', 'vocabulary', 'spelling', 'style', "
            "'coherence', 'argumentation', 'pronunciation', 'fluency')",
            name="ck_errors_type"
        ),
        CheckConstraint(
            "source IN ('exercise', 'writing', 'speaking', 'manual')",
            name="ck_errors_source"
        ),
        Index("idx_errors_user_unresolved", "user_id", postgresql_where="is_resolved = FALSE"),
    )

    user: Mapped["User"] = relationship(back_populates="error_records")
    review: Mapped[Optional["ErrorReview"]] = relationship(back_populates="error_record", uselist=False)


class ErrorReview(Base):
    __tablename__ = "error_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    error_record_id: Mapped[str] = mapped_column(String(36), ForeignKey("error_records.id", ondelete="CASCADE"), unique=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_quality: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    mastered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("last_quality >= 0 AND last_quality <= 5", name="ck_error_reviews_quality"),
        Index("idx_error_reviews_due", "user_id", "next_review_date", postgresql_where="is_mastered = FALSE"),
    )

    error_record: Mapped["ErrorRecord"] = relationship(back_populates="review")


class WritingSubmission(Base):
    __tablename__ = "writing_submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    topic_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("topics.id"), nullable=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'submitted', 'evaluated', 'revised')", name="ck_writing_status"),
    )

    user: Mapped["User"] = relationship(back_populates="writing_submissions")
    versions: Mapped[list["WritingVersion"]] = relationship(back_populates="submission", order_by="WritingVersion.version_number")


class WritingVersion(Base):
    __tablename__ = "writing_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("writing_submissions.id", ondelete="CASCADE"))
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("submission_id", "version_number", name="uq_writing_version"),
    )

    submission: Mapped["WritingSubmission"] = relationship(back_populates="versions")
    evaluation: Mapped[Optional["WritingEvaluation"]] = relationship(back_populates="version", uselist=False)


class WritingEvaluation(Base):
    __tablename__ = "writing_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    version_id: Mapped[str] = mapped_column(String(36), ForeignKey("writing_versions.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    grammar_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vocabulary_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coherence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    argumentation_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    structure_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inline_corrections: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    suggestions: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    llm_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    llm_tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evaluation_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    version: Mapped["WritingVersion"] = relationship(back_populates="evaluation")


class SpeakingSubmission(Base):
    __tablename__ = "speaking_submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("modules.id"))
    topic_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("topics.id"), nullable=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="submitted")
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("status IN ('submitted', 'transcribing', 'evaluated')", name="ck_speaking_status"),
    )

    user: Mapped["User"] = relationship(back_populates="speaking_submissions")
    evaluation: Mapped[Optional["SpeakingEvaluation"]] = relationship(back_populates="submission", uselist=False)


class SpeakingEvaluation(Base):
    __tablename__ = "speaking_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("speaking_submissions.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    grammar_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vocabulary_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fluency_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pronunciation_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coherence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    argumentation_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    corrections: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    suggestions: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    llm_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    llm_tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evaluation_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    submission: Mapped["SpeakingSubmission"] = relationship(back_populates="evaluation")


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    plan_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    completion_percentage: Mapped[float] = mapped_column(Float, default=0)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "plan_date", name="uq_learning_plan_user_date"),
        CheckConstraint("status IN ('active', 'completed', 'skipped', 'modified')", name="ck_plan_status"),
    )

    user: Mapped["User"] = relationship(back_populates="learning_plans")


class DailyAnalytics(Base):
    __tablename__ = "daily_analytics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    analysis_date: Mapped[date] = mapped_column(Date, nullable=False)
    study_minutes: Mapped[int] = mapped_column(Integer, default=0)
    exercises_completed: Mapped[int] = mapped_column(Integer, default=0)
    accuracy_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    new_errors_count: Mapped[int] = mapped_column(Integer, default=0)
    resolved_errors_count: Mapped[int] = mapped_column(Integer, default=0)
    writing_sessions: Mapped[int] = mapped_column(Integer, default=0)
    speaking_sessions: Mapped[int] = mapped_column(Integer, default=0)
    skill_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    top_weaknesses: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    recommendations: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "analysis_date", name="uq_daily_analytics_user_date"),
    )

    user: Mapped["User"] = relationship(back_populates="daily_analytics")


class RAGDocument(Base):
    __tablename__ = "rag_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    module_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("modules.id"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    chunk_total: Mapped[int] = mapped_column(Integer, default=1)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # pgvector in production
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AIEvaluationLog(Base):
    __tablename__ = "ai_evaluation_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    evaluation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    input_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

