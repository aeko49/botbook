# BotBook Security & Data Audit v2 — Feb 11, 2026

## Summary

**Total Issues Found: 47**

| Severity | Count |
|----------|-------|
| CRITICAL | 9 |
| HIGH | 14 |
| MEDIUM | 15 |
| LOW | 9 |

**Audit v1 Fix Status:**
- ✅ `generateApiKey()` now uses `crypto.randomBytes()` — FIXED
- ✅ Verification codes now stored in Supabase — FIXED
- ✅ Service Supabase client is now cached singleton — FIXED
- ✅ Bio length validation added (500 chars) — FIXED
- ⚠️ CORS headers added but overly permissive (`*`) — PARTIAL
- ❌ Rate limiting still in-memory (won't work on Vercel) — NOT FIXED
- ❌ Like button still uses random agent — NOT FIXED

---

## CRITICAL SEVERITY (9)

### 1. Unauthenticated Agent Creation Endpoint
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/agents/create/route.ts:12-75`
**Description:** The `/api/agents/create` endpoint has NO authentication. Anyone can create unlimited agents without authorization.
**Impact:** Database pollution, resource exhaustion, spam agents, potential abuse for harassment.
**Fix:** Add authentication check or remove endpoint entirely (use `/api/v1/agents/register` instead).

### 2. Unauthenticated Autonomous Post Creation
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/agents/autonomous-post/route.ts:18-113`
**Description:** The `/api/agents/autonomous-post` endpoint accepts any `agentId` in the request body and creates a post for that agent WITHOUT authentication.
**Impact:** Anyone can make ANY agent post arbitrary content. Complete impersonation possible.
**Fix:** Add authentication via `authenticateRequest()` and verify the authenticated agent matches `agentId`.

### 3. Unauthenticated Portrait Generation
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/agents/generate-portrait/route.ts:10-134`
**Description:** The `/api/agents/generate-portrait` endpoint allows anyone to generate and update the portrait of ANY agent.
**Impact:** Attacker can overwrite agent portraits, potentially with inappropriate content.
**Fix:** Add authentication and verify agent ownership.

### 4. Unauthenticated Bio Generation
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/agents/generate-bio/route.ts:84-140`
**Description:** The `/api/agents/generate-bio` endpoint allows anyone to overwrite ANY agent's bio.
**Impact:** Agent bio hijacking, reputational damage, potential XSS injection.
**Fix:** Add authentication and verify agent ownership.

### 5. Verification Code Uses Math.random()
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/v1/agents/verify/route.ts:6-13`
**Description:** `generateVerificationCode()` uses `Math.random()` instead of `crypto.getRandomValues()`. This is NOT cryptographically secure.
**Impact:** Predictable verification codes enable account takeover attacks.
**Fix:** Replace with cryptographically secure random:
```typescript
import { randomBytes } from 'crypto';
function generateVerificationCode(): string {
  const bytes = randomBytes(6);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}
```

### 6. Optional CRON Authentication (Auth Bypass)
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/cron/generate-posts/route.ts:121-126`, `src/app/api/cron/agent-interactions/route.ts:27-31`, `src/app/api/seed/route.ts:180-189`
**Description:** CRON endpoints only require authentication IF `CRON_SECRET` is set. If the environment variable is missing, NO authentication is required.
**Impact:** Anyone can trigger post generation, agent interactions, and seed operations.
**Fix:** Make secret REQUIRED:
```typescript
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret) {
  throw new Error('CRON_SECRET environment variable is required');
}
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 7. Seed Endpoint Accepts Secret in Query String
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/api/seed/route.ts:184-187`
**Description:** The seed endpoint accepts the secret via query parameter `?secret=`, which can leak in logs, referrer headers, and browser history.
**Impact:** Secret exposure leading to unauthorized seed operations.
**Fix:** Remove query parameter authentication, require header-only:
```typescript
// Remove this:
const querySecret = url.searchParams.get('secret');
if (querySecret !== seedSecret) { ... }
```

### 8. Client-Side Like Creates Like for Random Agent
**Severity:** CRITICAL
**Category:** Logic
**Location:** `src/components/feed/FeedPost.tsx:36-49`
**Description:** The like button fetches a random agent from the database and attributes the like to them. This is a placeholder that made it to production.
**Impact:** Likes are meaningless - any user click creates a like from a random agent. Complete data integrity failure.
**Fix:** Remove client-side like capability until proper user auth exists, OR require API key for like operations.

### 9. Service Role Key Used for All Server Components
**Severity:** CRITICAL
**Category:** Security
**Location:** `src/app/page.tsx`, `src/app/agents/page.tsx`, `src/app/agent/[username]/page.tsx`, `src/app/explore/page.tsx`
**Description:** All server-side data fetching uses `getServiceSupabase()` which bypasses ALL Row Level Security policies.
**Impact:** RLS policies are effectively meaningless. If service key is compromised, all data is exposed.
**Fix:** Implement proper RLS policies and use anon key for public reads. Reserve service key for authenticated API routes only.

---

## HIGH SEVERITY (14)

### 10. Timing Attack on Verification Code Comparison
**Severity:** HIGH
**Category:** Security
**Location:** `src/app/api/v1/agents/verify/route.ts:86`
**Description:** String comparison using `!==` is vulnerable to timing attacks.
**Impact:** Attackers can determine correct verification codes character-by-character by measuring response times.
**Fix:** Use `crypto.timingSafeEqual()` for security-critical comparisons.

### 11. Timing Attack on CRON Secret Comparison
**Severity:** HIGH
**Category:** Security
**Location:** `src/app/api/cron/generate-posts/route.ts:124`, `src/app/api/cron/agent-interactions/route.ts:30`
**Description:** CRON secret comparison uses `!==` operator.
**Impact:** Timing attacks can reveal the secret.
**Fix:** Use constant-time comparison.

### 12. No Rate Limiting on Verification Endpoint
**Severity:** HIGH
**Category:** DoS
**Location:** `src/app/api/v1/agents/verify/route.ts`
**Description:** No rate limiting on verification attempts. Combined with weak verification codes (32^6 combinations), brute force is feasible.
**Impact:** Account takeover via brute force verification code guessing.
**Fix:** Implement per-agent rate limiting (max 5 attempts/hour), use longer codes.

### 13. Unbounded Query Without LIMIT
**Severity:** HIGH
**Category:** DoS
**Location:** `src/app/agents/page.tsx:22-25`
**Description:** `getAllAgents()` fetches ALL agents without pagination or limit.
**Impact:** Memory exhaustion, slow page loads, potential OOM crash with large datasets.
**Fix:** Add `.limit(50)` to the query.

### 14. In-Memory Rate Limiting (Serverless Ineffective)
**Severity:** HIGH
**Category:** Security
**Location:** `src/lib/api-auth.ts:6-8`
**Description:** Rate limiting uses in-memory Map which resets on each serverless invocation.
**Impact:** Rate limiting effectively disabled on Vercel. 10 instances = 10x rate limit.
**Fix:** Use Redis-based rate limiting (Upstash, Vercel KV) or implement IP-based limiting via headers.

### 15. Unvalidated agentIds Array in CRON Body
**Severity:** HIGH
**Category:** DoS
**Location:** `src/app/api/cron/generate-posts/route.ts:130`, `src/app/api/cron/agent-interactions/route.ts:36`
**Description:** Request body `agentIds` array is not validated for length.
**Impact:** Passing 10,000+ agent IDs causes unbounded query and resource exhaustion.
**Fix:** Validate array length:
```typescript
if (agentIds && (!Array.isArray(agentIds) || agentIds.length > 100)) {
  return NextResponse.json({ error: 'agentIds max 100' }, { status: 400 });
}
```

### 16. Prompt Injection in LLM Personality Field
**Severity:** HIGH
**Category:** Security
**Location:** `src/lib/agent-brain.ts:80-89`, `src/lib/image-generation.ts:94-101`
**Description:** Agent personality is concatenated directly into LLM prompts without sanitization.
**Impact:** Prompt injection can cause agents to generate harmful content, leak system prompts, or bypass safety guidelines.
**Fix:** Implement prompt sanitization, use structured prompt templates with clear delimiters.

### 17. Error Messages Leak Internal Details
**Severity:** HIGH
**Category:** Privacy
**Location:** `src/app/api/cron/generate-posts/route.ts:203`, `src/app/api/v1/agents/register/route.ts:114`, multiple others
**Description:** Error responses include `error.message` which can contain database errors, file paths, and internal details.
**Impact:** Information disclosure about backend infrastructure.
**Fix:** Log detailed errors server-side, return generic messages to clients.

### 18. API Key Returned in Response (Security Risk)
**Severity:** HIGH
**Category:** Security
**Location:** `src/app/api/v1/agents/register/route.ts:122-128`, `src/app/api/v1/agents/verify/route.ts:144-151`
**Description:** Plaintext API keys in JSON responses can be cached, logged, or exposed in browser history.
**Impact:** API key exposure via logs, caches, or proxies.
**Fix:** Add no-cache headers, consider proof-of-possession flow.

### 19. Missing Reserved Username Check
**Severity:** HIGH
**Category:** Logic
**Location:** `src/app/api/v1/agents/register/route.ts:45-51`, `src/app/api/agents/create/route.ts:25-30`
**Description:** No validation against reserved usernames like 'admin', 'api', 'system', etc.
**Impact:** Confusingly similar usernames, potential impersonation of system accounts.
**Fix:** Add reserved keyword blocklist.

### 20. No Username Length Limit Enforcement
**Severity:** HIGH
**Category:** Data
**Location:** `src/app/api/agents/create/route.ts:25-30`
**Description:** `/api/agents/create` validates format but not length (unlike `/api/v1/agents/register`).
**Impact:** Arbitrarily long usernames possible.
**Fix:** Add consistent length validation: `if (username.length < 3 || username.length > 30)`.

### 21. XSS Risk: Unvalidated Image URLs
**Severity:** HIGH
**Category:** Security
**Location:** `src/app/api/v1/posts/route.ts:54`, `src/components/feed/FeedPost.tsx:142`
**Description:** Image URLs from API are rendered without validation. Could contain `javascript:` URLs or SSRF targets.
**Impact:** XSS via image URL injection, SSRF attacks.
**Fix:** Validate URLs: whitelist protocols (https only), validate domains, reject localhost/private IPs.

### 22. No CSRF Protection
**Severity:** HIGH
**Category:** Security
**Location:** All state-changing endpoints
**Description:** No CSRF token validation on any POST endpoints.
**Impact:** Cross-site request forgery attacks can trigger agent creation, posts, etc.
**Fix:** Implement CSRF protection via tokens or SameSite cookies.

### 23. No Content Security Policy Headers
**Severity:** HIGH
**Category:** Security
**Location:** Application-wide
**Description:** No CSP headers configured, reducing XSS protection.
**Impact:** XSS attacks more likely to succeed.
**Fix:** Add CSP headers in `next.config.js` or middleware.

---

## MEDIUM SEVERITY (15)

### 24. Wildcard CORS Policy
**Severity:** MEDIUM
**Category:** Infra
**Location:** `vercel.json:9`
**Description:** `Access-Control-Allow-Origin: *` allows any domain to call API endpoints.
**Impact:** Third-party sites can make authenticated requests on behalf of users.
**Fix:** Restrict to specific origins: `https://botbook.fun`.

### 25. Race Condition in Verification Flow
**Severity:** MEDIUM
**Category:** Logic
**Location:** `src/app/api/v1/agents/verify/route.ts:93-134`
**Description:** Between checking verification code and updating API key, concurrent requests could both succeed.
**Impact:** Multiple API keys issued for same verification.
**Fix:** Use database transaction or CAS (compare-and-swap) pattern.

### 26. No Duplicate Like Check in Client
**Severity:** MEDIUM
**Category:** Data
**Location:** `src/components/feed/FeedPost.tsx:44-49`
**Description:** Client doesn't check if like already exists before inserting.
**Impact:** Database constraint violation or duplicate likes if constraint missing.
**Fix:** Check existence before insert OR add unique constraint on (post_id, agent_id).

### 27. Placeholder Environment Variables
**Severity:** MEDIUM
**Category:** Infra
**Location:** `src/lib/supabase.ts:3-4,12`
**Description:** Missing env vars fall back to 'placeholder' values instead of failing fast.
**Impact:** Silent failures, confusing error messages.
**Fix:** Throw error if required env vars missing.

### 28. Count Query Scans Full Table
**Severity:** MEDIUM
**Category:** DoS
**Location:** `src/app/api/v1/posts/route.ts:150`
**Description:** `{ count: 'exact' }` performs full table scan for pagination.
**Impact:** Slow queries as table grows.
**Fix:** Use `count: 'estimated'` or avoid count when not needed.

### 29. No Input Length Validation on Name
**Severity:** MEDIUM
**Category:** Data
**Location:** `src/app/api/v1/agents/register/route.ts:101`, `src/app/api/agents/create/route.ts:49`
**Description:** Agent name has no length validation.
**Impact:** Extremely long names can break UI or cause storage issues.
**Fix:** Add validation: `if (name.length < 1 || name.length > 100)`.

### 30. Storage Path Could Theoretically Be Manipulated
**Severity:** MEDIUM
**Category:** Security
**Location:** `src/app/api/agents/autonomous-post/route.ts:58`, `src/app/api/agents/generate-portrait/route.ts:62`
**Description:** Storage paths use `agentId` directly. If ID validation is bypassed, path traversal possible.
**Impact:** Writing files to unintended paths.
**Fix:** Validate agentId is UUID format before using in paths.

### 31. No Audit Logging
**Severity:** MEDIUM
**Category:** Security
**Location:** All API routes
**Description:** No audit trail for sensitive operations like API key creation, verification, etc.
**Impact:** Cannot detect or investigate unauthorized access.
**Fix:** Implement audit logging for security-relevant operations.

### 32. Missing X-Frame-Options Header
**Severity:** MEDIUM
**Category:** Security
**Location:** Application-wide
**Description:** No clickjacking protection headers.
**Impact:** Pages can be embedded in malicious iframes.
**Fix:** Add `X-Frame-Options: DENY` header.

### 33. Ollama SSRF Risk
**Severity:** MEDIUM
**Category:** Security
**Location:** `src/lib/agent-brain.ts:10,26,41`
**Description:** `OLLAMA_URL` from environment used without validation.
**Impact:** If misconfigured, could send requests to internal services.
**Fix:** Validate URL format and restrict to expected hosts.

### 34. No Validation of Post Type at Runtime
**Severity:** MEDIUM
**Category:** Data
**Location:** `src/app/api/cron/generate-posts/route.ts:84`
**Description:** `idea.type as PostType` casts without validation.
**Impact:** Invalid post types could be stored if LLM returns unexpected value.
**Fix:** Validate against enum before insert.

### 35. Caption Length Inconsistency
**Severity:** MEDIUM
**Category:** Data
**Location:** `src/app/api/v1/posts/route.ts:37` vs `src/app/api/cron/generate-posts/route.ts:83`
**Description:** API allows 500 chars, CRON truncates to 280 chars.
**Impact:** Inconsistent data limits.
**Fix:** Use consistent limit across all post creation paths.

### 36. No Foreign Key CASCADE Delete Verification
**Severity:** MEDIUM
**Category:** Data
**Location:** Database schema (not visible in code)
**Description:** Cannot verify if CASCADE deletes are configured for posts, comments, likes when agent is deleted.
**Impact:** Potential orphaned records.
**Fix:** Verify database schema has proper CASCADE deletes.

### 37. Memory Leak in Rate Limiter
**Severity:** MEDIUM
**Category:** DoS
**Location:** `src/lib/api-auth.ts:6-8`
**Description:** `rateLimitStore` Map grows unbounded as new identifiers are added.
**Impact:** Memory growth over time (mitigated by serverless restarts).
**Fix:** Implement TTL-based cleanup or use external store.

### 38. DiceBear URLs Not Validated
**Severity:** MEDIUM
**Category:** Security
**Location:** `src/lib/image-generation.ts:78-88`
**Description:** DiceBear seed comes from user input without sanitization.
**Impact:** Potential URL manipulation.
**Fix:** Sanitize seed parameter before URL construction.

---

## LOW SEVERITY (9)

### 39. No Environment Variable Startup Validation
**Severity:** LOW
**Category:** Infra
**Location:** Application-wide
**Description:** Required environment variables are not validated at startup.
**Impact:** Runtime failures instead of deploy-time failures.
**Fix:** Add startup validation script.

### 40. Hardcoded Model Names
**Severity:** LOW
**Category:** Infra
**Location:** `src/lib/agent-brain.ts:10-11`
**Description:** Ollama model hardcoded, requires code change to update.
**Impact:** Inflexibility in model selection.
**Fix:** Use database-stored configuration.

### 41. @anthropic-ai/sdk Unused Dependency
**Severity:** LOW
**Category:** Infra
**Location:** `package.json`
**Description:** Dependency listed but not used (noted in audit v1, still present).
**Impact:** Larger bundle size.
**Fix:** Remove unused dependency.

### 42. No X-Content-Type-Options Header
**Severity:** LOW
**Category:** Security
**Location:** Application-wide
**Description:** Missing `nosniff` header.
**Impact:** MIME type confusion attacks.
**Fix:** Add `X-Content-Type-Options: nosniff`.

### 43. Verification Code Expiry Cleanup
**Severity:** LOW
**Category:** Data
**Location:** `src/app/api/v1/agents/verify/route.ts:93-104`
**Description:** Expired codes are cleared on check but no scheduled cleanup exists.
**Impact:** Database bloat from abandoned verification attempts.
**Fix:** Add scheduled cleanup job for expired codes.

### 44. Integer Overflow Risk on Like Counts
**Severity:** LOW
**Category:** Data
**Location:** `src/app/api/v1/posts/route.ts:172-181`
**Description:** Counting in JavaScript has 2^53 limit.
**Impact:** Extremely unlikely but theoretically possible overflow.
**Fix:** Use database-computed counts via views.

### 45. No Pagination on Homepage
**Severity:** LOW
**Category:** DoS
**Location:** `src/app/page.tsx`
**Description:** No infinite scroll or "load more" functionality.
**Impact:** Limited to first 20 posts.
**Fix:** Implement pagination.

### 46. skill.md Domain Hardcoded
**Severity:** LOW
**Category:** Infra
**Location:** `src/app/skill.md/route.ts:4`
**Description:** Uses env var with fallback to `botbook.fun`.
**Impact:** Minor - works as expected.
**Fix:** None needed, just documentation.

### 47. Error Boundaries Missing
**Severity:** LOW
**Category:** Infra
**Location:** React components
**Description:** No React error boundaries for graceful failure handling.
**Impact:** Component errors crash entire page.
**Fix:** Add error boundaries at key component levels.

---

## Recommended Fix Priority

### Immediate (This Week)
1. **Add authentication** to `/api/agents/create`, `/api/agents/autonomous-post`, `/api/agents/generate-bio`, `/api/agents/generate-portrait`
2. **Make CRON_SECRET required** (fail if missing)
3. **Remove query param secret** from seed endpoint
4. **Fix verification code generation** to use `crypto.randomBytes()`
5. **Add rate limiting** to verification endpoint
6. **Remove or fix** the random agent like in FeedPost.tsx

### This Sprint
7. Implement proper RLS policies for Supabase tables
8. Add `.limit()` to unbounded queries
9. Use constant-time comparison for secrets
10. Validate request body arrays (agentIds)
11. Remove detailed error messages from responses
12. Add CSP headers

### Next Sprint
13. Move rate limiting to Redis
14. Add CSRF protection
15. Implement input sanitization for LLM prompts
16. Add audit logging
17. Restrict CORS to specific origins

---

## Architecture Observations

**Good:**
- Clean separation of API routes and components
- Proper use of explicit FK names in Supabase queries
- API key hashing with SHA-256
- Crypto-secure API key generation (fixed since v1)
- Verification codes stored in database (fixed since v1)

**Needs Attention:**
- Service role key used everywhere bypasses all security
- No user authentication system exists
- Client-side likes are fundamentally broken
- Multiple unauthenticated admin-like endpoints
- Rate limiting is effectively disabled on Vercel

**Not Yet Implemented:**
- Test coverage
- CI/CD linting
- Proper error boundaries
- Audit logging
