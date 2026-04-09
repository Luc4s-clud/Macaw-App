import { useState } from 'react';
import { products } from '../data/products';
import type { CategoryId, Product } from '../types/product';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

interface Props {
  category: CategoryId | string;
  onItemAddedToCart: () => void;
  onSelectCategory?: (id: CategoryId) => void;
}

function MenuPage({ category, onItemAddedToCart }: Props) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = products.filter((p) => p.category === category);

  function openProduct(p: Product) {
    setSelected(p);
    setModalOpen(true);
  }

  const sectionTitles: Record<string, string> = {
    'build-your-own': 'Build your own',
    'bowls-24oz': 'Bowls - 24 Oz',
    'bowls-16oz': 'Bowls - 16 Oz',
    'special-cups': 'Special Cups',
    smoothies: 'Smoothies',
    drinks: 'Drinks',
  };
  const sectionTitle = sectionTitles[category] || 'Menu';

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h2 className="font-display text-xl md:text-2xl font-semibold text-slate-900">
            {sectionTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Click an item to customize and add to cart.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-8">
              More items coming soon to this category.
            </p>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => openProduct(product)}
              />
            ))
          )}
        </div>
      </div>

      <ProductModal
        product={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddedToCart={onItemAddedToCart}
      />
    </>
  );
}

export default MenuPage;
