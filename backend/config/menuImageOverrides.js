/**
 * URLs de imagem opcionais (ex.: copiadas do site Square Online: inspecione o <img> do card).
 * Chaves aceitas: ID do item no catálogo, ID da variação, ou slug do item (como na URL /items/canario-bowl).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cached = null;

export function loadMenuImageOverrides() {
  if (cached !== null) return cached;
  const fp = path.join(__dirname, 'menu-image-overrides.json');
  try {
    if (!fs.existsSync(fp)) {
      cached = {};
      return cached;
    }
    const raw = fs.readFileSync(fp, 'utf8');
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      cached = {};
      return cached;
    }
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith('_')) continue;
      if (typeof v === 'string' && v.trim()) out[k] = v.trim();
    }
    cached = out;
    return cached;
  } catch {
    cached = {};
    return cached;
  }
}

/** Mesmo estilo de slug da URL /items/canario-bowl no Square Online */
export function slugifyItemName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveImageOverride(overrides, { catalogItemId, variationId, itemName }) {
  if (!overrides || Object.keys(overrides).length === 0) return '';
  const slug = slugifyItemName(itemName);
  return (
    overrides[catalogItemId] ||
    overrides[variationId] ||
    overrides[slug] ||
    ''
  );
}
