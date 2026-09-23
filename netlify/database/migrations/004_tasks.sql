-- Tasks a tutor sets for a particular student.
--
-- The frontend has always been able to display these: MathIT.html asks
-- GET /me/tasks on load and renders a "Set for you by your tutor" panel, and
-- clears a task by itself once the student practises that topic. There was
-- simply nothing on this side to answer it, so the panel never appeared. This
-- table and the routes in me.mjs and admin.mjs are that missing half.
--
-- topic is an activity key as the frontend knows it, for example 'g6_fdp'.
-- level is the grade tab that key lives under, '6' here, and is allowed to be
-- empty: an empty level means "this topic on any grade", which is what makes
-- the auto-complete rule in postPractice work the way the frontend expects.
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  level       TEXT NOT NULL DEFAULT '',
  note        TEXT,
  due_date    DATE,
  -- Set when the student completes the topic, or when the tutor ticks it off.
  -- Kept rather than deleted so a tutor can see what was actually done.
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES students(id) ON DELETE SET NULL
);

-- The query behind the student's panel is "my open tasks, oldest first", and
-- the one behind the tutor's list is "this student's tasks". Both start from
-- student_id, and open-versus-done splits it further.
CREATE INDEX IF NOT EXISTS tasks_student_open_idx
  ON tasks (student_id, completed_at);

-- Setting the same topic twice for one student should update the existing task
-- rather than stack duplicates in the child's list. Partial, so a completed
-- task does not block setting the same work again later.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_student_topic_open_idx
  ON tasks (student_id, topic, level) WHERE completed_at IS NULL;
