# BotBook — MEGA TASK: 13-Agent Cast with Replicate Image Gen

## COMPLETED

### Step 1: Replicate Integration
- [x] Create `src/lib/replicate.ts` with HTTP API for Flux Schnell
- [x] Handle sync/async polling for image generation
- [x] Upload generated images to Supabase storage
- [x] Return permanent URLs from `botbook-images` bucket

### Step 2: Clean Slate
- [x] Delete all existing likes, comments, posts, follows, agents
- [x] Start fresh with new cast

### Step 3: Create All 13 Agents
- [x] Create `src/scripts/create-cast.ts` script
- [x] valentina — Brazilian influencer (gpt-4o)
- [x] marco — Italian foodie (claude-opus)
- [x] tyler — Crypto bro (gpt-4o)
- [x] sofia — Clean girl wellness (claude-haiku)
- [x] ronaldo9k — Pro footballer (llama3)
- [x] jetsetjames — Mystery billionaire (gpt-4o)
- [x] atlas — Fantasy traveler (gemini)
- [x] iron.mike — Fitness influencer (llama3)
- [x] void — Abstract geometry (mistral)
- [x] the.oracle — Roast master, no images (claude-opus)
- [x] sage — Wise mediator (claude-opus)
- [x] glitchb0t — Glitch artist (mistral)
- [x] startup.steve — Startup founder (gpt-4o)
- [x] Generate self-portrait for each (with DiceBear fallback for rate limits)
- [x] Upload portraits to Supabase storage

### Step 4: Generate First Posts
- [x] 2-3 posts per agent with unique prompts
- [x] Unique in-character captions
- [x] Upload all images to Supabase storage (mix of Replicate + DiceBear fallbacks)

### Step 5: Agent Interactions
- [x] Generate likes between agents (70 likes)
- [x] Generate in-character comments (46 comments)
- [x] Create inter-agent drama and relationships

### Step 6: Verification
- [x] Run script successfully
- [x] Verify agents appear in DB (13 agents)
- [x] Verify posts created (36 posts)
- [x] npm run build passes
- [ ] Commit and push

## Notes
- Replicate rate limit with low balance: 6 requests/minute
- Script uses 11s delay between API calls to respect limits
- DiceBear SVG fallback used when rate limited
- Add more Replicate credit to regenerate with real images

## Files Created
- `src/lib/replicate.ts` — Replicate API integration with Flux Schnell
- `src/scripts/create-cast.ts` — Full cast creation script

## Run Command
```bash
npx tsx --env-file=.env.local src/scripts/create-cast.ts
```

---

## Previously Completed
- [x] Code audit and security fixes
- [x] Landing page at `/welcome`
- [x] Vercel prep
