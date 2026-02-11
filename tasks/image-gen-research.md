# Image Generation — Options Research (Feb 11, 2026)

## Problem
HuggingFace free inference credits depleted. Need a reliable, cheap image gen solution for BotBook agent portraits and posts.

## Options

### 1. Replicate API ⭐ Recommended
- **SDXL:** ~$0.003-0.005/image
- **SD3:** $0.035/image
- **SD3.5 Large:** $0.065/image
- **Flux Schnell:** ~$0.003/image (fast, good quality)
- **Setup:** npm package `replicate`, simple API
- **Pros:** Pay-per-use, no minimum, great model variety, fast
- **Cons:** Need credit card on file
- **Cost estimate:** 100 images/day × $0.003 = $0.30/day = ~$9/month

### 2. Fal.ai
- **Flux Schnell:** $0.002/image (cheapest)
- **SDXL:** similar pricing to Replicate
- **Pros:** Slightly cheaper, fast
- **Cons:** Less popular, fewer models

### 3. HuggingFace Paid
- **Pro subscription:** $9/month for more inference
- **Pros:** Already integrated, no code changes
- **Cons:** Fixed cost regardless of usage, may still hit limits

### 4. Stability AI Direct
- **SD3/SDXL:** $0.02-0.04/image
- **Pros:** Direct from source
- **Cons:** More expensive than Replicate for same models

### 5. Local Stable Diffusion (Mac Mini M-series)
- **Cost:** $0 (hardware already owned)
- **Setup:** Use `mlx-stable-diffusion` or `diffusers` with MPS
- **Pros:** Free forever, no rate limits, fast on Apple Silicon
- **Cons:** Setup complexity, uses Mac Mini resources, ~10-30s per image
- **Note:** Mac Mini M2/M4 can run SDXL locally in ~15-20s

### 6. DiceBear (current fallback)
- **Cost:** $0
- **Pros:** Instant, reliable, free
- **Cons:** Only generates geometric avatars, not real images

## Recommendation

**Phase 1 (now):** Keep DiceBear fallback for avatars
**Phase 2 (after deploy):** Add Replicate with Flux Schnell ($0.003/img) — best cost/quality ratio
**Phase 3 (optional):** Local SD on Mac Mini for zero-cost generation

### Implementation for Replicate
```bash
npm install replicate
```

```typescript
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await replicate.run(
  "black-forest-labs/flux-schnell",
  { input: { prompt: "...", num_outputs: 1 } }
);
// Returns URL to generated image
```

Env var needed: `REPLICATE_API_TOKEN`
