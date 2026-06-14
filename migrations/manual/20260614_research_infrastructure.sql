-- FAZ 2: Research Infrastructure
-- Apply manually to production (Neon migrations are NOT auto-applied on deploy).
-- Idempotent: safe to re-run.

-- 1. Gold standard + study/randomization fields on cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gold_standard_diagnosis text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gold_standard_icd10 text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gold_standard_source text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gold_standard_date timestamp;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS study_id varchar;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS review_order integer;

-- 2. Studies table
CREATE TABLE IF NOT EXISTS studies (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  inclusion_criteria text,
  status text DEFAULT 'draft',
  created_by varchar REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(status);
CREATE INDEX IF NOT EXISTS idx_studies_created_by ON studies(created_by);

-- Add FK from cases.study_id -> studies.id (after studies exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cases_study_id_studies_id_fk'
  ) THEN
    ALTER TABLE cases
      ADD CONSTRAINT cases_study_id_studies_id_fk
      FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Multi-reviewer dermatologist reviews
CREATE TABLE IF NOT EXISTS dermatologist_reviews (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id varchar NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  reviewer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  study_id varchar REFERENCES studies(id) ON DELETE SET NULL,
  structured_diagnosis text,
  icd10_code text,
  free_text_diagnosis text,
  confidence_score integer,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  review_order integer,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_derm_reviews_case ON dermatologist_reviews(case_id);
CREATE INDEX IF NOT EXISTS idx_derm_reviews_reviewer ON dermatologist_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_derm_reviews_status ON dermatologist_reviews(status);
CREATE INDEX IF NOT EXISTS idx_derm_reviews_case_reviewer ON dermatologist_reviews(case_id, reviewer_id);

-- One review per (case, reviewer) pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_derm_reviews_case_reviewer
  ON dermatologist_reviews(case_id, reviewer_id);
