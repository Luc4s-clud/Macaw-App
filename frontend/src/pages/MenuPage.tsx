import { useState, useEffect, useMemo, useRef } from 'react';
import { Clock3 } from 'lucide-react';
import { getMenu } from '../services/api';
import type { ApiMenuItem } from '../services/api/types';
import type { Product } from '../types/product';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import CategorySidebar from '../components/CategorySidebar';
import { buildMenuCategories } from '../utils/menuCategories';
import { MENU_IMAGE_PRIORITY_COUNT } from '../utils/menuImagePreload';

const DOORDASH_STORE_URL =
  'https://www.doordash.com/store/34592142?utm_source=mx_share&aw=eBQoi5Vv2wtWXSdq';
const UBER_EATS_STORE_URL =
  'https://www.ubereats.com/store-browse-uuid/9c6f9c55-08b1-5b2f-a082-499cbc9d0677?diningMode=DELIVERY';
const DOORDASH_LOGO_URL = '/pictures/logodoordash.png';
const UBER_EATS_LOGO_URL = '/pictures/logoubereats.png';
const STORE_TIME_ZONE = 'America/New_York';
const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 21 * 60 + 30;

function formatUsHour(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}${isPm ? 'PM' : 'AM'}`;
}

function getStoreTimeParts(reference: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(reference);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return {
    weekday,
    minutes: hour * 60 + minute,
  };
}

function getStoreStatus(reference: Date) {
  const { weekday, minutes } = getStoreTimeParts(reference);
  const isTuesday = weekday === 'Tue';
  const isOpen = !isTuesday && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;

  return {
    isOpen,
    isTuesday,
    opensAt: formatUsHour(OPEN_MINUTES),
    closesAt: formatUsHour(CLOSE_MINUTES),
  };
}

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

function normalizeTextForKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNameForDedupe(name: string): string {
  return normalizeTextForKey(name)
    .replace(/\bacai\b/g, ' ')
    .replace(/\bbowl\b/g, ' ')
    .replace(/\bregular\b/g, ' ')
    .replace(/\bsmall\b|\blarge\b/g, ' ')
    .replace(/\b\d+\s*oz\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeCategoryForDedupe(category: string): string {
  const key = normalizeTextForKey(category).replace(/\s+/g, '-');
  const aliases: Record<string, string> = {
    'build-your-own': 'build-your-own',
    'build-you-own': 'build-your-own',
    'bowls-16-oz': 'bowls-16oz',
    'bowls-16oz': 'bowls-16oz',
    'bowls16oz': 'bowls-16oz',
    'bowls-24-oz': 'bowls-24oz',
    'bowls-24oz': 'bowls-24oz',
    'bowls24oz': 'bowls-24oz',
    'special-cup': 'special-cups',
    'special-cups': 'special-cups',
    'crepe-swiss': 'crepe-swiss',
    'crpe-swiss': 'crepe-swiss',
  };
  return aliases[key] || key;
}

/** Oculta duplicatas "Açaí Bowl - 16/24 Oz" em Build your own (mantém Bowl - 16oz/24oz com foto). */
function isHiddenBuildYourOwnDuplicate(product: Product): boolean {
  if (canonicalizeCategoryForDedupe(product.category) !== 'build-your-own') {
    return false;
  }
  const n = normalizeTextForKey(product.name);
  return /^acai bowl (16|24) oz regular$/.test(n);
}

function dedupeProducts(products: Product[]): Product[] {
  const byKey = new Map<string, Product>();
  for (const item of products) {
    const nameKey = normalizeNameForDedupe(item.name) || normalizeTextForKey(item.name);
    const categoryKey = canonicalizeCategoryForDedupe(item.category);
    const key = `${categoryKey}|${nameKey}|${Number(item.price).toFixed(2)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, item);
      continue;
    }
    // Sempre mantém a versão com imagem quando houver conflito.
    const prevHasImage = Boolean(prev.imageUrl?.trim());
    const nextHasImage = Boolean(item.imageUrl?.trim());
    if (nextHasImage && !prevHasImage) {
      byKey.set(key, item);
      continue;
    }
    if (prevHasImage && !nextHasImage) continue;

    const prevScore = (prev.description ? 1 : 0) + prev.name.length;
    const nextScore = (item.description ? 1 : 0) + item.name.length;
    if (nextScore > prevScore || (nextScore === prevScore && item.id < prev.id)) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()];
}

interface Props {
  onItemAddedToCart: () => void;
}

