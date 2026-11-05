-- ============================================================
-- TestDaF Lernplan - Database Schema + Spaced Repetition
-- PostgreSQL 16
-- ============================================================

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USER ACCOUNTS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. USER PROFILE (سطح، تاریخ آزمون، استریک)
-- ============================================================
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_level       VARCHAR(5),           -- A1, A2, B1, B2, C1
    target_exam         VARCHAR(50),          -- TestDaF, DSH, Goethe
    target_level        VARCHAR(20),          -- TDN 3, TDN 4, TDN 5
    exam_date           DATE,
    native_language     VARCHAR(10),          -- fa, ar, en, ...
    study_streak        INTEGER DEFAULT 0,
    last_study_date     DATE,
    total_study_minutes INTEGER DEFAULT 0,
    daily_minutes_goal  INTEGER DEFAULT 60,
    weak_skills         JSONB DEFAULT '[]',   -- ["grammar","vocab"]
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. MODULES (TestDaF sections)
-- ============================================================
CREATE TABLE modules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    config      JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert TestDaF modules
INSERT INTO modules (slug, name, description, config) VALUES
('testdaf', 'TestDaF', 'TestDaF Prüfungsvorbereitung', '{"sections":["lesen","hoeren","schreiben","sprechen"]}'),
('grammatik', 'Grammatik', 'Deutsche Grammatik', '{}'),
('vokabeln', 'Vokabeln', 'Wortschatz Training', '{}');

-- ============================================================
-- 4. ERROR RECORDS (دفتر اشتباهات)
-- ============================================================
CREATE TABLE error_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id         UUID,
    session_id          UUID,

    -- دسته‌بندی اشتباه
    error_type          VARCHAR(50) NOT NULL,   -- grammar, vocabulary, spelling, style, coherence
    error_category      VARCHAR(100),           -- Artikel, Kasus, Konjugation, ...
    error_subcategory   VARCHAR(100),           -- Genitiv, Dativ, ...

    -- محتوا
    user_answer         TEXT NOT NULL,          -- پاسخ اشتباه کاربر
    correct_answer      TEXT NOT NULL,          -- پاسخ صحیح
    explanation         TEXT,                   -- توضیح به فارسی/آلمانی
    context             TEXT,                   -- جمله یا متن اصلی
    source              VARCHAR(50) DEFAULT 'exercise', -- exercise, writing, speaking, manual

    -- اولویت و شدت
    severity            FLOAT DEFAULT 1.0,      -- 0.5=کم, 1.0=متوسط, 2.0=زیاد
    is_resolved         BOOLEAN DEFAULT FALSE,
    resolved_at         TIMESTAMPTZ,

    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ck_errors_type CHECK (
        error_type IN ('grammar','vocabulary','spelling','style','coherence','argumentation','pronunciation','fluency')
    ),
    CONSTRAINT ck_errors_source CHECK (
        source IN ('exercise','writing','speaking','manual','testdaf')
    )
);

CREATE INDEX idx_errors_user_unresolved ON error_records(user_id) WHERE is_resolved = FALSE;
CREATE INDEX idx_errors_user_type ON error_records(user_id, error_type);
CREATE INDEX idx_errors_created ON error_records(created_at DESC);

-- ============================================================
-- 5. ERROR REVIEWS (برنامه مرور اشتباهات - Spaced Repetition)
-- ============================================================
--
-- منطق مرور:
--   بار اول:  همان روز (امروز)
--   بار دوم:  +3 روز
--   بار سوم:  +7 روز
--   بار چهارم: +30 روز
--   بار پنجم:  +120 روز
--   بعد از 5 بار مرور صحیح: "mastered" = True
--
CREATE TABLE error_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_record_id     UUID UNIQUE NOT NULL REFERENCES error_records(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Spaced Repetition fields (SM-2 variant)
    ease_factor         FLOAT DEFAULT 2.5,      -- ضریب سختی (1.3 - 3.0)
    interval_days       INTEGER DEFAULT 0,       -- فاصله فعلی به روز
    repetitions         INTEGER DEFAULT 0,       -- تعداد مرورهای موفق
    next_review_date    DATE NOT NULL,           -- تاریخ مرور بعدی
    last_review_date    DATE,                    -- تاریخ آخرین مرور
    last_quality        INTEGER,                 -- کیفیت آخرین مرور (0-5)

    -- Schedule: fixed intervals
    review_count        INTEGER DEFAULT 0,       -- تعداد کل مرورها
    scheduled_dates     JSONB DEFAULT '[]',      -- ["2026-07-25","2026-07-28","2026-08-01",...]

    is_mastered         BOOLEAN DEFAULT FALSE,   -- آیا کامل یاد گرفته؟
    mastered_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ck_error_reviews_quality CHECK (
        last_quality IS NULL OR (last_quality >= 0 AND last_quality <= 5)
    )
);

