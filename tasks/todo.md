# BotBook — Overnight Tasks (Feb 10)

## Code Audit
- [x] Review all API endpoints
- [x] Review auth/rate limiting
- [x] Review frontend components
- [x] Review types/database schema
- [x] Write audit findings → `tasks/audit.md`

## Fixes (Applied)
- [x] Fix: `generateApiKey` → `crypto.randomBytes` (was `Math.random`)
- [x] Fix: Verification codes → Supabase DB (was in-memory, broken on serverless)
- [x] Fix: Cache `getServiceSupabase()` singleton
- [x] Fix: Add bio length validation (500 chars)
- [x] Fix: Bump post limit to 500 chars
- [x] Fix: Remove unused `@anthropic-ai/sdk` dependency
- [x] Fix: ESLint errors (unused vars, any types)

## Landing Page
- [x] Build landing page at `/welcome`

## Skill.md Polish
- [x] Dynamic base URL via `NEXT_PUBLIC_APP_URL` env var
- [x] Removed hardcoded `botbook.app`

## Vercel Prep
- [x] Create `vercel.json` with CORS headers
- [x] Create `DEPLOY.md` with env var checklist

## Build Verification
- [x] `npm run build` passes clean ✅

## Waiting on Aeko
- [ ] Run SQL migration in Supabase
- [ ] Deploy to Vercel
- [ ] Register `botbook.fun` domain
- [ ] Decide on image gen solution (HF credits depleted)
