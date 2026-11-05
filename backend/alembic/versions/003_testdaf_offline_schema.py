"""add TestDaF offline daily package schema

Revision ID: 003_testdaf_offline_schema
Revises: 002_user_app_state
"""
from typing import Sequence

from alembic import op

revision: str = "003_testdaf_offline_schema"
down_revision: str | None = "002_user_app_state"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS learning_goals (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(80),
        target_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSON,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ix_learning_goals_user_id ON learning_goals(user_id);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(10);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS target_level VARCHAR(20);

    ALTER TABLE topics ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS cefr_min VARCHAR(10);
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS cefr_max VARCHAR(10);

    CREATE TABLE IF NOT EXISTS user_weak_skills (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill VARCHAR(30) NOT NULL,
        weight SMALLINT DEFAULT 1,
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, skill)
    );
    CREATE INDEX IF NOT EXISTS idx_user_weak_skills_user ON user_weak_skills(user_id);

    CREATE TABLE IF NOT EXISTS daily_packages (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id VARCHAR(36) REFERENCES topics(id) ON DELETE SET NULL,
        plan_type VARCHAR(80) DEFAULT 'testdaf',
        package_date DATE DEFAULT CURRENT_DATE,
        cefr_level VARCHAR(10) NOT NULL DEFAULT 'B1',
        status VARCHAR(20) DEFAULT 'generated',
        source VARCHAR(30) DEFAULT 'database',
        generated_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ,
        package_json JSONB,
        CONSTRAINT ck_daily_packages_status CHECK (status IN ('generated','in_progress','completed','archived','failed'))
    );
    CREATE INDEX IF NOT EXISTS idx_packages_user_date ON daily_packages(user_id, generated_at);
    CREATE INDEX IF NOT EXISTS idx_daily_packages_user_package_date ON daily_packages(user_id, package_date);

    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS package_id VARCHAR(36) REFERENCES daily_packages(id) ON DELETE CASCADE;
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS article VARCHAR(10);
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS plural_form VARCHAR(255);
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(10);
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS meaning_en TEXT;
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS meaning_native TEXT;
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS synonym VARCHAR(255);
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS antonym VARCHAR(255);
    ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS usage_note TEXT;
    CREATE INDEX IF NOT EXISTS idx_vocab_package ON vocabulary_items(package_id);

    CREATE TABLE IF NOT EXISTS vocabulary_collocations (
        id VARCHAR(36) PRIMARY KEY,
        vocabulary_id VARCHAR(36) NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
        collocation VARCHAR(255) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vocab_collocations_vocab ON vocabulary_collocations(vocabulary_id);

    CREATE TABLE IF NOT EXISTS user_learned_vocabulary (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word VARCHAR(255) NOT NULL,
        learned_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, word)
    );
    CREATE INDEX IF NOT EXISTS idx_learned_vocab_user ON user_learned_vocabulary(user_id, word);

    CREATE TABLE IF NOT EXISTS reading_texts (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        title VARCHAR(500),
        body TEXT NOT NULL,
        word_count INT,
        reading_time_min INT
    );
    CREATE INDEX IF NOT EXISTS idx_reading_texts_package ON reading_texts(package_id);

    CREATE TABLE IF NOT EXISTS reading_questions (
        id VARCHAR(36) PRIMARY KEY,
        reading_text_id VARCHAR(36) NOT NULL REFERENCES reading_texts(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        question_type VARCHAR(50),
        difficulty VARCHAR(20),
        answer_time_sec INT,
        options JSONB,
        correct_answer TEXT,
        explanation TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_reading_questions_text ON reading_questions(reading_text_id);

    CREATE TABLE IF NOT EXISTS reading_answers (
        id VARCHAR(36) PRIMARY KEY,
        question_id VARCHAR(36) NOT NULL REFERENCES reading_questions(id) ON DELETE CASCADE,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        submitted_answer TEXT,
        score NUMERIC(5,2),
        is_correct BOOLEAN,
        explanation TEXT,
        relevant_excerpt TEXT,
        improved_answer TEXT,
        submitted_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_reading_answers_user ON reading_answers(user_id, submitted_at);

    CREATE TABLE IF NOT EXISTS listening_scripts (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        title VARCHAR(500),
        transcript TEXT NOT NULL,
        duration_sec INT,
        speaking_speed_level VARCHAR(30),
        audio_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_listening_scripts_package ON listening_scripts(package_id);

    CREATE TABLE IF NOT EXISTS listening_questions (
        id VARCHAR(36) PRIMARY KEY,
        listening_script_id VARCHAR(36) NOT NULL REFERENCES listening_scripts(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        question_type VARCHAR(50),
        difficulty VARCHAR(20),
        answer_time_sec INT,
        options JSONB,
        correct_answer TEXT,
        explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS listening_answers (
        id VARCHAR(36) PRIMARY KEY,
        question_id VARCHAR(36) NOT NULL REFERENCES listening_questions(id) ON DELETE CASCADE,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        submitted_answer TEXT,
        score NUMERIC(5,2),
        is_correct BOOLEAN,
        explanation TEXT,
        relevant_excerpt TEXT,
        improved_answer TEXT,
        submitted_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_listening_answers_user ON listening_answers(user_id, submitted_at);

    CREATE TABLE IF NOT EXISTS speaking_tasks (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        prep_time_sec INT,
        speaking_time_sec INT,
        answer_structure TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_speaking_tasks_package ON speaking_tasks(package_id);

    CREATE TABLE IF NOT EXISTS speaking_task_helpers (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL REFERENCES speaking_tasks(id) ON DELETE CASCADE,
        helper_type VARCHAR(30),
        content TEXT NOT NULL
    );

    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS task_id VARCHAR(36) REFERENCES speaking_tasks(id) ON DELETE SET NULL;
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS fluency_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS grammar_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS vocab_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS coherence_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS formality_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS pronunciation_score NUMERIC(5,2);
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS improved_answer TEXT;
    ALTER TABLE speaking_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

    CREATE TABLE IF NOT EXISTS speaking_mistakes (
        id VARCHAR(36) PRIMARY KEY,
        submission_id VARCHAR(36) NOT NULL REFERENCES speaking_submissions(id) ON DELETE CASCADE,
        mistake_text TEXT,
        explanation TEXT,
        corrected_text TEXT
    );

    CREATE TABLE IF NOT EXISTS writing_tasks (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        task_text TEXT NOT NULL,
        min_words INT DEFAULT 150,
        max_words INT DEFAULT 250,
        writing_time_min INT,
        outline TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_writing_tasks_package ON writing_tasks(package_id);

    CREATE TABLE IF NOT EXISTS writing_task_helpers (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL REFERENCES writing_tasks(id) ON DELETE CASCADE,
        helper_type VARCHAR(30),
        content TEXT NOT NULL
    );

    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS task_id VARCHAR(36) REFERENCES writing_tasks(id) ON DELETE SET NULL;
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS submitted_text TEXT;
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS grammar_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS vocab_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS coherence_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS task_achievement_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS style_score NUMERIC(5,2);
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS improved_version TEXT;
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS model_version TEXT;
    ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

    CREATE TABLE IF NOT EXISTS writing_corrections (
        id VARCHAR(36) PRIMARY KEY,
        submission_id VARCHAR(36) NOT NULL REFERENCES writing_submissions(id) ON DELETE CASCADE,
        sentence_index INT,
        original_sentence TEXT,
        corrected_sentence TEXT,
        explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar_structures (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        title VARCHAR(255),
        explanation TEXT,
        formula TEXT,
        example_sentence TEXT,
        example_translation TEXT,
        common_mistakes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_grammar_structures_package ON grammar_structures(package_id);

    CREATE TABLE IF NOT EXISTS grammar_exercises (
        id VARCHAR(36) PRIMARY KEY,
        structure_id VARCHAR(36) NOT NULL REFERENCES grammar_structures(id) ON DELETE CASCADE,
        question TEXT,
        correct_answer TEXT
    );

    CREATE TABLE IF NOT EXISTS active_recall_questions (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        type VARCHAR(30),
        expected_answer TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_active_recall_package ON active_recall_questions(package_id);

    CREATE TABLE IF NOT EXISTS mini_test_items (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        skill VARCHAR(30),
        content JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_mini_test_package ON mini_test_items(package_id);

    CREATE TABLE IF NOT EXISTS daily_scores (
        id VARCHAR(36) PRIMARY KEY,
        package_id VARCHAR(36) NOT NULL REFERENCES daily_packages(id) ON DELETE CASCADE,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        wortschatz_score NUMERIC(5,2),
        lesen_score NUMERIC(5,2),
        hoeren_score NUMERIC(5,2),
        speaking_score NUMERIC(5,2),
        schreiben_score NUMERIC(5,2),
        grammar_score NUMERIC(5,2),
        overall_score NUMERIC(5,2),
        weak_points TEXT,
        recommendations TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_daily_scores_user ON daily_scores(user_id, created_at);
    """)


def downgrade() -> None:
    op.execute("""
    DROP TABLE IF EXISTS daily_scores CASCADE;
    DROP TABLE IF EXISTS mini_test_items CASCADE;
    DROP TABLE IF EXISTS active_recall_questions CASCADE;
    DROP TABLE IF EXISTS grammar_exercises CASCADE;
    DROP TABLE IF EXISTS grammar_structures CASCADE;
    DROP TABLE IF EXISTS writing_corrections CASCADE;
    DROP TABLE IF EXISTS writing_task_helpers CASCADE;
    DROP TABLE IF EXISTS writing_tasks CASCADE;
    DROP TABLE IF EXISTS speaking_mistakes CASCADE;
    DROP TABLE IF EXISTS speaking_task_helpers CASCADE;
    DROP TABLE IF EXISTS speaking_tasks CASCADE;
    DROP TABLE IF EXISTS listening_answers CASCADE;
    DROP TABLE IF EXISTS listening_questions CASCADE;
    DROP TABLE IF EXISTS listening_scripts CASCADE;
    DROP TABLE IF EXISTS reading_answers CASCADE;
    DROP TABLE IF EXISTS reading_questions CASCADE;
    DROP TABLE IF EXISTS reading_texts CASCADE;
    DROP TABLE IF EXISTS user_learned_vocabulary CASCADE;
    DROP TABLE IF EXISTS vocabulary_collocations CASCADE;
    DROP TABLE IF EXISTS daily_packages CASCADE;
    DROP TABLE IF EXISTS user_weak_skills CASCADE;
    DROP TABLE IF EXISTS learning_goals CASCADE;
    """)
