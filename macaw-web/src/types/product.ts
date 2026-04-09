export type CategoryId =
  | 'build-your-own'
  | 'bowls-24oz'
  | 'bowls-16oz'
  | 'special-cups'
  | 'smoothies'
  | 'drinks';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: CategoryId;
}