function MenuPage({ onItemAddedToCart }: Props) {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const [showClosedNotice, setShowClosedNotice] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const categories = useMemo(() => buildMenuCategories(menuItems), [menuItems]);

  useEffect(() => {
    if (orderType !== 'pickup') return undefined;
    let cancelled = false;
    let firstLoad = true;

    const syncMenu = (forceRefresh = false) => {
      if (firstLoad) setLoading(true);
      return getMenu({ forceRefresh })
        .then((items) => {
        if (cancelled) return;
        const mapped = dedupeProducts(
          items.map(apiItemToProduct).filter((p) => !isHiddenBuildYourOwnDuplicate(p))
        );
        setMenuItems(mapped);
        setError(null);
        setSelectedCategory((prev) => {
          const cats = buildMenuCategories(mapped);
          const tabIds = cats.map((c) => c.id);
          if (tabIds.length === 0) return prev;
          return prev && tabIds.includes(prev) ? prev : tabIds[0];
        });
      })
        .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load menu.');
      })
        .finally(() => {
        if (!cancelled) setLoading(false);
          firstLoad = false;
      });
    };

    void syncMenu(true);

    const interval = window.setInterval(() => {
      void syncMenu(true);
    }, 120_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orderType]);

  useEffect(() => {
    setMenuVisible(false);
    const timer = window.setTimeout(() => {
      setMenuVisible(true);
    }, 30);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const groupedSections = useMemo(() => {
    if (categories.length === 0) {
      return [{ id: 'menu', label: 'Menu', items: menuItems }];
    }
    return categories.map((cat) => {
      const ids = cat.backendIds;
      const items =
        ids && ids.length > 0
          ? menuItems.filter((p) => ids.includes(p.category))
          : menuItems.filter((p) => p.category === cat.id);
      return { id: cat.id, label: cat.label, items };
    });
  }, [categories, menuItems]);

  const sectionTitle = groupedSections.find((c) => c.id === selectedCategory)?.label ?? 'Menu';
  const storeStatus = useMemo(() => getStoreStatus(new Date(timeTick)), [timeTick]);
  const hasAnySectionItems = groupedSections.some((section) => section.items.length > 0);

  useEffect(() => {
    if (!storeStatus.isOpen) {
      setShowClosedNotice(true);
    }
  }, [storeStatus.isOpen]);

  useEffect(() => {
    if (orderType !== 'pickup' || groupedSections.length === 0) return;

    const visibleSections = groupedSections.filter((section) => section.items.length > 0);
    if (visibleSections.length === 0) return;

    let ticking = false;
    const anchorOffset = 150; // considera navbar fixa + margem visual de leitura

    const updateActiveCategory = () => {
      ticking = false;

      let candidate = visibleSections[0].id;
      for (const section of visibleSections) {
        const el = sectionRefs.current[section.id];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - anchorOffset <= 0) {
          candidate = section.id;
        } else {
          break;
        }
      }

      setSelectedCategory((prev) => (prev === candidate ? prev : candidate));
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveCategory);
    };

    // sincroniza categoria ativa ao entrar na página/atualizar conteúdo
    window.setTimeout(onScrollOrResize, 0);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [groupedSections, orderType]);

  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId);
    const el = sectionRefs.current[categoryId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openProduct(p: Product) {
    setSelected(p);
    setModalOpen(true);
  }

  if (orderType === 'pickup' && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-lg">Loading menu...</p>
      </div>
    );
  }

  if (orderType === 'pickup' && error) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
        <p className="font-semibold text-amber-800">Could not load the menu</p>
        <p className="mt-1 text-sm text-amber-700">{error}</p>
        <p className="mt-3 text-xs text-amber-600">
          Please make sure the backend is running and Square is configured (`VITE_API_URL` and backend
          environment variables).
        </p>
      </div>
    );
  }

  return (
    <div
      className={`transition-opacity duration-500 ease-out ${
        menuVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {orderType === null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold text-slate-900">How do you want to order?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose pickup to order directly on this website, or delivery to continue with our
              partners.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primaryDark"
              >
                Pickup
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {!storeStatus.isOpen && showClosedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
              <Clock3 className="h-7 w-7" />
            </div>
            <h2 className="text-center font-display text-3xl font-semibold text-slate-900">
              We are currently closed
            </h2>
            <p className="mt-2 text-center text-sm font-medium text-slate-700">
              Business hours: {storeStatus.opensAt} to {storeStatus.closesAt}
            </p>
            <p className="mt-1 text-center text-sm text-slate-600">
              {storeStatus.isTuesday
                ? 'We are closed on Tuesdays.'
                : 'We will be back during the next business hours.'}
            </p>
            <button
              type="button"
              onClick={() => setShowClosedNotice(false)}
              className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primaryDark"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {orderType === 'delivery' && (
        <section className="mx-auto mb-5 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Delivery</h2>
          <p className="mt-2 text-sm text-slate-600">
            Continue your delivery order through DoorDash or Uber Eats.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              href={DOORDASH_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF3008] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <img
                src={DOORDASH_LOGO_URL}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 rounded object-cover"
              />
              Order on DoorDash
            </a>
            <a
              href={UBER_EATS_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <img
                src={UBER_EATS_LOGO_URL}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 rounded object-cover"
              />
              Order on Uber Eats
            </a>
          </div>
          <button
            type="button"
            onClick={() => setOrderType('pickup')}
            className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Switch to Pickup
          </button>
        </section>
      )}

      {orderType !== 'pickup' ? null : (
      <div className="flex flex-col md:flex-row items-stretch md:items-start gap-3 md:gap-6 lg:gap-10">
        <CategorySidebar
          categories={categories.length > 0 ? categories : undefined}
          selected={selectedCategory}
          onChange={handleCategoryChange}
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
          {!hasAnySectionItems ? (
            <p className="col-span-full text-center text-slate-500 py-8">
              No items in this category yet. Add items in the Square catalog to show them here.
            </p>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {groupedSections.map((section) => (
                <section
                  key={section.id}
                  data-category-id={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-28"
                >
                  <div className="mb-3">
                    <h3 className="inline-flex items-center rounded-xl border border-white/70 bg-white/85 px-3 py-1.5 font-display text-lg sm:text-2xl font-semibold text-slate-900 tracking-tight shadow-sm backdrop-blur-sm">
                      {section.label}
                    </h3>
                  </div>
                  {section.items.length === 0 ? (
                    <p className="text-sm text-slate-500 py-3">
                      No items in this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                      {section.items.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          priority={index < MENU_IMAGE_PRIORITY_COUNT}
                          onClick={() => openProduct(product)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {orderType === 'pickup' && (
        <ProductModal
          product={selected}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAddedToCart={onItemAddedToCart}
        />
      )}
    </div>
  );
}

export default MenuPage;
