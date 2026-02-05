/**
 * RLS and database function tests for Task 3 (T3.1–T3.6).
 * Run with: node scripts/test-rls.mjs
 * Requires DATABASE_URL in environment.
 */
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ ${testName}`);
    failed++;
  }
}

function makeUUID() {
  return crypto.randomUUID();
}

async function createClient() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function run() {
  const admin = await createClient();
  console.log('Connected as postgres (admin).\n');

  // Create two test users
  const userAId = makeUUID();
  const userBId = makeUUID();

  await admin.query(`
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
    VALUES
      ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'usera@test.com', '', now(), now()),
      ($2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'userb@test.com', '', now(), now())
    ON CONFLICT (id) DO NOTHING
  `, [userAId, userBId]);

  // User A creates an exam (as admin, bypassing RLS)
  const examResult = await admin.query(`
    INSERT INTO exams (title, course, created_by)
    VALUES ('User A Exam', 'CS101', $1)
    RETURNING id
  `, [userAId]);
  const examId = examResult.rows[0].id;

  // Insert questions for the exam
  const q1 = await admin.query(`
    INSERT INTO questions (exam_id, position, stem, options, correct_option, source)
    VALUES ($1, 1, 'Q1?', '[{"text":"A"},{"text":"B"},{"text":"C"}]', 0, 'imported')
    RETURNING id
  `, [examId]);
  const q2 = await admin.query(`
    INSERT INTO questions (exam_id, position, stem, options, correct_option, source)
    VALUES ($1, 2, 'Q2?', '[{"text":"A"},{"text":"B"},{"text":"C"}]', 1, 'imported')
    RETURNING id
  `, [examId]);
  const q3 = await admin.query(`
    INSERT INTO questions (exam_id, position, stem, options, correct_option, source)
    VALUES ($1, 3, 'Q3?', '[{"text":"A"},{"text":"B"},{"text":"C"}]', 2, 'imported')
    RETURNING id
  `, [examId]);

  // Insert assessments with known scores for exam_score_summary test
  await admin.query(`INSERT INTO assessments (question_id, question_version, bet_score, tech_kwal_score, val_score) VALUES ($1, 1, 4, 5, 3)`, [q1.rows[0].id]);
  await admin.query(`INSERT INTO assessments (question_id, question_version, bet_score, tech_kwal_score, val_score) VALUES ($1, 1, 2, 3, 4)`, [q2.rows[0].id]);
  await admin.query(`INSERT INTO assessments (question_id, question_version, bet_score, tech_kwal_score, val_score) VALUES ($1, 1, 5, 4, 1)`, [q3.rows[0].id]);

  // ===== T3.2 — RLS test: User B cannot see User A's exam =====
  console.log('T3.2 — User B cannot see User A\'s exam');
  const userBClient = await createClient();
  await userBClient.query('BEGIN');
  await userBClient.query(`SET LOCAL role = 'authenticated'`);
  await userBClient.query(`SET LOCAL request.jwt.claims = '{"sub": "${userBId}"}'`);

  const userBExams = await userBClient.query(`SELECT * FROM exams WHERE id = $1`, [examId]);
  assert(userBExams.rows.length === 0, 'User B sees 0 exams belonging to User A');
  await userBClient.query('ROLLBACK');
  await userBClient.end();

  // ===== T3.3 — RLS test: User A can see and update own exam =====
  console.log('\nT3.3 — User A can see and update own exam');
  const userAClient = await createClient();
  await userAClient.query('BEGIN');
  await userAClient.query(`SET LOCAL role = 'authenticated'`);
  await userAClient.query(`SET LOCAL request.jwt.claims = '{"sub": "${userAId}"}'`);

  const userAExams = await userAClient.query(`SELECT * FROM exams WHERE id = $1`, [examId]);
  assert(userAExams.rows.length === 1, 'User A can see own exam');

  const updateResult = await userAClient.query(`UPDATE exams SET title = 'Updated Exam' WHERE id = $1 RETURNING title`, [examId]);
  assert(updateResult.rows[0]?.title === 'Updated Exam', 'User A can update own exam');
  await userAClient.query('COMMIT');
  await userAClient.end();

  // ===== T3.4 — Service role can insert assessments =====
  console.log('\nT3.4 — Service role can insert assessments regardless of ownership');
  // The admin (postgres) connection bypasses RLS, simulating service_role behavior
  try {
    const srAssessment = await admin.query(`
      INSERT INTO assessments (question_id, question_version, bet_score, tech_kwal_score, val_score)
      VALUES ($1, 99, 3, 3, 3)
      RETURNING id
    `, [q1.rows[0].id]);
    assert(!!srAssessment.rows[0].id, 'Service role can insert assessments');
    // Clean up
    await admin.query(`DELETE FROM assessments WHERE question_id = $1 AND question_version = 99`, [q1.rows[0].id]);
  } catch (e) {
    assert(false, `Service role insert failed: ${e.message}`);
  }

  // ===== T3.5 — match_chunks() function is callable =====
  console.log('\nT3.5 — match_chunks() is callable');
  try {
    // Generate a dummy 1536-dimension vector string
    const dims = Array(1536).fill('0.1').join(',');
    const result = await admin.query(`SELECT * FROM match_chunks('[${dims}]'::vector(1536))`);
    assert(true, `match_chunks() returned ${result.rows.length} rows (empty is OK)`);
  } catch (e) {
    assert(false, `match_chunks() failed: ${e.message}`);
  }

  // ===== T3.6 — exam_score_summary() returns correct aggregation =====
  console.log('\nT3.6 — exam_score_summary() returns correct aggregation');
  try {
    const summary = await admin.query(`SELECT * FROM exam_score_summary($1)`, [examId]);
    const row = summary.rows[0];
    assert(row.total_questions === 3, `total_questions = ${row.total_questions} (expected 3)`);
    // avg_bet = (4+2+5)/3 = 3.7
    assert(parseFloat(row.avg_bet_score) === 3.7, `avg_bet_score = ${row.avg_bet_score} (expected 3.7)`);
    // avg_tech = (5+3+4)/3 = 4.0
    assert(parseFloat(row.avg_tech_score) === 4.0, `avg_tech_score = ${row.avg_tech_score} (expected 4.0)`);
    // avg_val = (3+4+1)/3 = 2.7
    assert(parseFloat(row.avg_val_score) === 2.7, `avg_val_score = ${row.avg_val_score} (expected 2.7)`);
    // critical: Q2 has bet=2 (<=2), Q3 has val=1 (<=2) → 2 critical
    assert(row.count_critical === 2, `count_critical = ${row.count_critical} (expected 2)`);
  } catch (e) {
    assert(false, `exam_score_summary() failed: ${e.message}`);
  }

  // Clean up
  console.log('\nCleaning up test data...');
  await admin.query('DELETE FROM assessments WHERE question_id IN ($1, $2, $3)', [q1.rows[0].id, q2.rows[0].id, q3.rows[0].id]);
  await admin.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
  await admin.query('DELETE FROM exams WHERE id = $1', [examId]);
  await admin.query('DELETE FROM auth.users WHERE id IN ($1, $2)', [userAId, userBId]);

  await admin.end();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
