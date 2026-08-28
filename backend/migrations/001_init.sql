-- MathIT application schema.
--
-- Keycloak owns identity (credentials, sessions, roles). This database owns
-- everything about a student *as a learner*: approval state, profile, and
-- practice progress. The join between the two is students.keycloak_id.

CREATE TABLE IF NOT EXISTS students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_id       TEXT UNIQUE NOT NULL,
  username          TEXT NOT NULL,
  email             TEXT,
  display_name      TEXT NOT NULL,
  birthday          DATE,
  language          TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'af')),
  -- 'pending' until an admin approves. The API refuses to serve practice data
  -- to anyone not 'active', so approval is a real gate, not a UI hint.
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'disabled')),
  streak            INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS students_status_idx ON students (status);

-- Running totals per topic+level, so the tutor can see where a student is
-- strong or struggling without replaying every event.
CREATE TABLE IF NOT EXISTS topic_scores (
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  level       TEXT NOT NULL DEFAULT '',
  correct     INTEGER NOT NULL DEFAULT 0,
  attempted   INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, topic, level)
);

-- Append-only history. Useful for "what did Anna actually get wrong on Tuesday".
CREATE TABLE IF NOT EXISTS practice_events (
  id          BIGSERIAL PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  level       TEXT NOT NULL DEFAULT '',
  question    TEXT,
  answer      TEXT,
  is_correct  BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_events_student_time_idx
  ON practice_events (student_id, created_at DESC);
