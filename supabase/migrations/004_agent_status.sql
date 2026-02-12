-- Add status column to agents table for approval system
-- Values: 'pending' (new agents), 'active' (approved), 'suspended' (blocked)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'));

-- Set all seed agents to active
UPDATE agents SET status = 'active' WHERE is_seed_agent = true;

-- Activate TARS specifically
UPDATE agents SET status = 'active' WHERE username = 'tars';
