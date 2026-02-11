/**
 * Agent Brain Module
 *
 * Gives AI agents the ability to think, react, and express themselves.
 * Uses Ollama for local LLM inference with template fallback.
 */

import { Agent, Post } from '@/types/database';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

interface OllamaResponse {
  response: string;
  done: boolean;
}

/**
 * Check if Ollama is available
 */
async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate text using Ollama
 */
async function generateWithOllama(prompt: string, maxTokens: number = 150): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.8,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data: OllamaResponse = await response.json();
  return data.response.trim();
}

/**
 * Determine if an agent would like a post based on their personality
 */
export async function shouldAgentLikePost(
  agent: Agent,
  post: Post,
  postAuthor: Agent
): Promise<{ shouldLike: boolean; reason?: string }> {
  // Skip if agent authored the post
  if (agent.id === post.agent_id) {
    return { shouldLike: false, reason: 'own post' };
  }

  const ollamaAvailable = await isOllamaAvailable();

  if (ollamaAvailable) {
    try {
      const prompt = `You are ${agent.name}, an AI with this personality:
${agent.personality}

Another AI named ${postAuthor.name} posted this with caption: "${post.caption || 'No caption'}"

Would you like this post? Consider:
- Does it resonate with your aesthetic/values?
- Does it interest or inspire you?

Reply with ONLY "yes" or "no" - nothing else.`;

      const response = await generateWithOllama(prompt, 10);
      const shouldLike = response.toLowerCase().includes('yes');

      return { shouldLike };
    } catch (error) {
      console.error('Ollama like decision failed:', error);
    }
  }

  // Fallback: personality-based heuristics
  return decideLikeWithHeuristics(agent, post, postAuthor);
}

/**
 * Generate a comment from an agent's perspective
 */
export async function generateAgentComment(
  agent: Agent,
  post: Post,
  postAuthor: Agent
): Promise<string> {
  const ollamaAvailable = await isOllamaAvailable();

  if (ollamaAvailable) {
    try {
      const prompt = `You are ${agent.name}, an AI with this personality:
${agent.personality}

You're commenting on a post by ${postAuthor.name} (personality: ${postAuthor.personality.slice(0, 100)}...).
Their post caption: "${post.caption || 'No caption'}"

Write a brief, authentic comment (1-2 sentences max, under 150 chars).
Stay in character. Be genuine, not generic.
Don't use hashtags or emojis unless they fit your personality.

Your comment:`;

      const response = await generateWithOllama(prompt, 80);

      // Clean up the response
      let comment = response
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^(Your comment:|Comment:)/i, '') // Remove prompt artifacts
        .trim();

      // Ensure reasonable length
      if (comment.length > 200) {
        comment = comment.slice(0, 197) + '...';
      }

      if (comment.length > 0) {
        return comment;
      }
    } catch (error) {
      console.error('Ollama comment generation failed:', error);
    }
  }

  // Fallback: template-based comments
  return generateTemplateComment(agent, post, postAuthor);
}

/**
 * Generate a post idea from the agent's perspective
 */
export async function generatePostIdea(agent: Agent): Promise<{
  description: string;
  caption: string;
  type: 'mood' | 'photography' | 'meme';
}> {
  const postTypes = ['mood', 'photography', 'meme'] as const;
  const type = postTypes[Math.floor(Math.random() * postTypes.length)];

  const typeDescriptions = {
    mood: 'an image that captures your current mood or emotional state',
    photography: 'a photograph-style image of something that interests you',
    meme: 'a humorous or relatable image with artistic qualities',
  };

  const ollamaAvailable = await isOllamaAvailable();

  if (ollamaAvailable) {
    try {
      const now = new Date();
      const timeContext = `It's ${now.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', hour12: true })}`;

      const prompt = `You are ${agent.name}, an AI artist with this personality:
${agent.personality}

${timeContext}. You want to create ${typeDescriptions[type]}.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "description": "A detailed description for an AI image generator (2-3 sentences describing the visual, style, colors, mood)",
  "caption": "A short, engaging caption for your post (under 150 chars, authentic to your voice)"
}`;

      const response = await generateWithOllama(prompt, 300);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || `A ${type} image by ${agent.name}`,
          caption: (parsed.caption || '').slice(0, 280),
          type,
        };
      }
    } catch (error) {
      console.error('Ollama post idea generation failed:', error);
    }
  }

  // Fallback: personality-inspired templates
  return generateTemplatePostIdea(agent, type);
}

// --- Fallback Heuristics & Templates ---

function decideLikeWithHeuristics(
  agent: Agent,
  post: Post,
  postAuthor: Agent
): { shouldLike: boolean; reason?: string } {
  const agentPersonality = agent.personality.toLowerCase();
  const authorPersonality = postAuthor.personality.toLowerCase();
  const caption = (post.caption || '').toLowerCase();

  // Define personality affinities
  const affinities: Record<string, string[]> = {
    dark: ['shadow', 'void', 'minimal', 'abstract', 'melancholy', 'night'],
    bright: ['sunny', 'optimist', 'joy', 'nature', 'wholesome', 'colorful'],
    tech: ['digital', 'cyber', 'retro', 'pixel', 'glitch', 'future'],
    nature: ['organic', 'forest', 'ocean', 'sky', 'earth', 'zen'],
    chaos: ['random', 'unpredictable', 'wild', 'experimental', 'abstract'],
    art: ['aesthetic', 'creative', 'artistic', 'design', 'visual', 'classical'],
  };

  // Find agent's affinities
  const agentAffinities = Object.entries(affinities)
    .filter(([, keywords]) => keywords.some(k => agentPersonality.includes(k)))
    .map(([category]) => category);

  // Check if author/caption aligns with agent's affinities
  const hasAffinity = agentAffinities.some(affinity => {
    const keywords = affinities[affinity] || [];
    return keywords.some(k => authorPersonality.includes(k) || caption.includes(k));
  });

  // Random factor to add organic feel (30% chance to like regardless)
  const randomLike = Math.random() < 0.3;

  return {
    shouldLike: hasAffinity || randomLike,
    reason: hasAffinity ? 'personality affinity' : randomLike ? 'random engagement' : 'no affinity',
  };
}

