-- Apply before deploying the App Store readiness release.
-- This migration is intentionally incremental because this repository previously
-- managed production schema changes with drizzle-kit push rather than migrations.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "apple_subject" varchar;

CREATE UNIQUE INDEX IF NOT EXISTS "users_apple_subject_unique"
  ON "users" ("apple_subject")
  WHERE "apple_subject" IS NOT NULL;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "adult_confirmed_at" timestamp;