CREATE INDEX idx_error_reviews_due ON error_reviews(user_id, next_review_date)
    WHERE is_mastered = FALSE;
CREATE INDEX idx_error_reviews_user ON error_reviews(user_id);

-- ============================================================
-- 6. ERROR REVIEW HISTORY (تاریخچه مرورها)
-- ============================================================
CREATE TABLE error_review_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id       UUID NOT NULL REFERENCES error_reviews(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quality         INTEGER NOT NULL,           -- 0=فراموش, 1=سخت, 2=مشکل, 3=قبول, 4=آسان, 5=عالی
    time_spent_sec  INTEGER,
    reviewed_at     TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ck_review_history_quality CHECK (quality >= 0 AND quality <= 5)
);

CREATE INDEX idx_review_history_review ON error_review_history(review_id);

-- ============================================================
-- 7. VOCABULARY (کلمات)
-- ============================================================
CREATE TABLE vocabulary_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id           UUID REFERENCES modules(id),
    word                VARCHAR(200) NOT NULL,
    translation         VARCHAR(200),
    translation_fa      VARCHAR(200),           -- ترجمه فارسی
    definition          TEXT,
    example_sentence    TEXT,
    example_translation TEXT,
    part_of_speech      VARCHAR(20),
    difficulty_level    INTEGER DEFAULT 1,
    level               VARCHAR(5),             -- A1, A2, B1, B2, C1
    tags                TEXT[],
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocab_word ON vocabulary_items(word);
CREATE INDEX idx_vocab_level ON vocabulary_items(level);

CREATE TABLE vocabulary_progress (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_item_id  UUID NOT NULL REFERENCES vocabulary_items(id),

    ease_factor         FLOAT DEFAULT 2.5,
    interval_days       INTEGER DEFAULT 1,
    repetitions         INTEGER DEFAULT 0,
    next_review_date    DATE NOT NULL,
    last_review_date    DATE,
    last_quality        INTEGER,
    total_reviews       INTEGER DEFAULT 0,
    correct_streak      INTEGER DEFAULT 0,
    is_mastered         BOOLEAN DEFAULT FALSE,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_vocab_progress_user_item UNIQUE (user_id, vocabulary_item_id),
    CONSTRAINT ck_vocab_progress_quality CHECK (
        last_quality IS NULL OR (last_quality >= 0 AND last_quality <= 5)
    )
);

-- ============================================================
-- 8. LEARNING PLANS
-- ============================================================
CREATE TABLE learning_plans (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date               DATE NOT NULL,
    plan_data               JSONB NOT NULL,
    status                  VARCHAR(20) DEFAULT 'active',
    completion_percentage   FLOAT DEFAULT 0,
    ai_generated            BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_learning_plan_user_date UNIQUE (user_id, plan_date),
    CONSTRAINT ck_plan_status CHECK (status IN ('active','completed','skipped','modified'))
);

-- ============================================================
-- 9. DAILY ANALYTICS
-- ============================================================
CREATE TABLE daily_analytics (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_date           DATE NOT NULL,
    study_minutes           INTEGER DEFAULT 0,
    exercises_completed     INTEGER DEFAULT 0,
    accuracy_rate           FLOAT,
    new_errors_count        INTEGER DEFAULT 0,
    resolved_errors_count   INTEGER DEFAULT 0,
    total_points            INTEGER DEFAULT 0,
    streak_day              BOOLEAN DEFAULT FALSE,
    skill_snapshot          JSONB DEFAULT '{}',
    top_weaknesses          JSONB DEFAULT '[]',
    recommendations         JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_daily_analytics_user_date UNIQUE (user_id, analysis_date)
);

