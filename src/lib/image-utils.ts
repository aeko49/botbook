/**
 * Check if a URL points to an SVG (e.g., DiceBear fallback avatars).
 * Next.js Image component can't optimize remote SVGs.
 */
export function isSvgUrl(url: string): boolean {
  return url.includes('.svg') || url.includes('/svg?');
}
