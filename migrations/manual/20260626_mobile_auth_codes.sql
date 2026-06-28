-- Mobile OAuth exchange codes: short, single-use, 60s-TTL opaque codes.
-- Replaces the in-memory Map + the long signed-token approach. A short random
-- code (no '.') survives iOS deep-link delivery, and persisting it in Postgres
-- means the exchange works across instances/cold-starts.
-- Apply manually to production (Neon migrations are NOT auto-applied on deploy).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS "mobile_auth_codes" (
  "code" varchar PRIMARY KEY,
  "user_id" varchar NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "expires_at" timestamp NOT NULL
);

-- Index supports the best-effort cleanup of expired rows.
CREATE INDEX IF NOT EXISTS "idx_mobile_auth_codes_expires_at"
  ON "mobile_auth_codes" ("expires_at");