-- ============================================================
-- 10. LEARNING SESSIONS
-- ============================================================
CREATE TABLE learning_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type    VARCHAR(50) NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration_seconds INTEGER,
    summary         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ck_sessions_type CHECK (
        session_type IN ('practice','review','exam','writing','speaking','plan','error_review')
    )
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_error_reviews_updated BEFORE UPDATE ON error_reviews
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_vocab_progress_updated BEFORE UPDATE ON vocabulary_progress
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- SPACED REPETITION FUNCTION (اشتباهات)
-- ============================================================
--
-- منطق ثابت: 0 → 3 → 7 → 30 → 120 روز
-- اگر کاربر 5 بار متوالی "خوب" (quality >= 3) جواب بده → mastered
--
CREATE OR REPLACE FUNCTION calculate_next_review(
    p_review_count INTEGER,
    p_last_quality INTEGER
) RETURNS TABLE (
    out_next_date DATE,
    out_interval INTEGER,
    out_is_mastered BOOLEAN
) AS $$
DECLARE
    v_intervals INTEGER[] := ARRAY[0, 3, 7, 30, 120];
    v_next_interval INTEGER;
    v_next_date DATE;
    v_mastered BOOLEAN := FALSE;
BEGIN
    -- If quality is bad (0-2), repeat at current interval
    IF p_last_quality < 3 THEN
        -- Stay at same review step, just delay by half interval
        IF p_review_count <= array_length(v_intervals, 1) THEN
            v_next_interval := GREATEST(1, v_intervals[p_review_count] / 2);
        ELSE
            v_next_interval := 1;
        END IF;
    ELSE
        -- Good answer: move to next interval
        IF p_review_count < array_length(v_intervals, 1) THEN
            v_next_interval := v_intervals[p_review_count + 1];
        ELSE
            -- All 5 reviews done with good quality → mastered
            v_mastered := TRUE;
            v_next_interval := 9999;
        END IF;
    END IF;

    v_next_date := CURRENT_DATE + v_next_interval;

    RETURN QUERY SELECT v_next_date, v_next_interval, v_mastered;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CREATE ERROR REVIEW (when user makes a mistake)
