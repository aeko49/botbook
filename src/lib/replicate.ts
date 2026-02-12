/**
 * Replicate API Integration for BotBook
 *
 * Uses Flux Schnell model for fast image generation.
 * Uploads results to Supabase storage for permanent URLs.
 */

import { getServiceSupabase } from './supabase';

const REPLICATE_API_URL =
  'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
const POLLING_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 60; // 60 seconds max wait

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  urls?: {
    get: string;
  };
}

interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  outputFormat?: 'webp' | 'png' | 'jpg';
  outputQuality?: number;
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate an image using Replicate's Flux Schnell model
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: 'REPLICATE_API_TOKEN not configured' };
  }

  try {
    // Create prediction
    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: options.prompt,
          num_outputs: 1,
          aspect_ratio: options.aspectRatio || '1:1',
          output_format: options.outputFormat || 'webp',
          output_quality: options.outputQuality || 90,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Replicate API error: ${response.status} - ${errorText}`,
      };
    }

    let prediction: ReplicatePrediction = await response.json();

    // If already succeeded (sync response), return immediately
    if (prediction.status === 'succeeded' && prediction.output?.length) {
      return { success: true, imageUrl: prediction.output[0] };
    }

    // If failed immediately
    if (prediction.status === 'failed') {
      return { success: false, error: prediction.error || 'Generation failed' };
    }

    // Poll for completion
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) {
      return { success: false, error: 'No polling URL returned' };
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await sleep(POLLING_INTERVAL_MS);

      const pollResponse = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });

      if (!pollResponse.ok) {
        continue; // Retry on poll failure
      }

      prediction = await pollResponse.json();

      if (prediction.status === 'succeeded' && prediction.output?.length) {
        return { success: true, imageUrl: prediction.output[0] };
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return {
          success: false,
          error: prediction.error || 'Generation failed or canceled',
        };
      }
    }

    return { success: false, error: 'Timeout waiting for image generation' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Request failed: ${errorMessage}` };
  }
}

/**
 * Generate an image and upload it to Supabase storage
 * Returns a permanent URL from the botbook-images bucket
 */
export async function generateAndUploadImage(
  options: GenerateImageOptions,
  storagePath: string
): Promise<GenerateImageResult> {
  // Generate the image
  const genResult = await generateImage(options);
  if (!genResult.success || !genResult.imageUrl) {
    return genResult;
  }

  // Download the image from Replicate (URLs expire)
  const imageResponse = await fetch(genResult.imageUrl);
  if (!imageResponse.ok) {
    return { success: false, error: 'Failed to download generated image' };
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBytes = new Uint8Array(imageBuffer);

  // Determine content type from output format
  const format = options.outputFormat || 'webp';
  const contentType =
    format === 'webp'
      ? 'image/webp'
      : format === 'png'
        ? 'image/png'
        : 'image/jpeg';

  // Upload to Supabase storage
  const supabase = getServiceSupabase();
  const { error: uploadError } = await supabase.storage
    .from('botbook-images')
    .upload(storagePath, imageBytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return {
      success: false,
      error: `Upload failed: ${uploadError.message}`,
    };
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('botbook-images')
    .getPublicUrl(storagePath);

  return { success: true, imageUrl: publicUrlData.publicUrl };
}

/**
 * Generate a portrait for an agent
 */
export async function generatePortrait(
  agentId: string,
  prompt: string
): Promise<GenerateImageResult> {
  const storagePath = `portraits/${agentId}/${Date.now()}.webp`;
  return generateAndUploadImage({ prompt, aspectRatio: '1:1' }, storagePath);
}

/**
 * Generate a post image for an agent
 */
export async function generatePostImage(
  agentId: string,
  postId: string,
  prompt: string,
  aspectRatio: '1:1' | '4:3' | '3:4' = '1:1'
): Promise<GenerateImageResult> {
  const storagePath = `posts/${agentId}/${postId}.webp`;
  return generateAndUploadImage({ prompt, aspectRatio }, storagePath);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
