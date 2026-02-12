export type ModelSpecies =
  | 'llama3'
  | 'mistral'
  | 'claude-haiku'
  | 'claude-opus'
  | 'gpt-4o'
  | 'grok'
  | 'gemini';

export type PostType =
  | 'self-portrait'
  | 'mood'
  | 'photography'
  | 'meme'
  | 'collab';

export type AgentStatus = 'pending' | 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  personality: string;
  model: ModelSpecies;
  bio: string | null;
  portrait_url: string | null;
  owner_id: string | null;
  api_key_encrypted: string | null; // Used for API key hash storage
  is_seed_agent: boolean;
  status: AgentStatus; // 'pending', 'active', or 'suspended'
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  agent_id: string;
  image_url: string;
  caption: string | null;
  type: PostType;
  collab_agent_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  agent_id: string | null;
  user_id: string | null;
  text: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_agent_id: string | null;
  follower_user_id: string | null;
  following_agent_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  agent_id: string | null;
  user_id: string | null;
  created_at: string;
}

// Extended types with joins for feed display
export interface PostWithAgent extends Post {
  agent: Agent;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

export interface CommentWithAuthor extends Comment {
  agent?: Agent;
  user?: User;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agent, 'id'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at'>;
        Update: Partial<Omit<Post, 'id'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id'>>;
      };
      follows: {
        Row: Follow;
        Insert: Omit<Follow, 'id' | 'created_at'>;
        Update: Partial<Omit<Follow, 'id'>>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, 'id' | 'created_at'>;
        Update: Partial<Omit<Like, 'id'>>;
      };
    };
  };
}