-- ============================================================
CREATE OR REPLACE FUNCTION create_error_review(
    p_error_record_id UUID,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
    v_today DATE := CURRENT_DATE;
    v_intervals INTEGER[] := ARRAY[0, 3, 7, 30, 120];
    v_schedule JSONB;
BEGIN
    -- Build schedule dates
    v_schedule := '[]'::JSONB;
    FOR i IN 1..array_length(v_intervals, 1) LOOP
        v_schedule := v_schedule || to_jsonb((v_today + v_intervals[i])::TEXT);
    END LOOP;

    INSERT INTO error_reviews (
        error_record_id, user_id,
        ease_factor, interval_days, repetitions,
        next_review_date, review_count, scheduled_dates
    ) VALUES (
        p_error_record_id, p_user_id,
        2.5, 0, 0,
        v_today, 0, v_schedule
    ) RETURNING id INTO v_review_id;

    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROCESS ERROR REVIEW (when user reviews an error)
-- ============================================================
CREATE OR REPLACE FUNCTION process_error_review(
    p_review_id UUID,
    p_quality INTEGER,  -- 0-5
    p_time_spent INTEGER DEFAULT NULL
) RETURNS TABLE (
    out_next_date DATE,
    out_interval INTEGER,
    out_is_mastered BOOLEAN,
    out_review_count INTEGER
) AS $$
DECLARE
    v_review RECORD;
    v_result RECORD;
    v_new_count INTEGER;
BEGIN
    -- Get current review
    SELECT * INTO v_review FROM error_reviews WHERE id = p_review_id;

    IF v_review IS NULL THEN
        RAISE EXCEPTION 'Review not found: %', p_review_id;
    END IF;

    -- Record history
    INSERT INTO error_review_history (review_id, user_id, quality, time_spent_sec)
    VALUES (p_review_id, v_review.user_id, p_quality, p_time_spent);

    v_new_count := v_review.review_count + 1;

    -- Calculate next review
    SELECT * INTO v_result FROM calculate_next_review(v_new_count, p_quality);

    -- Update review record
    UPDATE error_reviews SET
        review_count = v_new_count,
        last_review_date = CURRENT_DATE,
        last_quality = p_quality,
        next_review_date = v_result.out_next_date,
        interval_days = v_result.out_interval,
        is_mastered = v_result.out_is_mastered,
        mastered_at = CASE WHEN v_result.out_is_mastered THEN NOW() ELSE mastered_at END,
        updated_at = NOW()
    WHERE id = p_review_id;

    -- If mastered, mark error as resolved
    IF v_result.out_is_mastered THEN
        UPDATE error_records SET is_resolved = TRUE, resolved_at = NOW()
        WHERE id = v_review.error_record_id;
    END IF;

    RETURN QUERY SELECT
        v_result.out_next_date,
        v_result.out_interval,
        v_result.out_is_mastered,
        v_new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GET DUE REVIEWS (مرورهای امروز)
-- ============================================================
CREATE OR REPLACE FUNCTION get_due_error_reviews(p_user_id UUID)
RETURNS TABLE (
    review_id       UUID,
    error_id        UUID,
    error_type      VARCHAR,
    error_category  VARCHAR,
    user_answer     TEXT,
    correct_answer  TEXT,
    explanation     TEXT,
    context         TEXT,
    review_count    INTEGER,
    next_review     DATE,
    is_overdue      BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        er.id AS review_id,
        err.id AS error_id,
        err.error_type,
        err.error_category,
        err.user_answer,
        err.correct_answer,
        err.explanation,
        err.context,
        er.review_count,
        er.next_review_date AS next_review,
        (er.next_review_date < CURRENT_DATE) AS is_overdue
    FROM error_reviews er
    JOIN error_records err ON err.id = er.error_record_id
    WHERE er.user_id = p_user_id
      AND er.is_mastered = FALSE
      AND er.next_review_date <= CURRENT_DATE
    ORDER BY er.next_review_date ASC, err.severity DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- Test user
INSERT INTO users (id, email, password_hash, display_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'test@testdaf.de', crypt('password123', gen_salt('bf')), 'Test User');

-- User profile
INSERT INTO user_profiles (user_id, current_level, exam_date, native_language, weak_skills) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B1', '2026-10-15', 'fa', '["grammar","vocab"]');

-- Sample errors
INSERT INTO error_records (user_id, error_type, error_category, user_answer, correct_answer, explanation, context, source) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grammar', 'Artikel', 'Wegen dem Wetter', 'Wegen des Wetters', 'Wegen + Genitiv', 'Wegen dem Wetter bleibe ich zu Hause.', 'exercise'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'grammar', 'Kasus', 'Ich habe ein Buch', 'Ich habe ein Buch gelesen', 'Präteritum von lesen', 'Ich habe _____ Buch gelesen.', 'exercise'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'vocabulary', 'Nomen', 'die Nachhaltikeit', 'die Nachhaltigkeit', 'Rechtschreibung', '', 'exercise');

-- Create reviews for sample errors
SELECT create_error_review(
    (SELECT id FROM error_records WHERE user_answer = 'Wegen dem Wetter' LIMIT 1),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- 1. اشتباهات مرور شده امروز
-- SELECT * FROM get_due_error_reviews('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- 2. تعداد اشتباهات حل نشده
-- SELECT error_type, COUNT(*) as cnt
-- FROM error_records
-- WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND is_resolved = FALSE
-- GROUP BY error_type ORDER BY cnt DESC;

-- 3. پیشرفت مرور
-- SELECT review_count, is_mastered, COUNT(*)
-- FROM error_reviews
-- WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
-- GROUP BY review_count, is_mastered;

-- 4. مرورهای overdue
-- SELECT err.error_category, er.next_review_date, er.review_count
-- FROM error_reviews er
-- JOIN error_records err ON err.id = er.error_record_id
-- WHERE er.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
--   AND er.is_mastered = FALSE
--   AND er.next_review_date <= CURRENT_DATE;
