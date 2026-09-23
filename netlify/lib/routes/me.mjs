import { query } from '../db.mjs';
import { requireActive, HttpError } from '../auth.mjs';
import * as identity from '../identity/index.mjs';

const publicView = s => ({
  id: s.id,
  username: s.username,
  name: s.display_name,
  email: s.email,
  birthday: s.birthday ? new Date(s.birthday).toISOString().slice(0, 10) : null,
  language: s.language,
  status: s.status,
  streak: s.streak,
  // The frontend shows a "choose your own password" screen on this, before it
  // renders any activities. See mathit-auth.js.
  mustChangePassword: Boolean(s.must_change_password),
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

  // Practising a topic closes any open task for it, which is the behaviour the
  // frontend already assumes: it removes the task from the panel on its own
  // after a correct answer. A task saved with an empty level means "this topic
  // on any grade", so it closes whichever grade the student practised on.
  await query(
    `UPDATE tasks SET completed_at = now()
      WHERE student_id = $1 AND topic = $2 AND completed_at IS NULL
        AND (level = '' OR level = $3)`,
    [student.id, topic, level],
  ).catch(err => console.warn('task auto-complete failed:', err.message));

  return {
    streak: r.streak,
    topic: { topic, level, correct: r.correct, attempted: r.attempted },
  };
}

/**
 * Replaces the temporary password an admin set, and lifts the gate.
 *
 * This route exists because Clerk has no forced-password-change flag; the rule
 * is ours, so the write has to be ours too. Deliberately not behind
 * requireActive - a student in this state is blocked from everything else, and
 * this is the way out of it.
 *
 * The provider is updated before our flag is cleared: if Clerk rejects the
 * password, the student stays gated rather than being let through with the
 * temporary one still live.
 */
export async function postPassword({ student, body }) {
  const { password } = body ?? {};

  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'password must be at least 8 characters');
  }
  if (password.length > 200) {
    throw new HttpError(400, 'password is too long');
  }
  if (student.status === 'disabled') {
    throw new HttpError(403, 'account not active');
  }

  await identity.setPassword(student.keycloak_id, password);

  const { rows } = await query(
    `UPDATE students
        SET must_change_password = false, updated_at = now()
      WHERE id = $1
  RETURNING *`,
    [student.id],
  );
  return publicView(rows[0]);
}

/**
 * The student's own open tasks, oldest first.
 *
 * MathIT.html has always called this on load and renders whatever comes back
 * as the "Set for you by your tutor" panel; until now there was no route here
 * to answer it, so the call 404'd, the frontend logged a warning and the panel
 * silently never appeared.
 */
export async function getTasks({ student }) {
  requireActive(student);
  const { rows } = await query(
    `SELECT id, topic, level, note, due_date, created_at
       FROM tasks
      WHERE student_id = $1 AND completed_at IS NULL
   ORDER BY due_date NULLS LAST, created_at ASC`,
    [student.id],
  );
  return {
    tasks: rows.map(t => ({
      id: t.id,
      topic: t.topic,
      level: t.level,
      note: t.note,
      dueDate: t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : null,
      createdAt: new Date(t.created_at).toISOString(),
    })),
  };
}
