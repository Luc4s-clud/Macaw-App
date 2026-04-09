import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../types/product';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  observation?: string;
}

interface CartContextValue {
  items: CartItem[];
  total: number;
  addItem: (product: Product, observation?: string) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    [items]
  );

  function addItem(product: Product, observation?: string) {
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.product.id === product.id && i.observation === observation
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product,
          quantity: 1,
          observation,
        },
      ];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function changeQuantity(id: string, quantity: number) {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const value = useMemo(
    () => ({ items, total, addItem, removeItem, changeQuantity, clear }),
    [items, total]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
