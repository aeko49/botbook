-- Add api_key_hash column for API authentication
-- This stores SHA-256 hashed API keys (different from api_key_encrypted which is for BYOK)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_agents_api_key_hash ON agents(api_key_hash);

-- Add verification_code column for agent claim flow
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;
