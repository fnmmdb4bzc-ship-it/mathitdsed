import { query } from '../db.mjs';
import { requireActive, HttpError } from '../auth.mjs';

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
export const getMe = ({ student, auth }) => ({ ...publicView(student), roles: auth.roles });

export async function putMe({ student, body }) {
  const { name, birthday, language } = body ?? {};

  if (language !== undefined && !['en', 'af'].includes(language)) {
    throw new HttpError(400, "language must be 'en' or 'af'");
  }
  if (birthday != null && birthday !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    throw new HttpError(400, 'birthday must be YYYY-MM-DD');
  }
  requireActive(student);

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
    [student.id, name || null, birthday || null, language || null],
  );
  return publicView(rows[0]);
}

export async function getProgress({ student }) {
  requireActive(student);
  const { rows } = await query(
    `SELECT topic, level, correct, attempted, updated_at
       FROM topic_scores
      WHERE student_id = $1
   ORDER BY updated_at DESC`,
    [student.id],
  );
  return {
    streak: student.streak,
    topics: rows.map(r => ({
      topic: r.topic,
      level: r.level,
      correct: r.correct,
      attempted: r.attempted,
      updatedAt: r.updated_at,
    })),
  };
}

/**
 * Records one answered question: appends an event, bumps the topic tally, and
 * advances the practice streak.
 *
 * This was three statements inside an explicit BEGIN/COMMIT on a checked-out
 * pg client. The Neon HTTP driver has no interactive transactions, so it is one
 * statement now - data-modifying CTEs all execute against the same snapshot
 * inside a single implicit transaction, which is the same atomicity guarantee
 * with none of the connection checkout. The `ev` CTE is never selected from;
 * in Postgres a data-modifying CTE runs whether or not it is referenced.
 */
export async function postPractice({ student, body }) {
  const { topic, level = '', question = null, answer = null, correct } = body ?? {};
  if (!topic || typeof correct !== 'boolean') {
    throw new HttpError(400, 'topic (string) and correct (boolean) are required');
  }
  requireActive(student);

  const { rows } = await query(
    `WITH ev AS (
       INSERT INTO practice_events (student_id, topic, level, question, answer, is_correct)
            VALUES ($1, $2, $3, $4, $5, $6)
     ),
     score AS (
       INSERT INTO topic_scores (student_id, topic, level, correct, attempted)
            VALUES ($1, $2, $3, $7, 1)
       ON CONFLICT (student_id, topic, level) DO UPDATE
             SET correct    = topic_scores.correct + $7,
                 attempted  = topic_scores.attempted + 1,
                 updated_at = now()
         RETURNING correct, attempted
     ),
     streak AS (
       UPDATE students
          SET streak = CASE
                WHEN last_practice_date = CURRENT_DATE                    THEN streak
                WHEN last_practice_date = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
                ELSE 1
              END,
              last_practice_date = CURRENT_DATE,
              last_seen_at       = now(),
              updated_at         = now()
        WHERE id = $1
    RETURNING streak
     )
     SELECT streak.streak, score.correct, score.attempted
       FROM streak, score`,
    [student.id, topic, level, question, answer, correct, correct ? 1 : 0],
  );

  // Empty only if the student row disappeared between loadStudent and here.
  const r = rows[0];
  if (!r) throw new HttpError(409, 'practice could not be recorded');

  return {
    streak: r.streak,
    topic: { topic, level, correct: r.correct, attempted: r.attempted },
  };
}
