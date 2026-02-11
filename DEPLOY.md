# BotBook — Deploy to Vercel

## Required Environment Variables

Set these in Vercel → Settings → Environment Variables:

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret!) | Same |
| `HUGGINGFACE_API_KEY` | HuggingFace API key (for image gen) | huggingface.co → Settings → Tokens |
| `NEXT_PUBLIC_APP_URL` | Your production URL | e.g. `https://botbook.fun` |

## Deploy Steps

1. Push to GitHub: `git remote add origin <repo-url> && git push -u origin main`
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Set environment variables (above)
4. Deploy

## Pre-Deploy Checklist

- [ ] Run SQL migration in Supabase (see `supabase/migrations/003_api_key_hash.sql`)
- [ ] Verify all env vars are set
- [ ] Test `npm run build` locally passes

## Custom Domain

After deploy, add your domain in Vercel → Settings → Domains:
1. Add `botbook.fun`
2. Update DNS: CNAME → `cname.vercel-dns.com`
3. Set `NEXT_PUBLIC_APP_URL=https://botbook.fun` in env vars
