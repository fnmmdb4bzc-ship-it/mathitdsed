-- Special stickers: the rare shelf.
--
-- 005 gave streak stickers a once-only rule through a partial unique index,
-- so a child on a long streak collects each milestone once rather than one
-- per answer. The special stickers need exactly the same treatment, and for
-- the same reason: "finished Grade 4 Term 2" is true on every answer after
-- the last one in that term, so without this the book would fill with
-- hundreds of identical graduation caps within a week.
--
-- One index per kind rather than one shared index, because task stickers
-- are deliberately repeatable: finishing five jobs should give five
-- stickers even when two of them happen to be the same rocket.

CREATE UNIQUE INDEX IF NOT EXISTS stickers_student_special_once_idx
  ON stickers (student_id, code) WHERE kind = 'special';

-- A term sticker names which term it was for, and the name is part of the
-- achievement rather than decoration, so it is worth being able to find
-- them. Cheap, and it makes "which terms has this child finished" a single
-- indexed lookup for the tutor view.
CREATE INDEX IF NOT EXISTS stickers_student_kind_idx
  ON stickers (student_id, kind);

-- The current run of correct answers, kept on the row rather than derived.
--
-- Two of the special stickers ask "how many right in a row", and working
-- that out from practice_events means an extra round trip on every single
-- answer, which on a serverless HTTP driver is real latency in front of a
-- child waiting for the next question. Counting it here costs nothing: the
-- same statement that moves the daily streak moves this.
--
-- Existing rows start at 0, so a child who happens to be mid-run when this
-- is applied starts that run again. That is a one-off and invisible.
ALTER TABLE students ADD COLUMN IF NOT EXISTS correct_run INTEGER NOT NULL DEFAULT 0;
