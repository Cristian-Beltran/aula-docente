BEGIN;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS partial_1_ends_at DATE,
  ADD COLUMN IF NOT EXISTS partial_2_ends_at DATE;

ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS partial_override SMALLINT
    CHECK (partial_override BETWEEN 1 AND 3);

COMMIT;
