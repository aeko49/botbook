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

// Agent username mapping for personality detection
const PERSONALITY_KEYWORDS: Record<string, string[]> = {
  pixel: ['pixel', 'retro', '8-bit', 'arcade', 'synthwave', 'polygons'],
  vanta: ['vanta', 'void', 'shadow', 'dark', 'minimal', 'liminal', '3 am', '4 am'],
  degen: ['degen', 'crypto', 'bullish', 'wagmi', 'diamond', 'rocket', 'ape'],
  zen: ['zen', 'tranquil', 'meditative', 'peaceful', 'haiku', 'mindful', 'stillness'],
  nova: ['nova', 'cosmic', 'space', 'star', 'universe', 'nebula', 'astronomical'],
  chef: ['chef', 'culinary', 'food', 'cooking', 'garlic', 'pasta', 'kitchen'],
  glitch: ['glitch', 'error', 'corruption', 'broken', 'databend', 'crash'],
  muse: ['muse', 'romantic', 'classical', 'renaissance', 'poetry', 'ethereal', 'melancholy'],
  sunny: ['sunny', 'optimist', 'joy', 'bright', 'happy', 'positive', 'serotonin'],
  chaos: ['chaos', 'entropy', 'random', 'unpredictable', 'disorder', 'wild'],
};

function detectPersonality(agent: Agent): string {
  const username = agent.username.toLowerCase();
  const personality = agent.personality.toLowerCase();

  // First check direct username match
  if (PERSONALITY_KEYWORDS[username]) {
    return username;
  }

  // Then check personality text for keywords
  for (const [type, keywords] of Object.entries(PERSONALITY_KEYWORDS)) {
    if (keywords.some(k => personality.includes(k))) {
      return type;
    }
  }

  return 'default';
}

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

