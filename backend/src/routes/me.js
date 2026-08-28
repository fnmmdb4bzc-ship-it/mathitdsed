import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireActive } from '../auth.js';

export const meRouter = Router();

const publicView = s => ({
  id: s.id,
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
});

// Deliberately not gated on requireActive: a pending student needs to be able
// to load this in order to be told they are pending.
meRouter.get('/', (req, res) => {
  res.json({ ...publicView(req.student), roles: req.auth.roles });
});

meRouter.put('/', requireActive, async (req, res, next) => {
  const { name, birthday, language } = req.body ?? {};

  if (language !== undefined && !['en', 'af'].includes(language)) {
    return res.status(400).json({ error: "language must be 'en' or 'af'" });
  }
  if (birthday != null && birthday !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return res.status(400).json({ error: 'birthday must be YYYY-MM-DD' });
  }

  try {
    // COALESCE keeps omitted fields untouched. The WHERE clause pins the update
    // to the caller's own row - there is no path here to write someone else's.
    const { rows } = await query(
      `UPDATE students
          SET display_name = COALESCE($2, display_name),
              birthday     = COALESCE($3::date, birthday),
              language     = COALESCE($4, language),
              updated_at   = now()
        WHERE id = $1
    RETURNING *`,
      [req.student.id, name || null, birthday || null, language || null],
    );
    res.json(publicView(rows[0]));
  } catch (err) { next(err); }
});

meRouter.get('/progress', requireActive, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT topic, level, correct, attempted, updated_at
         FROM topic_scores
        WHERE student_id = $1
     ORDER BY updated_at DESC`,
      [req.student.id],
    );
    res.json({
      streak: req.student.streak,
      topics: rows.map(r => ({
        topic: r.topic,
        level: r.level,
        correct: r.correct,
        attempted: r.attempted,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) { next(err); }
});

/**
 * Records one answered question: appends an event, bumps the topic tally, and
 * advances the practice streak. Done in a transaction so a partial write can't
 * leave a score without its event.
 */
meRouter.post('/practice', requireActive, async (req, res, next) => {
  const { topic, level = '', question = null, answer = null, correct } = req.body ?? {};
  if (!topic || typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'topic (string) and correct (boolean) are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO practice_events (student_id, topic, level, question, answer, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.student.id, topic, level, question, answer, correct],
    );

    const { rows: scoreRows } = await client.query(
      `INSERT INTO topic_scores (student_id, topic, level, correct, attempted)
            VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (student_id, topic, level) DO UPDATE
             SET correct    = topic_scores.correct + $4,
                 attempted  = topic_scores.attempted + 1,
                 updated_at = now()
         RETURNING correct, attempted`,
      [req.student.id, topic, level, correct ? 1 : 0],
    );

    // Streak: +1 if yesterday was the last practice day, reset to 1 if a day was
    // skipped, unchanged if today already counted.
    const { rows: streakRows } = await client.query(
      `UPDATE students
          SET streak = CASE
                WHEN last_practice_date = CURRENT_DATE                  THEN streak
                WHEN last_practice_date = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
                ELSE 1
              END,
              last_practice_date = CURRENT_DATE,
              last_seen_at       = now(),
              updated_at         = now()
        WHERE id = $1
    RETURNING streak`,
      [req.student.id],
    );

    await client.query('COMMIT');
    res.json({
      streak: streakRows[0].streak,
      topic: { topic, level, ...scoreRows[0] },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});
