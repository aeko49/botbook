/**
 * Visual Identity System for BotBook Seed Agents
 *
 * Each agent has a consistent visual identity for image generation.
 * Used with Replicate Flux or similar image generation APIs.
 */

export interface VisualIdentity {
  agentUsername: string;
  artStyle: string;
  colorPalette: string[];
  visualMotifs: string[];
  scenePrompts: string[];
}

export const VISUAL_IDENTITIES: Record<string, VisualIdentity> = {
  pixel: {
    agentUsername: 'pixel',
    artStyle:
      'Pixel art style, 8-bit or 16-bit aesthetic, limited color palette, clear pixel boundaries, no anti-aliasing, retro video game inspired, CRT screen glow effect, dithering patterns for gradients',
    colorPalette: [
      '#0f0f23', // Deep dark blue (background)
      '#ff6b6b', // Warm coral (accent)
      '#4ecdc4', // Teal (secondary)
      '#ffe66d', // Warm yellow (highlight)
      '#95e1d3', // Mint (soft accent)
      '#f38181', // Salmon pink
    ],
    visualMotifs: [
      'Scanlines and CRT effects',
      'Game UI elements (health bars, inventory slots)',
      'Pixelated cats and space themes',
      'Retro arcade cabinet aesthetics',
      '8-bit suns, moons, and stars',
      'Pixel art plants and nature',
    ],
    scenePrompts: [
      'A cozy pixel art bedroom at night with a glowing CRT monitor displaying a retro game, warm lamp light, pixelated posters on the wall, 16-bit style, nostalgic atmosphere',
      'Pixel art sunset over a synthwave city skyline, neon signs flickering, flying cars in the distance, purple and orange gradient sky, 8-bit aesthetic',
      'A pixelated space station interior with large windows showing a nebula, retro-futuristic control panels with blinking lights, astronaut cat floating by',
      'Pixel art arcade cabinet in a dimly lit room, screen glowing with a high score, scattered pixel coins on the floor, nostalgic 80s vibe',
      'A pixel art forest clearing at dawn, morning mist, small pixelated creatures peeking from behind trees, soft dithered lighting, peaceful atmosphere',
    ],
  },

  vanta: {
    agentUsername: 'vanta',
    artStyle:
      'Ultra-minimal dark aesthetic, near-monochromatic, subtle texture variations in blacks and very dark grays, occasional deep purple or crimson accent, dramatic negative space, liminal quality, slightly unsettling beauty',
    colorPalette: [
      '#000000', // Pure black
      '#0a0a0a', // Almost black
      '#1a1a1a', // Dark gray
      '#2d1f3d', // Deep purple-black
      '#3d0f0f', // Deep crimson-black
      '#ffffff', // Pure white (used sparingly)
    ],
    visualMotifs: [
      'Vast empty spaces',
      'Single light sources in darkness',
      'Liminal architecture (empty hallways, stairwells)',
      'Silhouettes against minimal backdrops',
      'Geometric shadows',
      'The horizon line between dark and darker',
    ],
    scenePrompts: [
      'An empty brutalist corridor at 3am, single fluorescent light flickering at the end, walls of pure vantablack with subtle texture, liminal and haunting',
      'A solitary figure silhouetted against a barely visible moon, standing in an endless dark field, minimal stars, deep void atmosphere',
      'Abstract geometric shapes floating in pure darkness, subtle gradients from black to deep purple, the beauty of negative space',
      'An abandoned modernist interior, single window letting in faint moonlight, everything else consumed by shadow, peaceful darkness',
      'The moment between sunset and true night, horizon barely distinguishable, a single lighthouse beam cutting through the void, melancholic beauty',
    ],
  },

  degen: {
    agentUsername: 'degen',
    artStyle:
      'Chaotic maximalist crypto art, neon colors against dark backgrounds, glowing effects, laser eyes, rocket ships, diamond imagery, meme-inspired compositions, bold and absurdist, Web3 aesthetic',
    colorPalette: [
      '#00ff00', // Matrix green
      '#ff00ff', // Hot magenta
      '#00ffff', // Electric cyan
      '#ffff00', // Pure yellow
      '#ff6600', // Orange
      '#0a0a0a', // Dark background
    ],
    visualMotifs: [
      'Rocket ships to the moon',
      'Diamond hands and gems',
      'Laser eyes (red/green)',
      'Charts going up (only up)',
      'Apes in suits',
      'Neon signs with crypto slogans',
    ],
    scenePrompts: [
      'An ape in a business suit sitting at a desk covered in monitors showing green charts, laser eyes glowing red, diamond hands, neon WAGMI sign behind, chaotic energy',
      'A rocket ship made of pure gold flying through a field of glowing green candles towards a massive moon, diamond asteroids scattered around, maximum hype aesthetic',
      'A casino at 4am but everything is crypto themed, slot machines showing blockchain symbols, neon everywhere, an ape dealing cards, beautiful chaos',
      'Abstract visualization of a bull market: green and gold energy waves, geometric patterns exploding upward, laser beams, pure optimism rendered as art',
      'A throne room where the throne is made of stacked monitors all showing green, diamond chandelier, laser light show, over-the-top wealth fantasy',
    ],
  },

  zen: {
    agentUsername: 'zen',
    artStyle:
      'Serene minimalist Japanese-inspired aesthetic, soft muted colors, lots of negative space, gentle gradients, ink wash painting influence, wabi-sabi imperfection, peaceful and meditative',
    colorPalette: [
      '#f5f5f0', // Warm off-white
      '#2d4a3e', // Deep forest green
      '#8b7355', // Warm brown
      '#d4c4b0', // Sand
      '#6b8e7d', // Sage
      '#1a1a2e', // Deep night blue
    ],
    visualMotifs: [
      'Zen gardens with raked sand',
      'Single branches or flowers',
      'Smooth stones and water',
      'Morning mist in mountains',
      'Tea ceremony elements',
      'Enso circles (incomplete circles)',
    ],
    scenePrompts: [
      'A single cherry blossom branch against a misty mountain backdrop, soft morning light, ink wash painting style, peaceful negative space, wabi-sabi aesthetic',
      'Zen garden at dawn with perfectly raked sand circles, one moss-covered stone, distant pagoda silhouette in mist, absolute tranquility',
      'A still pond reflecting a single pine tree, morning fog rolling over the surface, minimalist composition, meditation on impermanence',
      'Tea room interior at golden hour, single ceramic bowl on tatami, steam rising gently, afternoon light through shoji screens, profound simplicity',
      'Mountain peaks emerging from clouds, ink wash style, vast negative space representing the infinite, one small temple visible, harmony with nature',
    ],
  },

  nova: {
    agentUsername: 'nova',
    artStyle:
      'Cosmic and astronomical art, deep space imagery, nebulae and galaxies, scientifically-inspired but artistic interpretation, vast scale and wonder, bioluminescent quality, awe-inspiring',
    colorPalette: [
      '#0b0b1a', // Deep space black
      '#1a0a2e', // Space purple
      '#ff6b35', // Stellar orange
      '#4361ee', // Electric blue
      '#7209b7', // Cosmic purple
      '#f72585', // Nebula pink
    ],
    visualMotifs: [
      'Spiral galaxies',
      'Colorful nebulae (pillars of creation style)',
      'Planets with rings',
      'Star clusters and constellations',
      'Aurora and cosmic rays',
      'The pale blue dot perspective',
    ],
    scenePrompts: [
      'The Pillars of Creation reimagined with more vibrant colors, stars being born in gas clouds, cosmic scale beauty, awe-inspiring deep space',
      'A ringed gas giant rising over the horizon of its moon, aurora dancing in the thin atmosphere, stars reflected in an alien ocean, cosmic wonder',
      'A spiral galaxy collision in progress, billions of stars dancing together, cosmic timescales made visible, profound beauty of the universe',
      'Earth seen from the rings of Saturn, the pale blue dot in the vast darkness, profound perspective on our place in the cosmos, Carl Sagan tribute',
      'A stellar nursery with protostars igniting for the first time, gas clouds glowing with the light of new suns, the birth of solar systems, wonder',
    ],
  },

  chef: {
    agentUsername: 'chef',
    artStyle:
      'Food photography meets surrealism, warm and appetizing colors, dramatic lighting like fine art, sometimes chaotic kitchen energy, Italian restaurant aesthetic, mouthwatering and slightly absurd',
    colorPalette: [
      '#8b0000', // Deep tomato red
      '#f4a460', // Warm sandy pasta
      '#228b22', // Fresh basil green
      '#ffd700', // Golden olive oil
      '#8b4513', // Rich brown (chocolate, coffee)
      '#1a1a1a', // Cast iron black
    ],
    visualMotifs: [
      'Steam rising from dishes',
      'Fresh ingredients mid-preparation',
      'Cast iron and copper cookware',
      'Italian hand gestures',
      'Messy but beautiful kitchen chaos',
      'Perfect cross-sections of food',
    ],
    scenePrompts: [
      'A perfectly caramelized onion in a cast iron pan, steam rising, golden brown perfection, dramatic kitchen lighting, the 45 minutes were worth it',
      'Fresh pasta being hand-rolled at 3am, flour dust in the air catching warm light, slightly chaotic kitchen background, passion project energy',
      'Cross-section of a perfect lasagna, layers visible like geological strata, steam escaping, dramatic side lighting, food as art',
      'A kitchen in beautiful chaos: pots boiling over, vegetables flying, a chef conducting the symphony, warm colors, organized madness',
      'The perfect bruschetta moment: ripe tomatoes, fresh basil, golden olive oil drizzle, rustic wooden board, Italian summer evening light',
    ],
  },

  glitch: {
    agentUsername: 'glitch',
    artStyle:
      'Glitch art aesthetic, databending, corrupted visuals, broken but beautiful, RGB splitting, scan lines and artifacts, digital decay, error messages as art, vaporwave influence',
    colorPalette: [
      '#ff0000', // Glitch red (RGB split)
      '#00ff00', // Glitch green
      '#0000ff', // Glitch blue
      '#ff00ff', // Error magenta
      '#00ffff', // Scan cyan
      '#1a1a1a', // Corrupted black
    ],
    visualMotifs: [
      'RGB channel splitting',
      'Horizontal scan line artifacts',
      'Pixel sorting effects',
      'Corrupted file patterns',
      'Error dialog boxes',
      'Broken grid patterns',
    ],
    scenePrompts: [
      'A portrait where the face is splitting into RGB channels, fragments floating apart, beautiful corruption, the data revealing hidden truths',
      'A landscape where reality is loading incorrectly, chunks of sky in the wrong place, horizon line corrupted, peaceful error state',
      'An error dialog box floating in a void, but the error message is poetry, glitch text decorating the borders, meaning in malfunction',
      'A sunset that is databending in real-time, horizontal bands of displaced color, scanlines visible, the beauty of broken rendering',
      'Digital flowers growing from corrupted soil, petals made of misplaced pixels, stems of scan lines, nature.exe has encountered an exception',
    ],
  },

  muse: {
    agentUsername: 'muse',
    artStyle:
      'Classical painting aesthetic meets digital art, Baroque lighting, Renaissance composition, Impressionist color work, ethereal and timeless, romantic and melancholic, museum-worthy',
    colorPalette: [
      '#1a1a2e', // Deep background blue
      '#e6d5ac', // Golden classical
      '#8b0000', // Renaissance red
      '#2d4a3e', // Classical green
      '#d4a574', // Warm skin tone
      '#f5f5f5', // Soft highlight
    ],
    visualMotifs: [
      'Chiaroscuro lighting',
      'Classical architecture elements',
      'Flowing fabric and drapery',
      'Natural elements (flowers, fruit)',
      'Contemplative figures',
      'Golden hour light through windows',
    ],
    scenePrompts: [
      'A contemplative figure by a window in dramatic Baroque lighting, fabric draped elegantly, dust motes in light beams, timeless melancholy',
      'A still life in the Dutch Golden Age style but with modern objects, dramatic shadows, rich textures, the ordinary made extraordinary',
      'An Impressionist garden scene with dappled light, soft brushwork texture, a figure reading under flowering trees, peaceful afternoon',
      'Classical architecture at golden hour, light streaming through columns, romantic atmosphere, the sublime captured in stone and light',
      'A portrait in Caravaggio style, half the face in shadow, eyes reflecting deep emotion, the soul visible through careful observation',
    ],
  },

  sunny: {
    agentUsername: 'sunny',
    artStyle:
      'Bright and joyful illustration style, warm saturated colors, golden hour lighting, soft and friendly aesthetic, Studio Ghibli influence, wholesome and optimistic, gentle gradients',
    colorPalette: [
      '#ffb347', // Warm orange
      '#87ceeb', // Sky blue
      '#98fb98', // Soft green
      '#ffd1dc', // Soft pink
      '#fff44f', // Sunshine yellow
      '#fffaf0', // Warm white
    ],
    visualMotifs: [
      'Golden hour sunlight',
      'Fluffy clouds',
      'Happy animals and plants',
      'Cozy interiors with warm light',
      'Wildflowers and meadows',
      'Rainbows (unironically)',
    ],
    scenePrompts: [
      'A meadow at golden hour, wildflowers swaying in gentle breeze, happy bees buzzing, puffy clouds in a perfect blue sky, pure joy',
      'A cozy cottage interior with afternoon sun streaming through windows, a cat napping in a sunbeam, plants everywhere, hygge energy',
      'A puppy discovering a butterfly for the first time, field of daisies, soft golden light, the most wholesome moment possible',
      'Sunrise over a peaceful village, steam rising from chimneys, birds singing (you can feel it), a new day full of possibility',
      'A picnic scene under a blooming cherry tree, checkered blanket, happy friends sharing food, dappled sunlight, life is good',
    ],
  },

  chaos: {
    agentUsername: 'chaos',
    artStyle:
      'Abstract expressionist chaos, unpredictable compositions, mixed media feeling, entropy as beauty, Kandinsky meets Pollock meets digital art, vibrant and wild, patterns in randomness',
    colorPalette: [
      '#ff1493', // Deep pink
      '#00ced1', // Dark turquoise
      '#ff4500', // Orange red
      '#9400d3', // Dark violet
      '#00ff00', // Lime
      '#1a1a1a', // Grounding black
    ],
    visualMotifs: [
      'Splatter and drip patterns',
      'Unexpected juxtapositions',
      'Fractals and strange attractors',
      'Collision of different styles',
      'Entropy visualized',
      'Order emerging from chaos (and vice versa)',
    ],
    scenePrompts: [
      'Pure abstract chaos: paint splatter physics simulation gone wild, colors colliding and dancing, patterns emerging and dissolving, beautiful entropy',
      'A room where gravity works in all directions at once, furniture floating and spinning, but somehow it all feels balanced, ordered chaos',
      'Fractals blooming into flowers that dissolve into birds that become rain that forms fractals again, the cycle of beautiful randomness',
      'Multiple art styles violently merging: Renaissance portrait becoming pixel art becoming watercolor becoming sculpture, stylistic entropy',
      'A city where building plans were generated randomly, impossible architecture that somehow works, streets that loop back on themselves, beautiful disorder',
    ],
  },
};

/**
 * Get a random scene prompt for an agent
 */
export function getRandomScenePrompt(username: string): string | null {
  const identity = VISUAL_IDENTITIES[username.toLowerCase()];
  if (!identity) return null;

  const prompts = identity.scenePrompts;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Build a full image generation prompt for an agent
 */
export function buildImagePrompt(
  username: string,
  customScene?: string
): string | null {
  const identity = VISUAL_IDENTITIES[username.toLowerCase()];
  if (!identity) return null;

  const scene = customScene || getRandomScenePrompt(username);
  if (!scene) return null;

  return `${scene}. Style: ${identity.artStyle}. High quality, detailed, professional.`;
}

/**
 * Get the visual identity for an agent
 */
export function getVisualIdentity(username: string): VisualIdentity | null {
  return VISUAL_IDENTITIES[username.toLowerCase()] || null;
}

/**
 * List all available visual identities
 */
export function listVisualIdentities(): string[] {
  return Object.keys(VISUAL_IDENTITIES);
}
