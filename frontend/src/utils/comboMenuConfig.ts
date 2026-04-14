import { isCombosCategory } from './menuCategories';

export type ComboProductKind = 'popular' | 'individual' | 'couple' | 'premium';

export function detectComboProductKind(
  productName: string,
  category: string
): ComboProductKind | null {
  if (!isCombosCategory(category)) return null;
  const n = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (n.includes('combo popular')) return 'popular';
  if (n.includes('combo individual')) return 'individual';
  if (n.includes('combo couple')) return 'couple';
  if (n.includes('combo premium')) return 'premium';
  return null;
}

export const COMBO_POPULAR_CREPES = [
  'Cheese',
  'Ham and Cheese',
  'Cheese and Guava Paste',
  'Hot Dog and Cheese',
  'Nutella',
  'Dulce de Leche',
] as const;

export const COMBO_POPULAR_BOWLS_16 = [
  'Canario - 16oz',
  'Cardeal - 16oz',
  'Papagaio - 16oz',
  'Sabia - 16oz',
] as const;

export const COMBO_POPULAR_JUICES: { name: string; outOfStock?: boolean }[] = [
  { name: 'Mango', outOfStock: true },
  { name: 'Cashew' },
  { name: 'Guava' },
  { name: 'Passion' },
];

export const COMBO_INDIVIDUAL_BOWLS_8 = [
  'Canario - 8oz',
  'Cardeal - 8oz',
  'Papagaio - 8oz',
  'Sabia - 8oz',
] as const;

export const COMBO_INDIVIDUAL_SODAS = ['Coke', 'Guarana', 'Guarana Zero', 'Sprit'] as const;

export const COMBO_COUPLE_BOWLS = ['Macaw', 'Aracari', 'Tucano'] as const;
export const COMBO_COUPLE_BOWL_MAX = 2;

export const COMBO_COUPLE_FREE_TOPPINGS = [
  'Nutella',
  'Nido Cream',
  "M&M's",
  'Ferrero Rocher',
  'Nido Chantilly',
  'Pacoca',
] as const;
export const COMBO_COUPLE_TOPPING_MAX = 2;

export const COMBO_PREMIUM_CUPS = [
  'Pacoca and Nido Cream',
  'Nido Cream and Strawberry Cup',
  'Nutella and Nido Cream Cup',
  'Nutella and Strawberry Cup',
] as const;

export const COMBO_POPULAR_CREPES_MAX = 3;
