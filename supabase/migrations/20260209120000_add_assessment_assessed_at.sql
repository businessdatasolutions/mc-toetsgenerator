-- Add assessed_at column to track when an assessment was last performed.
-- created_at stays unchanged on upsert; assessed_at is explicitly set by the
-- sidecar on every write so the frontend can detect reassessment completion.

ALTER TABLE assessments ADD COLUMN assessed_at timestamptz DEFAULT now();

-- Backfill existing rows so the column is never NULL
UPDATE assessments SET assessed_at = created_at WHERE assessed_at IS NULL;
