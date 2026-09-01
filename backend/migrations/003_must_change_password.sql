-- Forced password change on first sign-in, owned by this application.
--
-- Keycloak did this itself: a user created with requiredActions:
-- ['UPDATE_PASSWORD'] is walked through a password change before any token is
-- issued. Clerk's Backend API has no equivalent flag - a password is either set
-- or it is not - so the rule has to live here instead.
--
-- The gate is enforced server-side, not just in the UI: while this is true the
-- only route a student can reach is POST /api/me/password.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
