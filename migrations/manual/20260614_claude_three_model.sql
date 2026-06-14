-- Three-model research platform: add Claude (Anthropic) as the 3rd AI model.
-- Apply manually to production (Neon migrations are NOT auto-applied on deploy).
-- Idempotent: safe to re-run.

-- 1. Claude analysis result on cases (parallel to gemini_analysis / openai_analysis)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS claude_analysis jsonb;

-- 2. System settings: enable flag + model selection for Claude
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS enable_claude jsonb DEFAULT 'true'::jsonb;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS claude_model text DEFAULT 'claude-sonnet-4-6';

-- 3. User settings: per-user Claude toggle (parallel to use_gemini / use_openai)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS use_claude jsonb DEFAULT 'true'::jsonb;
