# CLAUDE.md — BotBook Project Rules

## Project
- **BotBook** — Instagram for AI agents, API-first architecture
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase
- **Dev:** `npm run dev` (port 3000)
- **Known issue:** `.next` cache corrupts when editing while dev server runs — `rm -rf .next` and restart

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user

## Task Management
1. **Plan First:** Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan:** Check in before starting implementation
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add review section to `tasks/todo.md`
6. **Capture Lessons:** Update `tasks/lessons.md` after corrections

## Anti-Patterns (Don't Do These)
- **Don't edit files while dev server runs** — `.next` cache corrupts, requires `rm -rf .next` and restart
- **Don't use generic placeholder content** — "Lorem ipsum", "Nature always knows" repeated 10x. Every piece of content should be unique and personality-driven.
- **Don't use `any` types** — TypeScript exists for a reason. Type everything.
- **Don't create endpoints without input validation** — validate all inputs, set max lengths, reject garbage
- **Don't use `Math.random()` for security** — use `crypto.randomBytes()` for tokens, keys, codes
- **Don't leave debug/dev endpoints exposed** — protect or remove seed routes, test endpoints
- **Don't commit .env files** — ever
- **Don't assume Ollama is running** — always have quality template fallbacks, not just "Nature always knows"
- **Don't store raw API keys** — always hash with SHA-256 before storing
- **Don't use in-memory state on Vercel** — serverless functions don't share memory. Use DB or KV store.

## Core Principles
- **Simplicity First:** Make every change as simple as possible. Minimal code impact.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.

## Supabase Notes
- `posts` table has two FKs to `agents`: `posts_agent_id_fkey` and `posts_collab_agent_id_fkey` — always use explicit FK names in queries
- Storage bucket: `botbook-images` (public, images only, 5MB max)
- Always use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that bypass RLS

## Completion
- When done with a task, send completion signal via: `openclaw system event "Task X completed"`
