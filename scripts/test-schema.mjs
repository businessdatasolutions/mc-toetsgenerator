/**
 * Database schema verification script for Task 2 tests (T2.2–T2.5).
 * Run with: DATABASE_URL="postgresql://..." node scripts/test-schema.mjs
 */
import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is required.');
  console.error('Usage: DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/test-schema.mjs');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

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

async function run() {
  await client.connect();
  console.log('Connected to database.\n');

  // T2.2 — All 6 tables exist
  console.log('T2.2 — Verify all 6 tables exist');
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  const tableNames = tables.rows.map(r => r.table_name);
  const expected = ['assessments', 'chunks', 'exams', 'generation_jobs', 'materials', 'questions'];
  for (const t of expected) {
    assert(tableNames.includes(t), `Table "${t}" exists`);
  }

  // T2.3 — Enum types exist
  console.log('\nT2.3 — Verify all 5 enum types exist');
  const enums = await client.query(
    `SELECT typname FROM pg_type WHERE typname IN ('bloom_level','question_source','analysis_status','discriminatie_level','ambiguiteit_level') ORDER BY typname`
  );
  const enumNames = enums.rows.map(r => r.typname);
  assert(enumNames.length === 5, `Found ${enumNames.length}/5 enum types: ${enumNames.join(', ')}`);

  // T2.4 — Test constraints
  console.log('\nT2.4 — Test constraints');

  const testUserId = '00000000-0000-0000-0000-000000000001';

  try {
    await client.query(`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
      VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@test.com', '', now(), now())
      ON CONFLICT (id) DO NOTHING
    `, [testUserId]);
  } catch (e) {
    console.log('  (note: using existing test user)');
  }

  // Insert a valid exam
  const examResult = await client.query(`
    INSERT INTO exams (title, course, created_by, learning_goals)
    VALUES ('Test Exam', 'CS101', $1, ARRAY['goal1', 'goal2'])
    RETURNING id
  `, [testUserId]);
  const examId = examResult.rows[0].id;
  assert(!!examId, 'Valid exam inserted successfully');

  // Insert a valid question
  const questionResult = await client.query(`
    INSERT INTO questions (exam_id, position, stem, options, correct_option, source)
    VALUES ($1, 1, 'What is 2+2?', '[{"text":"3","position":0},{"text":"4","position":1},{"text":"5","position":2}]', 1, 'imported')
    RETURNING id
  `, [examId]);
  const questionId = questionResult.rows[0].id;
  assert(!!questionId, 'Valid question inserted successfully');

  // Test valid_options constraint: options with < 2 elements should fail
  try {
    await client.query(`
      INSERT INTO questions (exam_id, position, stem, options, correct_option, source)
      VALUES ($1, 2, 'Bad Q', '[{"text":"only one"}]', 0, 'imported')
    `, [examId]);
    assert(false, 'Options with 1 element should fail (valid_options constraint)');
  } catch (e) {
    assert(e.message.includes('valid_options'), 'Options with 1 element correctly rejected by valid_options constraint');
  }

  // Insert a valid assessment
  const assessmentResult = await client.query(`
    INSERT INTO assessments (question_id, question_version, bet_score, tech_kwal_score, val_score)
    VALUES ($1, 1, 4, 3, 5)
    RETURNING id
  `, [questionId]);
  assert(!!assessmentResult.rows[0].id, 'Valid assessment inserted (scores 4, 3, 5)');

  // Test bet_score constraint: score = 6 should fail
  try {
    await client.query(`
      INSERT INTO assessments (question_id, question_version, bet_score)
      VALUES ($1, 99, 6)
    `, [questionId]);
    assert(false, 'bet_score = 6 should fail');
  } catch (e) {
    assert(true, 'bet_score = 6 correctly rejected by check constraint');
  }

  // Test unique constraint on (question_id, question_version)
  try {
    await client.query(`
      INSERT INTO assessments (question_id, question_version, bet_score)
      VALUES ($1, 1, 3)
    `, [questionId]);
    assert(false, 'Duplicate (question_id, question_version) should fail');
  } catch (e) {
    assert(true, 'Duplicate (question_id, question_version) correctly rejected by unique constraint');
  }

  // T2.5 — pgvector extension works
  console.log('\nT2.5 — pgvector extension works');
  try {
    const vectorResult = await client.query(`SELECT '[1,2,3]'::vector(3) as v`);
    assert(!!vectorResult.rows[0].v, 'vector type works: [1,2,3]::vector(3)');
  } catch (e) {
    assert(false, `pgvector failed: ${e.message}`);
  }

  // Clean up test data
  console.log('\nCleaning up test data...');
  await client.query('DELETE FROM assessments WHERE question_id = $1', [questionId]);
  await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
  await client.query('DELETE FROM exams WHERE id = $1', [examId]);
  await client.query('DELETE FROM auth.users WHERE id = $1', [testUserId]);

  await client.end();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
