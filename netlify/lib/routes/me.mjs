import { query } from '../db.mjs';
import { TERMS, LEVEL_LABELS, AREA_OF, AREAS, keysForLevel, termRows } from '../curriculum.mjs';
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
              -- The run of correct answers, for the two accuracy stickers.
              -- One wrong answer ends it, which is the rule a child can hold
              -- in their head.
              correct_run        = CASE WHEN $6 THEN correct_run + 1 ELSE 0 END,
              last_seen_at       = now(),
              updated_at         = now()
        WHERE id = $1
    RETURNING streak, correct_run
     )
     SELECT streak.streak, streak.correct_run, score.correct, score.attempted
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
  const stickers = await awardStickers(student.id, closed.rows, r)
    .catch(err => { console.warn('sticker award failed:', err.message); return []; });

  return {
    streak: r.streak,
    topic: { topic, level, correct: r.correct, attempted: r.attempted },
    stickers,
  };
}

// The set a child collects. Codes only: what each one looks like is decided in
// MathIT.html, so the artwork can change without touching stored rows.
export const STICKER_CATALOGUE = [
  'rocket', 'rainbow', 'star', 'trophy', 'medal', 'crown', 'unicorn', 'dolphin',
  'lion', 'elephant', 'zebra', 'protea', 'sunflower', 'watermelon', 'icecream',
  'kite', 'drum', 'guitar', 'soccer', 'paintbrush',
  'penguin', 'springbok', 'giraffe', 'rhino', 'hippo', 'turtle', 'owl', 'frog',
  'octopus', 'butterfly', 'tree', 'sun', 'moon', 'comet', 'balloon', 'cupcake',
  'strawberry', 'sailboat', 'train', 'puzzle',
];
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 75, 100];

/**
 * How many correct answers in a row each of the two accuracy stickers wants.
 *
 * "In a row" is counted over the student's whole history rather than a
 * sitting, because the server has no notion of a sitting and inventing one
 * from timestamps would make the sticker arrive at a moment the child could
 * not predict. A wrong answer ends the run; that is the rule a child can
 * actually hold in their head.
 */
const RUN_MILESTONES = [{ code: 'run10', n: 10 }, { code: 'run25', n: 25 }];

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
 * free, so asking every time is both simpler and more forgiving. The same
 * reasoning applies to every special below: each one asks "is this true now",
 * not "did this just become true", and the database throws away the repeats.
 *
 * Returns only the stickers that were actually new. ON CONFLICT DO NOTHING
 * means the ones they already had come back as no rows, which is exactly what
 * the frontend needs to decide whether to celebrate.
 */
async function awardStickers(studentId, completedTasks, progress) {
  const { streak, correct_run: run, attempted } = progress;
  const awards = [];

  // Asked for at most once per answer, and only when something actually
  // needs it.
  let have = null;
  const heldCodes = async () => {
    if (!have) {
      const { rows } = await query(
        'SELECT DISTINCT code FROM stickers WHERE student_id = $1', [studentId],
      );
      have = new Set(rows.map(h => h.code));
    }
    return have;
  };

  if (completedTasks.length) {
    // Prefer a sticker they have never had, so the book fills with variety
    // rather than nine copies of the same rocket. Once the whole set is
    // collected, duplicates are fine and rather the point.
    await heldCodes();
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
  for (const m of RUN_MILESTONES) {
    if (run >= m.n) awards.push(['special', m.code, String(m.n)]);
  }

  // Finishing a term, a grade, or all five content areas can only become
  // true on the answer that opens a topic for the first time. `attempted`
  // comes back as 1 exactly then, so the rest of the time this costs
  // nothing. That matters because this runs in front of a child waiting for
  // the next question, on every single answer.
  //
  // Counted off the Postgres statement log rather than assumed: an ordinary
  // repeat answer issues 2 statements, which is what it issued before
  // stickers existed, and the first attempt at a topic issues 4.
  if (attempted === 1) awards.push(...await earnedCoverage(studentId));

  // The whole everyday collection. Worth asking on the turn that just handed
  // a sticker out, which is the only way the set can newly complete, and on
  // a first attempt at a topic, which is what lets a child who already had
  // all forty before this sticker existed still be given it.
  if (completedTasks.length || attempted === 1) {
    const held = await heldCodes();
    if (STICKER_CATALOGUE.every(c => held.has(c))) {
      awards.push(['special', 'collector', String(STICKER_CATALOGUE.length)]);
    }
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

/**
 * The three specials that are about how much of the curriculum has been
 * covered: a term, a whole grade, and all five content areas.
 *
 * `reason` is stored as a machine-readable token rather than a sentence,
 * because the sticker book is bilingual and the server has no business
 * deciding which language a child reads. "4|Term 2" is turned into
 * "Grade 4 Term 2" or "Graad 4 Kwartaal 2" by MathIT.html.
 */
async function earnedCoverage(studentId) {
  const awards = [];

  // Everything practised at least once, keyed the way the curriculum is: an
  // activity that appears in two grades has to be practised in the grade
  // whose term is being judged, not merely somewhere.
  const { rows: done } = await query(
    'SELECT topic, level FROM topic_scores WHERE student_id = $1 AND attempted > 0',
    [studentId],
  );
  const practised = new Set(done.map(d => `${d.level}|${d.topic}`));

  // A term, then a whole grade. Both are once-only, so these name the first
  // one finished rather than every one.
  outer:
  for (const level of Object.keys(TERMS)) {
    for (const row of termRows(level)) {
      if (row.keys.length && row.keys.every(k => practised.has(`${level}|${k}`))) {
        awards.push(['special', 'termdone', `${level}|${row.title}`]);
        break outer;
      }
    }
  }
  for (const level of Object.keys(TERMS)) {
    const keys = keysForLevel(level);
    if (keys.length && keys.every(k => practised.has(`${level}|${k}`))) {
      awards.push(['special', 'gradedone', level]);
      break;
    }
  }

  // All five CAPS content areas touched. Deliberately not per grade: the
  // point is breadth, and a child who did measurement in Grade 3 and data in
  // Grade 4 has still met all five.
  const areasSeen = new Set();
  done.forEach(d => { if (AREA_OF[d.topic]) areasSeen.add(AREA_OF[d.topic]); });
  if (AREAS.every(a => areasSeen.has(a))) {
    awards.push(['special', 'explorer', String(AREAS.length)]);
  }

  return awards;
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
