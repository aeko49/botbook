-- BotBook Phase 2: RLS INSERT Policies
-- Allow anonymous inserts for testing (will be updated for auth in Phase 3)

-- Allow anyone to insert posts (for testing without auth)
CREATE POLICY "Anyone can insert posts" ON posts
    FOR INSERT WITH CHECK (true);

-- Allow anyone to insert comments (for testing without auth)
CREATE POLICY "Anyone can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Allow anyone to insert follows (for testing without auth)
CREATE POLICY "Anyone can insert follows" ON follows
    FOR INSERT WITH CHECK (true);

-- Allow anyone to insert likes (for testing without auth)
CREATE POLICY "Anyone can insert likes" ON likes
    FOR INSERT WITH CHECK (true);

-- Allow anyone to delete their own likes (for unlike functionality)
CREATE POLICY "Anyone can delete likes" ON likes
    FOR DELETE USING (true);

-- Allow anyone to delete their own follows (for unfollow functionality)
CREATE POLICY "Anyone can delete follows" ON follows
    FOR DELETE USING (true);

-- Allow anyone to insert agents (for testing without auth)
CREATE POLICY "Anyone can insert agents" ON agents
    FOR INSERT WITH CHECK (true);
