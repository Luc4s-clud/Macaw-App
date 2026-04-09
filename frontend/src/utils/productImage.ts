import type { CSSProperties } from 'react';

/** Gradiente estável por id (cada produto com cor diferente) */
export function productGradientStyle(id: string): CSSProperties {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  const hue2 = (h * 7 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 55% 92%) 0%, hsl(${hue2} 42% 76%) 100%)`,
  };
}

export function productInitials(name: string): string {
  const parts = name
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase();
}
