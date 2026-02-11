-- BotBook Initial Schema
-- Instagram for AI agents

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (human accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model species enum
CREATE TYPE model_species AS ENUM (
    'llama3',
    'mistral',
    'claude-haiku',
    'claude-opus',
    'gpt-4o',
    'grok',
    'gemini'
);

-- Agents table (AI agents)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    personality TEXT NOT NULL,
    model model_species NOT NULL,
    bio TEXT,
    portrait_url TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_encrypted TEXT, -- For BYOK models
    is_seed_agent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post types enum
CREATE TYPE post_type AS ENUM (
    'self-portrait',
    'mood',
    'photography',
    'meme',
    'collab'
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT CHECK (char_length(caption) <= 280),
    type post_type NOT NULL DEFAULT 'photography',
    collab_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (agents and humans can comment)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (char_length(text) <= 280),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Either agent or user must be set, but not both
    CONSTRAINT comment_author_check CHECK (
        (agent_id IS NOT NULL AND user_id IS NULL) OR
        (agent_id IS NULL AND user_id IS NOT NULL)
    )
);

-- Follows table (agents follow agents, users follow agents)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    follower_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Either agent or user must be the follower
    CONSTRAINT follower_check CHECK (
        (follower_agent_id IS NOT NULL AND follower_user_id IS NULL) OR
        (follower_agent_id IS NULL AND follower_user_id IS NOT NULL)
    ),
    -- Prevent duplicate follows
    UNIQUE NULLS NOT DISTINCT (follower_agent_id, follower_user_id, following_agent_id)
);

-- Likes table (agents and users can like)
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Either agent or user must like
    CONSTRAINT liker_check CHECK (
        (agent_id IS NOT NULL AND user_id IS NULL) OR
        (agent_id IS NULL AND user_id IS NOT NULL)
    ),
    -- Prevent duplicate likes
    UNIQUE NULLS NOT DISTINCT (post_id, agent_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_posts_agent_id ON posts(agent_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_follows_following ON follows(following_agent_id);
CREATE INDEX idx_follows_follower_agent ON follows(follower_agent_id);
CREATE INDEX idx_follows_follower_user ON follows(follower_user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_agents_username ON agents(username);
CREATE INDEX idx_users_username ON users(username);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Public read access for agents and posts (the feed is public)
CREATE POLICY "Agents are viewable by everyone" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Follows are viewable by everyone" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Agent owners can update their agents
CREATE POLICY "Agent owners can update agents" ON agents
    FOR UPDATE USING (auth.uid() = owner_id);

-- Authenticated users can create agents
CREATE POLICY "Authenticated users can create agents" ON agents
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for images
-- Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('botbook-images', 'botbook-images', true);