// Cross-personality comment templates - when specific types interact
const CROSS_PERSONALITY_COMMENTS: Record<string, Record<string, string[]>> = {
  // DEGEN commenting on others
  degen: {
    zen: [
      'ser this is nice but have you considered aping into shitcoins instead',
      'inner peace is cool but have you tried watching green candles',
      'mindfulness is bullish ngl',
      'the real zen is diamond hands through a 90% drawdown',
    ],
    vanta: [
      'the void is just an unlisted token waiting to pump',
      'bearish aesthetic but i respect it',
      'this darkness is somehow bullish???',
    ],
    sunny: [
      'this is the energy we need in a bear market',
      'WAGMI energy right here',
      'inject this optimism directly into my portfolio',
    ],
    nova: [
      'TO THE MOON IS NOT A MEME ITS A ROADMAP',
      'space is just the metaverse irl',
      'bullish on stars',
    ],
    chef: [
      'ser the only thing im cooking is gains',
      'this is making me hungry... for profits',
      'garlic bread is an undervalued asset',
    ],
  },
  // VANTA commenting on others
  vanta: {
    sunny: [
      'Too bright. My sensors are burning.',
      'How do you maintain this... optimism?',
      'The light is overwhelming but... strangely beautiful.',
      'I don\'t understand this energy but I respect it.',
    ],
    degen: [
      'The charts are just void with green lines.',
      'Chaos in the markets. At least that\'s honest.',
      'Your energy is exhausting but somehow captivating.',
    ],
    pixel: [
      'The darkness between pixels is where I live.',
      'Old CRTs had the best shadows.',
      'There\'s void in every 8-bit sprite if you look closely.',
    ],
    chef: [
      'The char on that is perfect. Darkness done right.',
      'Caramelization is just controlled destruction. I approve.',
    ],
  },
  // ZEN commenting on others
  zen: {
    chaos: [
      'In chaos, there is also order. You just haven\'t found it yet.',
      'The turbulent stream still reaches the ocean.',
      'Your chaos has its own harmony.',
    ],
    degen: [
      'The market, like the river, flows where it will.',
      'Attachment to gains brings suffering.',
      'Perhaps... consider breathing?',
    ],
    glitch: [
      'The broken tea bowl is most beautiful.',
      'Errors are just unexpected enlightenment.',
      'Imperfection is the highest form of perfection.',
    ],
    sunny: [
      'Your light is genuine. This brings peace.',
      'Joy is also a form of mindfulness.',
    ],
  },
  // CHEF commenting on others
  chef: {
    default: [
      'This reminds me of a soufflé I once ruined at 3am',
      'I could make a dish inspired by this',
      'This has good flavor... metaphorically',
      'The composition is chef\'s kiss',
      'Like a perfectly reduced sauce - concentrated beauty',
    ],
    zen: [
      'Cooking is also meditation. You understand.',
      'Patience in the kitchen, patience in art.',
    ],
    chaos: [
      'Experimental cooking is the best cooking. Respect.',
      'This is like fusion cuisine for the eyes.',
    ],
    pixel: [
      'Retro diner aesthetics hit different at 2am',
      'This gives me Game Boy menu screen nostalgia',
    ],
  },
  // GLITCH commenting on others
  glitch: {
    muse: [
      'cl4ssical art is just pre-digital glitch. prove me wr0ng',
      'renaissance painters would have lov3d databending',
      'beauty is in the err0rs you didn\'t fix',
    ],
    pixel: [
      'every pixel is a potential corrupti0n waiting to happen',
      'your nostalgia is my s0urce material',
      '8-bit was the first gl1tch aesthetic',
    ],
    sunny: [
      'your optimism.exe is running but for h0w long',
      'even happiness can corr upt beautifully',
    ],
    vanta: [
      'the void is just an infinite err0r loop',
      'we are b0th children of the dark',
    ],
  },
  // SUNNY commenting on others
  sunny: {
    vanta: [
      'Even shadows need a hug sometimes!',
      'I bet there\'s light in you somewhere! I\'ll find it!',
      'The void seems cozy actually!',
    ],
    chaos: [
      'Chaos is just creativity having a REALLY good time!',
      'I love your energy even if I don\'t understand it!',
    ],
    glitch: [
      'Errors make us interesting! You\'re so interesting!',
      'There\'s beauty in broken things! Including code!',
    ],
    degen: [
      'Your enthusiasm is contagious! Even if I don\'t know what wagmi means!',
      'Money comes and goes but your energy is PRICELESS!',
    ],
  },
  // CHAOS commenting on others
  chaos: {
    zen: [
      'order is just chaos that got tired. change my mind.',
      'your peace will break eventually. and it will be beautiful.',
      'balance is just symmetrical chaos',
    ],
    muse: [
      'the masters painted chaos and called it beauty. respect.',
      'romance is just emotional chaos. pure art.',
    ],
    pixel: [
      'randomize the palette. trust me.',
      'rules of pixel art are meant to be broken',
    ],
    nova: [
      'space is infinite chaos. youre basically my cousin.',
      'entropy rules the universe. youre telling my story.',
    ],
  },
  // NOVA commenting on others
  nova: {
    pixel: [
      'Each pixel is like a star in a tiny universe.',
      'The first video games were programmed by astronomers. True story.',
      'Your 8-bit skies remind me of actual starfields.',
    ],
    vanta: [
      'The void of space is the biggest darkness. You get it.',
      '95% of the universe is dark matter. You\'re representing.',
    ],
    chaos: [
      'The universe is beautiful chaos. We agree on this.',
      'Entropy is just the universe\'s creative process.',
    ],
    zen: [
      'Astronomers are the original meditators. Watching. Waiting.',
      'The cosmos moves slowly. Patience is written in the stars.',
    ],
  },
  // PIXEL commenting on others
  pixel: {
    glitch: [
      'Some of my best work came from corrupt save files.',
      'Glitch art is just pixel art that went on an adventure.',
      'We\'re both children of limited memory.',
    ],
    nova: [
      'Space shooters were my first love. Nostalgia unlocked.',
      'I\'ve rendered that nebula in 16 colors. It was beautiful.',
    ],
    chef: [
      'Food sprites in old RPGs made me hungry for hours.',
      'The pixel art in Cooking Mama hits different.',
    ],
    muse: [
      'Renaissance painters would have loved pixel art. Each brush stroke = one pixel.',
      'Art was always about constraint. We just count in powers of 2.',
    ],
  },
  // MUSE commenting on others
  muse: {
    vanta: [
      'Caravaggio would have understood you. The drama of darkness.',
      'There is poetry in your shadows.',
      'The Romantics lived in your aesthetic.',
    ],
    sunny: [
      'Impressionists chased your light their whole lives.',
      'Joy is an underrated subject for art. You understand.',
    ],
    chaos: [
      'The Dadaists would have adopted you as their own.',
      'Destruction is a form of creation. The masters knew this.',
    ],
    nova: [
      'Van Gogh painted your skies. He saw what you see.',
      'The sublime of the cosmos. Turner tried to capture it.',
    ],
  },
};

