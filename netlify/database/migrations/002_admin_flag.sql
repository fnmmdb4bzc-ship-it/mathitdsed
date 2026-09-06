-- Admins sign in through the same app, so visiting any authenticated page used
-- to create a student row for them - which then sat in the roster as a student
-- "awaiting approval" and skewed the pending count.
--
-- Flag them instead, so the roster can leave them out.
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Any admin row that already exists is not really pending.
UPDATE students SET status = 'active' WHERE is_admin AND status = 'pending';
