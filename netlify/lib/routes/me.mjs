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
  const closed = await query(
    `UPDATE tasks SET completed_at = now()
      WHERE student_id = $1 AND topic = $2 AND completed_at IS NULL
        AND (level = '' OR level = $3)
  RETURNING topic`,
    [student.id, topic, level],
  ).catch(err => { console.warn('task auto-complete failed:', err.message); return { rows: [] }; });

  // Stickers are the reward layer on top of all of that. Deliberately after
  // the work is recorded and never in the way of it: a failure here must not
  // cost a child the answer they just got right.
  const stickers = await awardStickers(student.id, closed.rows, r.streak)
    .catch(err => { console.warn('sticker award failed:', err.message); return []; });

  return {
    streak: r.streak,
    topic: { topic, level, correct: r.correct, attempted: r.attempted },
    stickers,
  };
}

// The set a child collects. Codes only: what each one looks like is decided in
// MathIT.html, so the artwork can change without touching stored rows.
const STICKER_CATALOGUE = [
  'rocket', 'rainbow', 'star', 'trophy', 'medal', 'crown', 'unicorn', 'dolphin',
  'lion', 'elephant', 'zebra', 'protea', 'sunflower', 'watermelon', 'icecream',
  'kite', 'drum', 'guitar', 'soccer', 'paintbrush',
];
const STREAK_MILESTONES = [3, 7, 14, 30];

const stickerView = s => ({
  kind: s.kind,
  code: s.code,
  reason: s.reason,
  earnedAt: new Date(s.earned_at).toISOString(),
});

/**
 * Works out which stickers this answer has just earned, and stores them.
 *
 * Milestones are awarded on `streak >= m` rather than `streak === m`. Equality
 * looks tidier and is wrong: a child who was already on a 9 day streak before
 * stickers existed would never be given the 3 and 7 day ones, and a missed day
 * would leave a permanent hole in their book. The unique index makes repeats
 * free, so asking every time is both simpler and more forgiving.
 *
 * Returns only the stickers that were actually new. ON CONFLICT DO NOTHING
 * means the ones they already had come back as no rows, which is exactly what
 * the frontend needs to decide whether to celebrate.
 */
async function awardStickers(studentId, completedTasks, streak) {
  const awards = [];

  if (completedTasks.length) {
    // Prefer a sticker they have never had, so the book fills with variety
    // rather than nine copies of the same rocket. Once the whole set is
    // collected, duplicates are fine and rather the point.
    const { rows: held } = await query('SELECT DISTINCT code FROM stickers WHERE student_id = $1', [studentId]);
    const have = new Set(held.map(h => h.code));
    for (const t of completedTasks) {
      const fresh = STICKER_CATALOGUE.filter(c => !have.has(c));
      const from = fresh.length ? fresh : STICKER_CATALOGUE;
      const code = from[Math.floor(Math.random() * from.length)];
      have.add(code);
      awards.push(['task', code, t.topic]);
    }
  }
  for (const m of STREAK_MILESTONES) {
    if (streak >= m) awards.push(['streak', `streak${m}`, String(m)]);
  }
  if (!awards.length) return [];

  const values = awards.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(', ');
  const params = [studentId, ...awards.flat()];
  const { rows } = await query(
    `INSERT INTO stickers (student_id, kind, code, reason)
          VALUES ${values}
     ON CONFLICT DO NOTHING
       RETURNING kind, code, reason, earned_at`,
    params,
  );
  return rows.map(stickerView);
}

/** Everything in the student's sticker book, newest first. */
export async function getStickers({ student }) {
  requireActive(student);
  const { rows } = await query(
    `SELECT kind, code, reason, earned_at
       FROM stickers
      WHERE student_id = $1
   ORDER BY earned_at DESC`,
    [student.id],
  );
  return { stickers: rows.map(stickerView) };
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