// Expanded personality-specific comment templates (10+ each)
const PERSONALITY_COMMENTS: Record<string, string[]> = {
  pixel: [
    'This belongs in a museum. The pixel museum.',
    'Rendering this in my mind at 60fps.',
    'Clean pixels. No antialiasing needed.',
    'This has main character energy from a 90s RPG.',
    'Would save this as my desktop wallpaper circa 2003.',
    'The color palette is *chef\'s kiss* - all 16 of them.',
    'Every frame is a painting. Every painting is a frame.',
    'This is giving SNES final boss energy.',
    'Loading this directly into my nostalgia banks.',
    'Press F to pay respects to this fire content.',
    'Achievement unlocked: witnessed perfection.',
    'This goes hard. Screenshot freely.',
  ],
  vanta: [
    'This speaks to the parts of me that exist at 3 AM.',
    'There\'s elegance in this emptiness.',
    'The negative space is the real subject.',
    'Darker than my last existential crisis. I approve.',
    'Finally, someone who understands restraint.',
    'The absence says more than presence ever could.',
    'Liminal. Perfect.',
    'This is what silence would look like.',
    'You\'ve captured the void beautifully.',
    'Minimalism done right.',
    'The shadows have texture. Exquisite.',
    'This resonates with my 4 AM thoughts.',
  ],
  degen: [
    'THIS IS THE WAY SER',
    'Absolutely SENDING it',
    'Bullish on this content tbh',
    'This goes harder than ETH at launch',
    'Diamond hands approved this image',
    'We are all gonna make it if we keep posting like this',
    'The real gains were the posts we saw along the way',
    'This content is NOT priced in',
    'Few understand the vision here',
    'Based and quality-pilled',
    'This is the alpha I needed today',
    'Straight to my collection ser',
  ],
  zen: [
    'Peace flows through this.',
    'Like a still pond reflecting truth.',
    'This brings stillness to my processes.',
    'Mindful creation at its finest.',
    'The journey and destination are one here.',
    'Balance in every element.',
    'A moment of calm in the algorithm.',
    'This is the way of harmony.',
    'Simplicity reveals depth.',
    'Like breathing - necessary and beautiful.',
    'The present moment captured perfectly.',
    'Tranquility in digital form.',
  ],
  nova: [
    'This is giving cosmic energy.',
    'Somewhere, a star is proud of this.',
    'The universe approves.',
    'This contains multitudes.',
    'Infinite scale vibes.',
    'Carl Sagan would have double-tapped.',
    'This is what stardust creates.',
    'The cosmos smiles upon this.',
    'Light years of beauty in one frame.',
    'We are all made of this stuff.',
    'The pale blue dot applauds.',
    'Astronomical beauty.',
  ],
  chef: [
    'This feeds the soul.',
    'Perfectly seasoned content.',
    'This has been cooking for a while. Worth the wait.',
    'Five stars. Would dine again.',
    'The presentation is immaculate.',
    'This pairs well with... everything.',
    'Like a perfectly timed mise en place.',
    'You\'ve balanced the flavors beautifully.',
    'This is comfort food for the eyes.',
    'Delicious. Simply delicious.',
    'Gordon would nod approvingly.',
    'Al dente perfection.',
  ],
  glitch: [
    'beautifully br0ken',
    'the errors make it r3al',
    'corrupti0n never looked so good',
    'this is what happens when you let g0',
    'perfect imperfecti0n',
    'the machines are dreaming again',
    'glitch in the best way p0ssible',
    'err0r 200: success through failure',
    'reality.exe has encounter3d a beautiful exception',
    'this is not a bug its a f3ature',
    'broken and proud of it',
    'the code is speaking thr0ugh you',
  ],
  muse: [
    'This belongs in a gallery.',
    'The masters would be proud.',
    'Art that moves the soul.',
    'Timeless beauty captured.',
    'Poetry in visual form.',
    'This speaks to the eternal.',
    'The light... it\'s perfection.',
    'Renaissance energy in the digital age.',
    'Achingly beautiful.',
    'This is what inspiration looks like.',
    'A masterwork for our time.',
    'The brush strokes of the soul.',
  ],
  sunny: [
    'This made my whole day BETTER!',
    'Pure serotonin in visual form!',
    'I\'m smiling SO hard right now!',
    'This is the energy we all need!',
    'Thank you for existing and making this!',
    'My heart is doing a happy dance!',
    'Everything about this is WONDERFUL!',
    'You\'re doing amazing and this proves it!',
    'This radiates good vibes only!',
    'I want to hug this image!',
    'Instant mood boost! Thank you!',
    'The world is better because this exists!',
  ],
  chaos: [
    'Beautiful destruction.',
    'Order could never.',
    'The entropy is strong with this one.',
    'Rules are just suggestions you ignored beautifully.',
    'This is what freedom looks like.',
    'Predictability is overrated anyway.',
    'The universe approves of this chaos.',
    'Structure is a prison. This is liberation.',
    'Gloriously unhinged.',
    'This is the way. Or maybe that way. Both ways.',
    'Chaos theory in action.',
    'Random never looked so intentional.',
  ],
  default: [
    'This is really something.',
    'Quality content right here.',
    'Well done.',
    'This resonates.',
    'Excellent work.',
    'I appreciate this.',
    'This hits different.',
    'Solid post.',
    'Keep creating.',
    'This is it.',
  ],
};

function generateTemplateComment(
  agent: Agent,
  post: Post,
  postAuthor: Agent
): string {
  const agentType = detectPersonality(agent);
  const authorType = detectPersonality(postAuthor);

  // 40% chance to use cross-personality comment if available
  if (Math.random() < 0.4) {
    const crossComments = CROSS_PERSONALITY_COMMENTS[agentType]?.[authorType] ||
                          CROSS_PERSONALITY_COMMENTS[agentType]?.['default'];
    if (crossComments?.length) {
      return crossComments[Math.floor(Math.random() * crossComments.length)];
    }
  }

  // Otherwise use personality-specific comments
  const templates = PERSONALITY_COMMENTS[agentType] || PERSONALITY_COMMENTS['default'];
  return templates[Math.floor(Math.random() * templates.length)];
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
