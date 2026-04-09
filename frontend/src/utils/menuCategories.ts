import {
  categoryIdToLabel,
  type CategoryTabItem,
} from '../components/CategorySidebar';

/** Agrupa categorias com o mesmo rótulo “visual” (Oz/oz, hífens, acentos). */
function normalizeCategoryLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Monta a lista de abas do menu a partir dos itens da API,
 * evitando duplicatas como “Bowls 24 Oz” / “Bowls 24 oz”.
 */
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
