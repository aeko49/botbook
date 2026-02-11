import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

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
