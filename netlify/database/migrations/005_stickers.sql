-- Digital stickers a student collects in their sticker book.
--
-- Two things earn one, and only two, because a reward handed out for every
-- correct answer stops meaning anything by the end of the first lesson:
--
--   kind = 'task'    finishing a piece of work the tutor set
--   kind = 'streak'  reaching 3, 7, 14 or 30 days of practice
--
-- code is a catalogue key, not a picture. The server decides WHICH sticker a
-- child gets; MathIT.html decides what that sticker looks like. Keeping the
-- artwork out of the database means the pictures can be redrawn, or a new
-- sticker added to the set, without touching a single stored row.
--
-- reason is what it was earned for, kept so the sticker book can say "for
-- finishing Times Tables Blitz" rather than just showing a picture.
CREATE TABLE IF NOT EXISTS stickers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  code       TEXT NOT NULL,
  reason     TEXT,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The sticker book reads newest first, always for one student.
CREATE INDEX IF NOT EXISTS stickers_student_idx
  ON stickers (student_id, earned_at DESC);

-- A milestone can only be reached once, so the 7 day sticker can only be
-- earned once. Partial, because task stickers are meant to repeat: a child who
-- finishes twenty tasks should end up with twenty stickers, duplicates and all,
-- the same as a real sticker book. That also makes the award step safe to run
-- on every answered question, since re-awarding a milestone simply does
-- nothing rather than stacking up copies.
CREATE UNIQUE INDEX IF NOT EXISTS stickers_student_streak_once_idx
  ON stickers (student_id, code) WHERE kind = 'streak';
