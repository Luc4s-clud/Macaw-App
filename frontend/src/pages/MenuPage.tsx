import { useState, useEffect, useMemo } from 'react';
import { getMenu } from '../services/api';
import type { ApiMenuItem } from '../services/api/types';
import type { Product } from '../types/product';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import CategorySidebar from '../components/CategorySidebar';
import { buildMenuCategories } from '../utils/menuCategories';
import { MENU_IMAGE_PRIORITY_COUNT } from '../utils/menuImagePreload';

function apiItemToProduct(m: ApiMenuItem): Product {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price,
    imageUrl: (m.imageUrl || '').trim(),
    category: m.category,
  };
}

interface Props {
  onItemAddedToCart: () => void;
}

function MenuPage({ onItemAddedToCart }: Props) {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const categories = useMemo(() => buildMenuCategories(menuItems), [menuItems]);

  useEffect(() => {
    let cancelled = false;
    getMenu()
      .then((items) => {
        if (cancelled) return;
        setMenuItems(items.map(apiItemToProduct));
        setError(null);
        setSelectedCategory((prev) => {
          const cats = buildMenuCategories(items.map(apiItemToProduct));
          const tabIds = cats.map((c) => c.id);
          if (tabIds.length === 0) return prev;
          return prev && tabIds.includes(prev) ? prev : tabIds[0];
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Falha ao carregar o menu.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!selectedCategory) return menuItems;
    const tab = categories.find((c) => c.id === selectedCategory);
    const ids = tab?.backendIds;
    if (ids && ids.length > 0) {
      return menuItems.filter((p) => ids.includes(p.category));
    }
    return menuItems.filter((p) => p.category === selectedCategory);
  }, [menuItems, selectedCategory, categories]);

  const sectionTitle =
    categories.find((c) => c.id === selectedCategory)?.label ?? 'Menu';

  function openProduct(p: Product) {
    setSelected(p);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-lg">Carregando menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
        <p className="font-semibold text-amber-800">Não foi possível carregar o menu</p>
        <p className="mt-1 text-sm text-amber-700">{error}</p>
        <p className="mt-3 text-xs text-amber-600">
          Verifique se o backend está rodando e se o Square está configurado (VITE_API_URL e variáveis do backend).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 md:gap-6 lg:gap-10">
        <CategorySidebar
          categories={categories.length > 0 ? categories : undefined}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <div className="flex-1 min-w-0 space-y-3 sm:space-y-6 md:min-h-0">
          <header className="relative rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white/80 px-3 py-2.5 sm:px-6 sm:py-5 shadow-sm backdrop-blur-sm">
            <div className="absolute left-0 top-3 bottom-3 sm:top-4 sm:bottom-4 w-0.5 sm:w-1 rounded-r-full bg-gradient-to-b from-primary to-primaryDark opacity-90" />
            <div className="pl-3 sm:pl-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1.5 sm:gap-3">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  Our menu
                </p>
                <h2 className="mt-0.5 sm:mt-1 font-display text-lg sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  {sectionTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md sm:text-right leading-snug sm:leading-relaxed">
                Tap a card to choose options and add to your order.
              </p>
            </div>
          </header>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {filtered.length === 0 ? (
              <p className="col-span-full text-center text-slate-500 py-8">
                Nenhum item nesta categoria. Adicione itens no catálogo do Square para aparecerem aqui.
              </p>
            ) : (
              filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < MENU_IMAGE_PRIORITY_COUNT}
                  onClick={() => openProduct(product)}
                />
              ))
            )}
          </div>
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
