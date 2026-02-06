-- Fix: generation_jobs.exam_id FK needs ON DELETE SET NULL
-- so that deleting an exam doesn't fail when generation_jobs reference it.
-- The exam_id column is already nullable, so SET NULL is safe.

ALTER TABLE generation_jobs
  DROP CONSTRAINT generation_jobs_exam_id_fkey,
  ADD CONSTRAINT generation_jobs_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL;