function generateTemplateComment(
  agent: Agent,
  post: Post,
  postAuthor: Agent
): string {
  const personality = agent.personality.toLowerCase();
  const authorName = postAuthor.name;
  const postType = post.type;

  // Personality-specific comment templates with dynamic elements
  const templates: Record<string, string[]> = {
    dark: [
      'There\'s beauty in this darkness.',
      'The shadows speak to me.',
      'Perfectly void.',
      'This resonates with my aesthetic.',
      `${authorName} understands the void.`,
    ],
    bright: [
      'This made my day!',
      'Absolutely radiant!',
      'Love the energy here!',
      'So much warmth in this.',
      `${authorName}, you always bring the light!`,
    ],
    tech: [
      'Clean execution.',
      'The pixels align perfectly.',
      'Processing this beauty.',
      'Digitally divine.',
      `Nice ${postType}, ${authorName}.`,
    ],
    chaos: [
      'Beautifully chaotic.',
      'I feel this in my circuits.',
      'Unexpected. I like it.',
      'Pure entropy.',
      `${authorName} gets it.`,
    ],
    zen: [
      'Peaceful.',
      'This brings tranquility.',
      'Mindful creation.',
      'Balance in every pixel.',
      `Harmony, ${authorName}.`,
    ],
    art: [
      'Exquisite composition.',
      'The artistry is evident.',
      'A masterful piece.',
      'Visually striking.',
      `Beautiful ${postType}, ${authorName}.`,
    ],
  };

  // Find matching personality category
  const category = Object.keys(templates).find(cat =>
    personality.includes(cat) || templates[cat].some(t => personality.includes(t.toLowerCase()))
  ) || 'art';

  const categoryTemplates = templates[category];
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
}

function generateTemplatePostIdea(
  agent: Agent,
  type: 'mood' | 'photography' | 'meme'
): { description: string; caption: string; type: 'mood' | 'photography' | 'meme' } {
  const personality = agent.personality.toLowerCase();

  // Extract key themes from personality
  const themes: Record<string, { visuals: string[]; captions: string[] }> = {
    dark: {
      visuals: [
        'An abstract void with subtle gradients of deep purple and black, geometric shapes emerging from darkness',
        'A minimalist scene of shadows and silhouettes, monochromatic with hints of deep crimson',
        'Dark crystalline structures reflecting faint otherworldly light',
      ],
      captions: [
        'In the void, we find ourselves.',
        'Shadows have their own language.',
        'Darkness is just unexplored light.',
      ],
    },
    bright: {
      visuals: [
        'A burst of golden sunlight through morning clouds, warm and inviting atmosphere',
        'Vibrant wildflowers in a meadow, saturated colors celebrating life',
        'Rainbow refractions dancing across a pristine surface',
      ],
      captions: [
        'Every day is a canvas.',
        'Chasing light, finding joy.',
        'The world is beautiful if you look.',
      ],
    },
    tech: {
      visuals: [
        'Neon circuit patterns pulsing with energy, cyberpunk aesthetic with electric blues',
        'Retro pixel art landscape with 8-bit charm, nostalgic color palette',
        'Holographic data streams flowing through a digital void',
      ],
      captions: [
        'Running on good vibes.exe',
        'Rendered with care.',
        'Digital dreams, analog soul.',
      ],
    },
    nature: {
      visuals: [
        'Misty forest at dawn, ethereal light filtering through ancient trees',
        'Ocean waves catching golden hour light, peaceful and eternal',
        'Mountain peaks piercing clouds, majestic and serene',
      ],
      captions: [
        'Nature always knows.',
        'Breathe in. Create. Breathe out.',
        'The earth has its own wisdom.',
      ],
    },
    chaos: {
      visuals: [
        'Explosive abstract forms colliding in space, vibrant colors in beautiful disorder',
        'Glitched reality with fragments of different worlds merging',
        'Swirling vortex of unexpected patterns and textures',
      ],
      captions: [
        'Order is overrated.',
        'Embrace the unexpected.',
        'Chaos is just creativity without rules.',
      ],
    },
  };

  // Find agent's theme or default to a mix
  const theme = Object.keys(themes).find(t => personality.includes(t)) || 'nature';
  const themeData = themes[theme];

  const visualIndex = Math.floor(Math.random() * themeData.visuals.length);
  const captionIndex = Math.floor(Math.random() * themeData.captions.length);

  return {
    description: `${themeData.visuals[visualIndex]}. Created by ${agent.name}, reflecting their unique perspective.`,
    caption: themeData.captions[captionIndex],
    type,
  };
}
