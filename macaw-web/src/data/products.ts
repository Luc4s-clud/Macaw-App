import type { Product } from '../types/product';

const acaiImg = 'https://images.pexels.com/photos/3731474/pexels-photo-3731474.jpeg';
const acaiImg2 = 'https://images.pexels.com/photos/3731476/pexels-photo-3731476.jpeg';
const acaiImg3 = 'https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg';
const acaiImg4 = 'https://images.pexels.com/photos/3731522/pexels-photo-3731522.jpeg';

export const products: Product[] = [
  // Build your own
  {
    id: 'bowl-8oz',
    name: 'Bowl - 8oz',
    description:
      'You can build your own Bowl 8oz with 2 bases and 3 free topping or buy more toppings.',
    price: 10,
    imageUrl: acaiImg2,
    category: 'build-your-own',
  },
  {
    id: 'bowl-16oz',
    name: 'Bowl - 16oz',
    description:
      'You can build your own Bowl 16oz with 2 bases and 3 free topping or buy more toppings.',
    price: 16,
    imageUrl: acaiImg2,
    category: 'build-your-own',
  },
  {
    id: 'bowl-24oz',
    name: 'Bowl - 24oz',
    description:
      'You can build your own Bowl 24oz with 2 bases and 5 free topping or buy more toppings.',
    price: 20,
    imageUrl: acaiImg2,
    category: 'build-your-own',
  },
  // Bowls 24oz
  {
    id: 'aracari-bowl',
    name: 'Araçari Bowl',
    description:
      '24 oz. Açai, coconut flakes, banana, kiwi, blueberry, granola, chia seeds, and honey.',
    price: 20,
    imageUrl: acaiImg3,
    category: 'bowls-24oz',
  },
  {
    id: 'macaw-bowl',
    name: 'Macaw Bowl',
    description:
      '24 oz. Açai, banana, strawberry, granola, Ninho, and condensed milk.',
    price: 20,
    imageUrl: acaiImg,
    category: 'bowls-24oz',
  },
  {
    id: 'grauna-bowl',
    name: 'Graúna Bowl',
    description:
      '24 oz. Açai, nuts mix, paçoca, granola, Nutella, and condensed milk.',
    price: 20,
    imageUrl: acaiImg2,
    category: 'bowls-24oz',
  },
  {
    id: 'tucano-bowl',
    name: 'Tucano Bowl',
    description:
      '24 oz. Açai, banana, strawberry, blueberry, granola, coconut flakes, and honey.',
    price: 20,
    imageUrl: acaiImg4,
    category: 'bowls-24oz',
  },
  // Bowls 16oz
  {
    id: 'canario-bowl',
    name: 'Canário Bowl',
    description: 'Açai, Ninho, granola, and condensed milk.',
    price: 16,
    imageUrl: acaiImg2,
    category: 'bowls-16oz',
  },
  {
    id: 'cardeal-bowl',
    name: 'Cardeal Bowl',
    description:
      'Açai, Ninho, strawberry, and condensed milk. Choose your size, 8 oz or 16 oz.',
    price: 16,
    imageUrl: acaiImg,
    category: 'bowls-16oz',
  },
  {
    id: 'papagaio-bowl',
    name: 'Papagaio Bowl',
    description:
      'Açai, granola, banana, strawberry, and honey. Choose your size, 8 oz or 16 oz.',
    price: 16,
    imageUrl: acaiImg3,
    category: 'bowls-16oz',
  },
  {
    id: 'sabia-bowl',
    name: 'Sabiá Bowl',
    description: '16 oz. Açai, strawberry, banana, and condensed milk.',
    price: 16,
    imageUrl: acaiImg4,
    category: 'bowls-16oz',
  },
  // Special Cups
  {
    id: 'nido-strawberry-cup',
    name: 'Nido Cream and Strawberry Cup - 16oz',
    description: 'Açai, Ninho Cream and Strawberry.',
    price: 18,
    imageUrl: acaiImg4,
    category: 'special-cups',
  },
  {
    id: 'nutella-nido-cup',
    name: 'Nutella and Nido Cream Cup - 16oz',
    description:
      'Açai, Nutella and Nido Cream around the cup and a layer in the middle.',
    price: 18,
    imageUrl: acaiImg2,
    category: 'special-cups',
  },
  {
    id: 'pacoca-ninho-cup',
    name: 'Paçoca and Ninho Cup - 16oz',
    description: 'Açai, Paçoca, Ninho and Condensed Milk.',
    price: 18,
    imageUrl: acaiImg2,
    category: 'special-cups',
  },
  {
    id: 'nutella-strawberry-cup',
    name: 'Nutella and Strawberry Cup - 16oz',
    description: 'Açai, Nutella and Strawberry.',
    price: 18,
    imageUrl: acaiImg4,
    category: 'special-cups',
  },
  // Smoothies
  {
    id: 'smoothie-tradicional',
    name: 'Smoothie Tradicional - 16oz',
    description:
      'Pure Organic Açai, Nido, Peanut, Cashew, Guarana Powder, Guarana Syrup, Condensed Milk.',
    price: 13,
    imageUrl: acaiImg2,
    category: 'smoothies',
  },
  {
    id: 'smoothie-nido-chantilly',
    name: 'Smoothie w/ Nido Chantilly - 16oz',
    description:
      'Pure Organic Açai, Nido, Peanut, Cashew, Guarana Powder, Guarana Syrup, Condensed Milk and Nido Chantilly on top.',
    price: 14,
    imageUrl: acaiImg2,
    category: 'smoothies',
  },
  {
    id: 'passion-fruit-smoothie',
    name: 'Passion Fruit Smoothie',
    description: 'Condensed milk, powdered milk, passion fruit pulp, ice.',
    price: 13,
    imageUrl: acaiImg4,
    category: 'smoothies',
  },
  {
    id: 'cupuacu-smoothie',
    name: 'Cupuaçu Smoothie',
    description: 'Cupuacu Pulp, condensed milk, powdered milk, ice.',
    price: 13,
    imageUrl: acaiImg2,
    category: 'smoothies',
  },
  // Drinks
  {
    id: 'sprite',
    name: 'Sprite',
    description: 'Refreshing lemon-lime soda.',
    price: 2.5,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
  {
    id: 'coke',
    name: 'Coke',
    description: 'Classic Coca-Cola.',
    price: 2.5,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
  {
    id: 'guarana',
    name: 'Guarana',
    description: 'Brazilian guarana soda.',
    price: 3,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
  {
    id: 'guava-juice',
    name: 'Guava Juice',
    description: 'Fresh guava juice.',
    price: 2.5,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
  {
    id: 'passion-fruit-juice',
    name: 'Passion Fruit Juice',
    description: 'Fresh passion fruit juice.',
    price: 2.5,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
  {
    id: 'mango-juice',
    name: 'Mango Juice',
    description: 'Fresh mango juice.',
    price: 2.5,
    imageUrl: acaiImg4,
    category: 'drinks',
  },
];
