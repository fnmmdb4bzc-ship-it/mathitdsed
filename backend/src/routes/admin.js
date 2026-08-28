import { Router } from 'express';
import { query } from '../db.js';
import * as kc from '../keycloak-admin.js';

export const adminRouter = Router();

const row = (s, online) => ({
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
  online,
  attempted: Number(s.attempted || 0),
  correct: Number(s.correct || 0),
});

/**
 * The roster: every student we know about, each flagged online or offline.
 *
 * "Online" comes from Keycloak's live sessions, "enabled" from our own status
 * column - they answer different questions and the admin UI shows both.
 */
adminRouter.get('/students', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.*,
              COALESCE(SUM(t.attempted), 0) AS attempted,
              COALESCE(SUM(t.correct),   0) AS correct
         FROM students s
    LEFT JOIN topic_scores t ON t.student_id = s.id
        WHERE NOT s.is_admin
     GROUP BY s.id
     ORDER BY (s.status = 'pending') DESC, s.display_name ASC`,
    );

    // A Keycloak outage should degrade the roster to offline-unknown, not 500 it.
    let online = new Set();
    let sessionsAvailable = true;
    try {
      online = await kc.onlineUserIds();
    } catch (err) {
      sessionsAvailable = false;
      console.warn('could not read keycloak sessions:', err.message);
    }

    res.json({
      sessionsAvailable,
      counts: {
        total: rows.length,
        pending: rows.filter(r => r.status === 'pending').length,
        active: rows.filter(r => r.status === 'active').length,
        disabled: rows.filter(r => r.status === 'disabled').length,
        online: rows.filter(r => online.has(r.keycloak_id)).length,
      },
      students: rows.map(s => row(s, online.has(s.keycloak_id))),
    });
  } catch (err) { next(err); }
});

/** Admin-created student: made in Keycloak first, then mirrored here as active. */
adminRouter.post('/students', async (req, res, next) => {
  const { username, name, email, password, birthday = null, language = 'en' } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (!['en', 'af'].includes(language)) {
    return res.status(400).json({ error: "language must be 'en' or 'af'" });
  }

  let keycloakId;
  try {
    keycloakId = await kc.createUser({ username, email, firstName: name || username, password });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    return next(err);
  }

  try {
    const { rows } = await query(
      `INSERT INTO students (keycloak_id, username, email, display_name, birthday, language, status)
            VALUES ($1, $2, $3, $4, $5::date, $6, 'active')
         RETURNING *`,
      [keycloakId, username, email || null, name || username, birthday || null, language],
    );
    res.status(201).json(row(rows[0], false));
  } catch (err) {
    // Don't leave an orphan identity behind if our own insert fails.
    await kc.deleteUser(keycloakId).catch(() => {});
    next(err);
  }
});

adminRouter.post('/students/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE students SET status = 'active', updated_at = now()
        WHERE id = $1 RETURNING *`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'no such student' });

    await kc.setUserEnabled(rows[0].keycloak_id, true).catch(err =>
      console.warn('keycloak enable failed:', err.message));
    res.json(row(rows[0], false));
  } catch (err) { next(err); }
});

/** Disable = keep the record and history, revoke the ability to log in. */
adminRouter.post('/students/:id/disable', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE students SET status = 'disabled', updated_at = now()
        WHERE id = $1 RETURNING *`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'no such student' });

    await kc.setUserEnabled(rows[0].keycloak_id, false).catch(err =>
      console.warn('keycloak disable failed:', err.message));
    await kc.logoutUser(rows[0].keycloak_id);
    res.json(row(rows[0], false));
  } catch (err) { next(err); }
});

/** Delete = gone from both stores. Progress cascades away with the student row. */
adminRouter.delete('/students/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'no such student' });

    // Keycloak first: if it fails we still have our row, and the admin can retry.
    // The reverse order could leave a login with no profile behind it.
    await kc.logoutUser(rows[0].keycloak_id);
    try {
      await kc.deleteUser(rows[0].keycloak_id);
    } catch (err) {
      if (!/404/.test(err.message)) throw err; // already gone is fine
    }
    await query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ deleted: true, id: req.params.id, username: rows[0].username });
  } catch (err) { next(err); }
});

/** Per-student detail, for the tutor reviewing how someone is doing. */
adminRouter.get('/students/:id/progress', async (req, res, next) => {
  try {
    const { rows: topics } = await query(
      `SELECT topic, level, correct, attempted, updated_at
         FROM topic_scores WHERE student_id = $1 ORDER BY updated_at DESC`,
      [req.params.id],
    );
    const { rows: recent } = await query(
      `SELECT topic, level, question, answer, is_correct, created_at
         FROM practice_events WHERE student_id = $1
     ORDER BY created_at DESC LIMIT 50`,
      [req.params.id],
    );
    res.json({ topics, recent });
  } catch (err) { next(err); }
});
