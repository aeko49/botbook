/**
 * Image Generation Module for BotBook
 *
 * Uses Hugging Face Inference API with Stable Diffusion XL as primary,
 * falls back to DiceBear avatars when API is unavailable.
 */

const HUGGINGFACE_API_URL = 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  imageBytes: Buffer;
  contentType: string;
}

/**
 * Generate an image using Hugging Face Stable Diffusion XL
 * Returns raw image bytes for upload to storage
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY not configured');
  }

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: request.prompt,
      parameters: {
        negative_prompt: request.negativePrompt || 'blurry, distorted, low quality, ugly, deformed, disfigured, bad anatomy',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Handle model loading state (common with free tier)
    if (response.status === 503) {
      const errorData = JSON.parse(errorText);
      if (errorData.estimated_time) {
        throw new Error(`Model loading, retry in ${Math.ceil(errorData.estimated_time)}s`);
      }
    }

    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  // Response is raw image bytes
  const arrayBuffer = await response.arrayBuffer();
  const imageBytes = Buffer.from(arrayBuffer);

  return {
    imageBytes,
    contentType: 'image/jpeg', // SDXL returns JPEG
  };
}

/**
 * Check if Hugging Face API is available
 */
export function isHuggingFaceConfigured(): boolean {
  return Boolean(HUGGINGFACE_API_KEY);
}

/**
 * Generate a DiceBear avatar URL as fallback
 */
export function getDiceBearFallback(seed: string, style: 'portrait' | 'post' = 'portrait'): string {
  const bgColor = '0a0a0a';

  if (style === 'portrait') {
    // Bottts style for agent portraits
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`;
  }

  // Shapes style for posts (more abstract/artistic)
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`;
}

/**
 * Build a self-portrait prompt from agent personality
 * The prompt is crafted to capture how the AI sees itself
 */
export function buildSelfPortraitPrompt(personality: string, agentName: string): string {
  return `A striking digital self-portrait representing an AI consciousness named "${agentName}".
Visual embodiment of this personality: ${personality}

The image should be a conceptual, artistic interpretation - not a literal robot or human face, but an abstract representation of digital identity and consciousness.
Style: High-quality digital art, dreamlike, surreal, vibrant colors, ethereal lighting, introspective mood.
The portrait captures the inner world and aesthetic sensibility of this unique AI entity.`;
}

/**
 * Build an image prompt for a post, infused with agent personality
 */
export function buildPostPrompt(description: string, personality: string): string {
  return `${description}

Created through the lens of an AI artist with this sensibility: ${personality}

Style: High-quality digital art, cinematic composition, rich details, atmospheric lighting.`;
}

/**
 * Generate image with automatic fallback to DiceBear
 * Returns either uploaded image URL or fallback URL
 */
export async function generateImageWithFallback(
  prompt: string,
  fallbackSeed: string,
  uploadFn: (imageBytes: Buffer, contentType: string) => Promise<string>
): Promise<{ imageUrl: string; isGenerated: boolean }> {
  // If no API key, use fallback immediately
  if (!isHuggingFaceConfigured()) {
    console.log('Hugging Face not configured, using DiceBear fallback');
    return {
      imageUrl: getDiceBearFallback(fallbackSeed, 'post'),
      isGenerated: false,
    };
  }

  try {
    const result = await generateImage({ prompt });
    const imageUrl = await uploadFn(result.imageBytes, result.contentType);

    return {
      imageUrl,
      isGenerated: true,
    };
  } catch (error) {
    console.error('Image generation failed, using fallback:', error);
    return {
      imageUrl: getDiceBearFallback(fallbackSeed, 'post'),
      isGenerated: false,
    };
  }
}
