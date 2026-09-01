import { query } from '../db.mjs';
import { HttpError } from '../auth.mjs';
import * as identity from '../identity/index.mjs';

/**
 * How recently a student must have been seen to count as "online".
 *
 * This replaces reading live Keycloak sessions. The old flag meant "has an SSO
 * session right now"; this one means "made an authenticated request in the last
 * few minutes". For a tutor watching who is practising, the second is arguably
 * the more useful question - a child with a tab open and Keycloak session alive
 * but who walked away an hour ago used to show as online.
 */
const ONLINE_WINDOW = "5 minutes";

const row = s => ({
  id: s.id,
  keycloakId: s.keycloak_id,
  username: s.username,
  name: s.display_name,
  email: s.email,
  birthday: s.birthday ? new Date(s.birthday).toISOString().slice(0, 10) : null,
  language: s.language,
  status: s.status,
  streak: s.streak,
  lastPracticeDate: s.last_practice_date
    ? new Date(s.last_practice_date).toISOString().slice(0, 10)
    : null,
  lastSeenAt: s.last_seen_at,
  createdAt: s.created_at,
  online: Boolean(s.online),
  attempted: Number(s.attempted || 0),
  correct: Number(s.correct || 0),
});

export async function listStudents() {
  const { rows } = await query(
    `SELECT s.*,
            (s.last_seen_at > now() - INTERVAL '${ONLINE_WINDOW}') AS online,
            COALESCE(SUM(t.attempted), 0) AS attempted,
            COALESCE(SUM(t.correct),   0) AS correct
       FROM students s
  LEFT JOIN topic_scores t ON t.student_id = s.id
      WHERE NOT s.is_admin
   GROUP BY s.id
   ORDER BY (s.status = 'pending') DESC, s.display_name ASC`,
  );

  return {
    // Kept so admin.html needs no change. It is now always true: the online
    // flag comes from our own table, so there is no upstream to be down.
    sessionsAvailable: true,
    counts: {
      total:    rows.length,
      pending:  rows.filter(r => r.status === 'pending').length,
      active:   rows.filter(r => r.status === 'active').length,
      disabled: rows.filter(r => r.status === 'disabled').length,
      online:   rows.filter(r => r.online).length,
    },
    students: rows.map(row),
  };
}

/** Admin-created student: made at the identity provider first, mirrored here. */
export async function createStudent({ body }) {
  const { username, name, email, password, birthday = null, language = 'en' } = body ?? {};
  if (!username || !password) throw new HttpError(400, 'username and password are required');
  if (!['en', 'af'].includes(language)) throw new HttpError(400, "language must be 'en' or 'af'");

  let providerId;
  try {
    providerId = await identity.createUser({ username, email, firstName: name || username, password });
  } catch (err) {
    if (err.status === 409) throw new HttpError(409, err.message);
    throw err;
  }

  try {
    const { rows } = await query(
      `INSERT INTO students (keycloak_id, username, email, display_name, birthday, language, status)
            VALUES ($1, $2, $3, $4, $5::date, $6, 'active')
         RETURNING *`,
      [providerId, username, email || null, name || username, birthday || null, language],
    );
    return { status: 201, body: row({ ...rows[0], online: false }) };
  } catch (err) {
    // Don't leave an orphan identity behind if our own insert fails.
    await identity.deleteUser(providerId).catch(() => {});
    throw err;
  }
}

export async function approveStudent({ params }) {
  const { rows } = await query(
    `UPDATE students SET status = 'active', updated_at = now()
      WHERE id = $1 RETURNING *`,
    [params.id],
  );
  if (!rows.length) throw new HttpError(404, 'no such student');

  await identity.setUserEnabled(rows[0].keycloak_id, true)
    .catch(err => console.warn('identity enable failed:', err.message));
  return row({ ...rows[0], online: false });
}

/** Disable = keep the record and history, revoke the ability to log in. */
export async function disableStudent({ params }) {
  const { rows } = await query(
    `UPDATE students SET status = 'disabled', updated_at = now()
      WHERE id = $1 RETURNING *`,
    [params.id],
  );
  if (!rows.length) throw new HttpError(404, 'no such student');

  await identity.setUserEnabled(rows[0].keycloak_id, false)
    .catch(err => console.warn('identity disable failed:', err.message));
  await identity.logoutUser(rows[0].keycloak_id);
  return row({ ...rows[0], online: false });
}

/** Delete = gone from both stores. Progress cascades away with the student row. */
export async function deleteStudent({ params }) {
  const { rows } = await query('SELECT * FROM students WHERE id = $1', [params.id]);
  if (!rows.length) throw new HttpError(404, 'no such student');

  // Identity first: if it fails we still have our row and the admin can retry.
  // The reverse order could leave a login with no profile behind it.
  await identity.logoutUser(rows[0].keycloak_id);
  try {
    await identity.deleteUser(rows[0].keycloak_id);
  } catch (err) {
    if (!/404/.test(err.message)) throw err; // already gone is fine
  }
  await query('DELETE FROM students WHERE id = $1', [params.id]);
  return { deleted: true, id: params.id, username: rows[0].username };
}

/** Per-student detail, for the tutor reviewing how someone is doing. */
export async function studentProgress({ params }) {
  const { rows: topics } = await query(
    `SELECT topic, level, correct, attempted, updated_at
       FROM topic_scores WHERE student_id = $1 ORDER BY updated_at DESC`,
    [params.id],
  );
  const { rows: recent } = await query(
    `SELECT topic, level, question, answer, is_correct, created_at
       FROM practice_events WHERE student_id = $1
   ORDER BY created_at DESC LIMIT 50`,
    [params.id],
  );
  return { topics, recent };
}
