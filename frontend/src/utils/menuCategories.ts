import {
  categoryIdToLabel,
  type CategoryTabItem,
} from '../components/CategorySidebar';

/** Agrupa categorias com o mesmo rótulo “visual” (Oz/oz, hífens, acentos). */
function normalizeCategoryLabel(label: string): string {
  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Une variantes como "16 oz" e "16oz".
  const withUnifiedUnits = normalized.replace(/\b(\d+)\s+oz\b/g, '$1oz');

  // Corrige typos comuns para evitar categorias duplicadas.
  return withUnifiedUnits
    .replace(/\bcrpe\b/g, 'crepe')
    .replace(/\bspecial cup\b/g, 'special cups');
}

/**
 * Monta a lista de abas do menu a partir dos itens da API,
 * evitando duplicatas como “Bowls 24 Oz” / “Bowls 24 oz”.
 */
/**
 * Normaliza o id de categoria para comparação (hífens, espaços, caixa).
 * Ex.: `bowls-16-oz`, `bowls-16oz`, `bowls16oz` → mesma chave `bowls16oz`.
 */
export function normalizeCategoryKey(category: string): string {
  return String(category ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/** Itens da vitrine Bowls 16 oz (toppings no modal). */
export function isBowls16OzCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'bowls16oz';
}

/** Itens da vitrine Bowls 24 oz (extra toppings no modal). */
export function isBowls24OzCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'bowls24oz';
}

/** Special Cups — mesma lista de extra toppings que Bowls 24 oz. */
export function isSpecialCupsCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'specialcups';
}

/** Coxinha — combo Guaraná opcional no modal. */
export function isCoxinhaCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'coxinha';
}

/** Crepe Swiss — escolha obrigatória de sabor no modal. */
export function isCrepeSwissCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'crepeswiss';
}

/** Combos — opções por tipo de combo no modal. */
export function isCombosCategory(category: string): boolean {
  return normalizeCategoryKey(category) === 'combos';
}

export function buildMenuCategories(
  menuItems: { category: string }[]
): CategoryTabItem[] {
  const rawIds = [...new Set(menuItems.map((p) => p.category))].filter(Boolean);
  const bucket = new Map<string, string[]>();

  for (const id of rawIds) {
    const label = categoryIdToLabel(id);
    const key = normalizeCategoryLabel(label);
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(id);
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, ids]) => {
      const sorted = [...new Set(ids)].sort();
      const labels = sorted.map(categoryIdToLabel);
      const label = labels.reduce((best, cur) =>
        cur.length > best.length ? cur : best
      );
      return {
        id: sorted.join('|'),
        label,
        backendIds: sorted,
      };
    });
}
