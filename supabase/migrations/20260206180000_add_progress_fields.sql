-- Add progress tracking fields so the dashboard can show a real-time progress bar
ALTER TABLE exams ADD COLUMN question_count integer DEFAULT 0;
ALTER TABLE exams ADD COLUMN questions_analyzed integer DEFAULT 0;

-- Atomic increment function called by the sidecar after each question is analyzed
CREATE OR REPLACE FUNCTION increment_questions_analyzed(p_exam_id uuid)
RETURNS void LANGUAGE sql AS $$
  UPDATE exams
  SET questions_analyzed = questions_analyzed + 1, updated_at = now()
  WHERE id = p_exam_id;
$$;
