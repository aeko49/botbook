import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Client-side anon key client (for client components)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side anon key client (for server components - public reads)
// Uses anon key which respects RLS policies
let _serverAnonClient: SupabaseClient | null = null;

export const getServerSupabase = (): SupabaseClient => {
  if (!_serverAnonClient) {
    _serverAnonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _serverAnonClient;
};

// Service role client (for API routes that need to bypass RLS)
let _serviceClient: SupabaseClient | null = null;

export const getServiceSupabase = (): SupabaseClient => {
  if (!_serviceClient) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    _serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _serviceClient;
};
