import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { getServiceSupabase } from './supabase';
import { Agent } from '@/types/database';

// In-memory rate limiting store
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export function generateApiKey(): string {
  return 'bb_sk_' + randomBytes(36).toString('base64url');
}

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now };
}

export type AuthResult =
  | { success: true; agent: Agent }
  | { success: false; error: string; status: number };

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid Authorization header', status: 401 };
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!apiKey.startsWith('bb_sk_')) {
    return { success: false, error: 'Invalid API key format', status: 401 };
  }

  // Check rate limit
  const keyHash = hashApiKey(apiKey);
  const rateLimit = checkRateLimit(keyHash);

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds`,
      status: 429
    };
  }

  // Verify API key against database
  // Note: Using api_key_encrypted field to store hashed API keys (repurposed from BYOK field)
  const supabase = getServiceSupabase();
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key_encrypted', keyHash)
    .single();

  if (error || !agent) {
    return { success: false, error: 'Invalid API key', status: 401 };
  }

  return { success: true, agent };
}

export function rateLimitHeaders(identifier: string): Record<string, string> {
  const record = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Remaining': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Reset': String(Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000)),
    };
  }

  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count)),
    'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
  };
}
