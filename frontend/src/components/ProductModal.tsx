import type { Product } from '../types/product';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';
import ProductImageDisplay from './ProductImageDisplay';
import {
  COMBO_COUPLE_BOWL_MAX,
  COMBO_COUPLE_BOWLS,
  COMBO_COUPLE_FREE_TOPPINGS,
  COMBO_COUPLE_TOPPING_MAX,
  COMBO_INDIVIDUAL_BOWLS_8,
  COMBO_INDIVIDUAL_SODAS,
  COMBO_POPULAR_BOWLS_16,
  COMBO_POPULAR_CREPES,
  COMBO_POPULAR_CREPES_MAX,
  COMBO_POPULAR_JUICES,
  COMBO_PREMIUM_CUPS,
  detectComboProductKind,
  type ComboProductKind,
} from '../utils/comboMenuConfig';
import {
  isBowls16OzCategory,
  isBowls24OzCategory,
  isCoxinhaCategory,
  isCrepeSwissCategory,
  isSpecialCupsCategory,
} from '../utils/menuCategories';

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddedToCart?: () => void;
}

const REQUIRED_BASE_OPTIONS = ['Coconut', 'Acai', 'Blue magic', 'Pitaya'] as const;
const OPTIONAL_BUILD_OPTIONS = [
  'Blueberry',
  'Kiwi',
  'Mango',
  'Pineapple',
  'Strawberry',
  'Granola',
  'Ninho (Powdered milk)',
  'Nuts mix (cashews, peanut, walnuts)',
  'Coconut Flakes',
  'Chia seeds',
  'Condensed Milk',
  'Chocolate syrup',
  'Caramel syrup',
  'Strawberry syrup',
  'Honey',
  'Peanut Butter',
  'Banana',
] as const;
/** Adicionais opcionais para bowls 16 oz (categoria `bowls-16oz`), +$1.00 cada */
const BOWL_16_OZ_TOPPINGS = [
  'Banana',
  'Blueberry',
  'Caramel Syrup',
  'Chocolate Syrup',
  'Coconut Flakes',
  'Condensed Milk',
  'Ferrero Rocher',
  'Granola',
  'Honey',
  'Kiwi',
  'Mango',
  "M&M's",
  'Ninho Chantilly',
  'Ninho Cream',
  'Ninho (Dry Whole Milk)',
  'Nutella',
  'Nuts Mix (Cashews, Peanut, and Walnuts)',
  'Peanut Butter',
  'Strawberry',
  'Strawberry Syrup',
  'Paçoca',
] as const;

const BOWL_16_OZ_TOPPINGS_MAX = 21;

/** Bowls 24 oz e Special Cups — Extra toppings (ordem e preços conforme cardápio). */
const BOWL_24_OZ_EXTRA_TOPPINGS = [
  { name: 'Nutella', price: 1 },
  { name: 'Coconut Flakes', price: 1 },
  { name: 'Ninho Cream', price: 1 },
  { name: 'Ferrero Rocher', price: 1 },
  { name: "M&M's", price: 1 },
  { name: 'Strawberry', price: 1 },
  { name: 'Blueberry', price: 1 },
  { name: 'Banana', price: 1 },
  { name: 'Kiwi', price: 1 },
  { name: 'Ninho (Dry Whole Milk)', price: 1 },
  { name: 'Condensed Milk', price: 1 },
  { name: 'Granola', price: 1 },
  { name: 'Nuts Mix (cashews, peanut, walnuts)', price: 1 },
  { name: 'Caramel Syrup', price: 1 },
  { name: 'Chocolate Syrup', price: 1 },
  { name: 'Strawberry Syrup', price: 1 },
  { name: 'Honey', price: 1 },
  { name: 'Ninho Chantilly', price: 1 },
  { name: 'Mango', price: 1 },
  { name: 'Peanut Butter', price: 1 },
  { name: 'Chocolate Chips', price: 1 },
  { name: 'Vanilla Whey Protein', price: 3 },
  { name: 'Dulce de Leche', price: 1 },
  { name: 'Paçoca', price: 1 },
] as const;

const BOWL_24_OZ_EXTRA_MAX = 24;

const COXINHA_COMBO_GUARANA_PRICE = 2;

const CREPE_SWISS_FLAVORS = [
  'Cheese',
  'Ham and Cheese',
  'Cheese and Guava Paste',
  'Hot dog and Cheese',
  'Nutella',
  'Dulce de Leche',
] as const;

const EXTRA_TOPPINGS_OPTIONS = [
  { name: 'Paçoca', price: 1 },
  { name: 'Nutella', price: 1 },
  { name: 'Coconut Flakes', price: 1 },
  { name: 'Ninho Cream', price: 1 },
  { name: 'Ferrero Rocher', price: 1 },
  { name: "M&M's", price: 1 },
  { name: 'Strawberry', price: 1 },
  { name: 'Blueberry', price: 1 },
  { name: 'Banana', price: 1 },
  { name: 'Kiwi', price: 1 },
  { name: 'Ninho (Dry Whole Milk)', price: 1 },
  { name: 'Condensed Milk', price: 1 },
  { name: 'Granola', price: 1 },
  { name: 'Nuts Mix (cashews, peanut, walnuts)', price: 1 },
  { name: 'Caramel Syrup', price: 1 },
  { name: 'Chocolate Syrup', price: 1 },
  { name: 'Strawberry Syrup', price: 1 },
  { name: 'Honey', price: 1 },
  { name: 'Ninho Chantilly', price: 1 },
  { name: 'Mango', price: 1 },
  { name: 'Peanut Butter', price: 1 },
  { name: 'Chocolate Chips', price: 1 },
  { name: 'Vanilla Whey Protein', price: 3 },
  { name: 'Dulce de Leche', price: 1 },
] as const;

function ProductModal({ product, open, onClose, onAddedToCart }: Props) {
  const { addItem } = useCart();
  const [observation, setObservation] = useState('');
  const [selectedBase, setSelectedBase] = useState<string[]>([]);
  const [selectedBuildOwn, setSelectedBuildOwn] = useState<string[]>([]);
  const [selectedExtraToppings, setSelectedExtraToppings] = useState<string[]>([]);
  const [selectedBowl16Toppings, setSelectedBowl16Toppings] = useState<string[]>([]);
  const [selectedBowl24Extras, setSelectedBowl24Extras] = useState<string[]>([]);
  const [coxinhaComboGuarana, setCoxinhaComboGuarana] = useState(false);
  const [crepeSwissFlavor, setCrepeSwissFlavor] = useState('');
  const [comboPopularCrepes, setComboPopularCrepes] = useState<string[]>([]);
  const [comboPopularBowl16, setComboPopularBowl16] = useState('');
  const [comboPopularJuice, setComboPopularJuice] = useState('');
  const [comboIndividualBowl8, setComboIndividualBowl8] = useState('');
  const [comboIndividualSoda, setComboIndividualSoda] = useState('');
  const [comboCoupleBowls, setComboCoupleBowls] = useState<string[]>([]);
  const [comboCoupleFreeToppings, setComboCoupleFreeToppings] = useState<string[]>([]);
  const [comboPremiumCup, setComboPremiumCup] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isBuildYourOwn = product?.category === 'build-your-own';

  useEffect(() => {
    if (!open) return;
    setObservation('');
    setSelectedBase([]);
    setSelectedBuildOwn([]);
    setSelectedExtraToppings([]);
    setSelectedBowl16Toppings([]);
    setSelectedBowl24Extras([]);
    setCoxinhaComboGuarana(false);
    setCrepeSwissFlavor('');
    setComboPopularCrepes([]);
    setComboPopularBowl16('');
    setComboPopularJuice('');
    setComboIndividualBowl8('');
    setComboIndividualSoda('');
    setComboCoupleBowls([]);
    setComboCoupleFreeToppings([]);
    setComboPremiumCup('');
    setValidationError(null);
  }, [open, product?.id]);

  const extraPrice = useMemo(() => {
    const buildOwnExtras = selectedExtraToppings.reduce((sum, selectedName) => {
      const extra = EXTRA_TOPPINGS_OPTIONS.find((o) => o.name === selectedName);
      return sum + (extra?.price ?? 0);
    }, 0);
    const bowl16Extras = selectedBowl16Toppings.length * 1;
    const bowl24Extras = selectedBowl24Extras.reduce((sum, selectedName) => {
      const row = BOWL_24_OZ_EXTRA_TOPPINGS.find((o) => o.name === selectedName);
      return sum + (row?.price ?? 0);
    }, 0);
    const coxinhaExtra =
      product && isCoxinhaCategory(product.category) && coxinhaComboGuarana
        ? COXINHA_COMBO_GUARANA_PRICE
        : 0;
    return buildOwnExtras + bowl16Extras + bowl24Extras + coxinhaExtra;
  }, [
    selectedExtraToppings,
    selectedBowl16Toppings,
    selectedBowl24Extras,
    coxinhaComboGuarana,
    product,
  ]);

  if (!open || !product) return null;

  const currentProduct = product;
  const isBowls16Oz = isBowls16OzCategory(currentProduct.category);
  const isBowls24Oz = isBowls24OzCategory(currentProduct.category);
  const isSpecialCups = isSpecialCupsCategory(currentProduct.category);
  const showStandardExtraToppings = isBowls24Oz || isSpecialCups;
  const isCoxinha = isCoxinhaCategory(currentProduct.category);
  const isCrepeSwiss = isCrepeSwissCategory(currentProduct.category);
  const comboKind: ComboProductKind | null = detectComboProductKind(
    currentProduct.name,
    currentProduct.category
  );
  const finalPrice = currentProduct.price + extraPrice;

  function toggleOption(
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void,
    max: number
  ) {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
      return;
    }
    if (selected.length >= max) return;
    setSelected([...selected, value]);
  }

  function buildObservation(): string | undefined {
    const lines: string[] = [];
    if (isBuildYourOwn) {
      if (selectedBase.length > 0) lines.push(`Base: ${selectedBase.join(', ')}`);
      if (selectedBuildOwn.length > 0) lines.push(`Build your own: ${selectedBuildOwn.join(', ')}`);
      if (selectedExtraToppings.length > 0) {
        lines.push(`Extra toppings: ${selectedExtraToppings.join(', ')}`);
      }
    }
    if (isBowls16Oz && selectedBowl16Toppings.length > 0) {
      lines.push(`Toppings: ${selectedBowl16Toppings.join(', ')}`);
    }
    if (showStandardExtraToppings && selectedBowl24Extras.length > 0) {
      lines.push(`Extra toppings: ${selectedBowl24Extras.join(', ')}`);
    }
    if (isCoxinha && coxinhaComboGuarana) {
      lines.push('Combo - Guarana: Combo');
    }
    if (isCrepeSwiss && crepeSwissFlavor) {
      lines.push(`Swiss Crepe: ${crepeSwissFlavor}`);
    }
    if (comboKind === 'popular') {
      if (comboPopularCrepes.length > 0) {
        lines.push(`Choose your Crepes: ${comboPopularCrepes.join(', ')}`);
      }
      if (comboPopularBowl16) lines.push(`Choose your Bowl: ${comboPopularBowl16}`);
      if (comboPopularJuice) lines.push(`Choose your juice: ${comboPopularJuice}`);
    }
    if (comboKind === 'individual') {
      if (comboIndividualBowl8) lines.push(`Choose your bowl: ${comboIndividualBowl8}`);
      if (comboIndividualSoda) lines.push(`Choose your Soda: ${comboIndividualSoda}`);
    }
    if (comboKind === 'couple') {
      if (comboCoupleBowls.length > 0) {
        lines.push(`Choose your Bowl: ${comboCoupleBowls.join(', ')}`);
      }
      if (comboCoupleFreeToppings.length > 0) {
        lines.push(`free topping: ${comboCoupleFreeToppings.join(', ')}`);
      }
    }
    if (comboKind === 'premium' && comboPremiumCup) {
      lines.push(`Choose your Special Cup: ${comboPremiumCup}`);
    }
    const trimmed = observation.trim();
    if (trimmed) lines.push(`Special Requests: ${trimmed}`);
    return lines.length > 0 ? lines.join(' | ') : undefined;
  }

  function handleAdd() {
    if (isBuildYourOwn) {
      if (selectedBase.length < 1 || selectedBase.length > 2) {
        setValidationError('Selecione de 1 a 2 opções em Base.');
        return;
      }
      if (selectedBuildOwn.length > 3) {
        setValidationError('Selecione no máximo 3 opções em Build your own.');
        return;
      }
      if (selectedExtraToppings.length > 24) {
        setValidationError('Selecione no máximo 24 opções em Extra toppings.');
        return;
      }
    }
    if (isBowls16Oz && selectedBowl16Toppings.length > BOWL_16_OZ_TOPPINGS_MAX) {
      setValidationError(`Selecione no máximo ${BOWL_16_OZ_TOPPINGS_MAX} opções em Toppings.`);
      return;
    }
    if (showStandardExtraToppings && selectedBowl24Extras.length > BOWL_24_OZ_EXTRA_MAX) {
      setValidationError(`Selecione no máximo ${BOWL_24_OZ_EXTRA_MAX} opções em Extra toppings.`);
      return;
    }
    if (isCrepeSwiss && !crepeSwissFlavor) {
      setValidationError('Selecione 1 opção em Swiss Crepe.');
      return;
    }
    if (comboKind === 'popular') {
      if (
        comboPopularCrepes.length < 1 ||
        comboPopularCrepes.length > COMBO_POPULAR_CREPES_MAX
      ) {
        setValidationError('Selecione de 1 a 3 opções em Choose your Crepes.');
        return;
      }
      if (!comboPopularBowl16) {
        setValidationError('Selecione 1 opção em Choose your Bowl.');
        return;
      }
      if (!comboPopularJuice) {
        setValidationError('Selecione 1 opção em Choose your juice.');
        return;
      }
    }
    if (comboKind === 'individual') {
      if (!comboIndividualBowl8) {
        setValidationError('Selecione 1 opção em Choose your bowl.');
        return;
      }
      if (!comboIndividualSoda) {
        setValidationError('Selecione 1 opção em Choose your Soda.');
        return;
      }
    }
    if (comboKind === 'premium' && !comboPremiumCup) {
      setValidationError('Selecione 1 opção em Choose your Special Cup.');
      return;
    }
    setValidationError(null);
    addItem({ ...currentProduct, price: finalPrice }, buildObservation());
    setObservation('');
    onAddedToCart?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 pb-0 sm:pb-0">
      <div className="relative max-w-lg w-full sm:rounded-3xl rounded-t-3xl bg-white shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/90 shadow-md hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        <div className="h-36 sm:h-44 shrink-0 overflow-hidden">
          <ProductImageDisplay
            product={currentProduct}
            priority
            containerClassName="h-44 w-full"
            initialsClassName="text-3xl"
            imgClassName="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {currentProduct.name}
            </h2>
            <p className="text-sm text-slate-600">{currentProduct.description}</p>
          </div>

          {isBowls16Oz && (
            <section className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Optional
                </p>
                <p className="text-xs text-slate-500">select up to {BOWL_16_OZ_TOPPINGS_MAX}</p>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Toppings</h3>
              <div className="space-y-2 max-h-[min(40vh,280px)] overflow-y-auto pr-1">
                {BOWL_16_OZ_TOPPINGS.map((name) => (
                  <label
                    key={name}
                    className="flex items-center justify-between gap-2 text-sm text-slate-800"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedBowl16Toppings.includes(name)}
                        onChange={() =>
                          toggleOption(
                            name,
                            selectedBowl16Toppings,
                            setSelectedBowl16Toppings,
                            BOWL_16_OZ_TOPPINGS_MAX
                          )
                        }
                      />
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="text-slate-500 shrink-0">+ $1.00</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {showStandardExtraToppings && (
            <section className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Optional
                </p>
                <p className="text-xs text-slate-500">select up to {BOWL_24_OZ_EXTRA_MAX}</p>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Extra toppings</h3>
              <div className="space-y-2 max-h-[min(40vh,320px)] overflow-y-auto pr-1">
                {BOWL_24_OZ_EXTRA_TOPPINGS.map((option) => (
                  <label
                    key={option.name}
                    className="flex items-center justify-between gap-2 text-sm text-slate-800"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedBowl24Extras.includes(option.name)}
                        onChange={() =>
                          toggleOption(
                            option.name,
                            selectedBowl24Extras,
                            setSelectedBowl24Extras,
                            BOWL_24_OZ_EXTRA_MAX
                          )
                        }
                      />
                      <span className="truncate">{option.name}</span>
                    </span>
                    <span className="text-slate-500 shrink-0">
                      + ${option.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {isCoxinha && (
            <section className="rounded-2xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Optional
              </p>
              <h3 className="font-semibold text-slate-900 mb-3">Combo - Guarana</h3>
              <label className="flex items-center justify-between gap-2 text-sm text-slate-800">
                <span className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={coxinhaComboGuarana}
                    onChange={() => setCoxinhaComboGuarana((v) => !v)}
                  />
                  <span>Combo</span>
                </span>
                <span className="text-slate-500 shrink-0">
                  + ${COXINHA_COMBO_GUARANA_PRICE.toFixed(2)}
                </span>
              </label>
            </section>
          )}

          {isCrepeSwiss && (
            <section className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Required
                </p>
                <p className="text-xs text-slate-500">select 1</p>
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">Swiss Crepe</h3>
              <div className="space-y-2" role="radiogroup" aria-label="Swiss Crepe flavor">
                {CREPE_SWISS_FLAVORS.map((flavor) => (
                  <label
                    key={flavor}
                    className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="crepe-swiss-flavor"
                      className="shrink-0 accent-primary"
                      checked={crepeSwissFlavor === flavor}
                      onChange={() => setCrepeSwissFlavor(flavor)}
                    />
                    <span>{flavor}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {comboKind === 'popular' && (
            <>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1 to {COMBO_POPULAR_CREPES_MAX}</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your Crepes</h3>
                <div className="space-y-2">
                  {COMBO_POPULAR_CREPES.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={comboPopularCrepes.includes(opt)}
                        onChange={() =>
                          toggleOption(opt, comboPopularCrepes, setComboPopularCrepes, COMBO_POPULAR_CREPES_MAX)
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your Bowl</h3>
                <div className="space-y-2" role="radiogroup" aria-label="Combo Popular bowl">
                  {COMBO_POPULAR_BOWLS_16.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="combo-popular-bowl"
                        className="shrink-0 accent-primary"
                        checked={comboPopularBowl16 === opt}
                        onChange={() => setComboPopularBowl16(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your juice</h3>
                <div className="space-y-2" role="radiogroup" aria-label="Combo Popular juice">
                  {COMBO_POPULAR_JUICES.map(({ name, outOfStock }) => (
                    <label
                      key={name}
                      className={`flex items-center gap-2 text-sm ${
                        outOfStock ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="combo-popular-juice"
                        className="shrink-0 accent-primary disabled:opacity-50"
                        disabled={outOfStock}
                        checked={comboPopularJuice === name}
                        onChange={() => setComboPopularJuice(name)}
                      />
                      <span>
                        {name}
                        {outOfStock ? (
                          <span className="ml-2 text-xs font-medium text-amber-700">Out of stock</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {comboKind === 'individual' && (
            <>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your bowl</h3>
                <div className="space-y-2" role="radiogroup">
                  {COMBO_INDIVIDUAL_BOWLS_8.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="combo-individual-bowl"
                        className="shrink-0 accent-primary"
                        checked={comboIndividualBowl8 === opt}
                        onChange={() => setComboIndividualBowl8(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your Soda</h3>
                <div className="space-y-2" role="radiogroup">
                  {COMBO_INDIVIDUAL_SODAS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="combo-individual-soda"
                        className="shrink-0 accent-primary"
                        checked={comboIndividualSoda === opt}
                        onChange={() => setComboIndividualSoda(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {comboKind === 'couple' && (
            <>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Optional
                  </p>
                  <p className="text-xs text-slate-500">select up to {COMBO_COUPLE_BOWL_MAX}</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Choose your Bowl</h3>
                <div className="space-y-2">
                  {COMBO_COUPLE_BOWLS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={comboCoupleBowls.includes(opt)}
                        onChange={() =>
                          toggleOption(opt, comboCoupleBowls, setComboCoupleBowls, COMBO_COUPLE_BOWL_MAX)
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Optional
                  </p>
                  <p className="text-xs text-slate-500">select up to {COMBO_COUPLE_TOPPING_MAX}</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">free topping</h3>
                <div className="space-y-2">
                  {COMBO_COUPLE_FREE_TOPPINGS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={comboCoupleFreeToppings.includes(opt)}
                        onChange={() =>
                          toggleOption(
                            opt,
                            comboCoupleFreeToppings,
                            setComboCoupleFreeToppings,
                            COMBO_COUPLE_TOPPING_MAX
                          )
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {comboKind === 'premium' && (
            <section className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Required
                </p>
                <p className="text-xs text-slate-500">select 1</p>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Choose your Special Cup</h3>
              <div className="space-y-2" role="radiogroup">
                {COMBO_PREMIUM_CUPS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="combo-premium-cup"
                      className="shrink-0 accent-primary"
                      checked={comboPremiumCup === opt}
                      onChange={() => setComboPremiumCup(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {isBuildYourOwn && (
            <>
              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Required
                  </p>
                  <p className="text-xs text-slate-500">select 1 to 2</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Base</h3>
                <div className="space-y-2">
                  {REQUIRED_BASE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={selectedBase.includes(option)}
                        onChange={() => toggleOption(option, selectedBase, setSelectedBase, 2)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Optional
                  </p>
                  <p className="text-xs text-slate-500">select up to 3</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Build your own</h3>
                <div className="space-y-2">
                  {OPTIONAL_BUILD_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={selectedBuildOwn.includes(option)}
                        onChange={() =>
                          toggleOption(option, selectedBuildOwn, setSelectedBuildOwn, 3)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Optional
                  </p>
                  <p className="text-xs text-slate-500">select up to 24</p>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Extra toppings</h3>
                <div className="space-y-2">
                  {EXTRA_TOPPINGS_OPTIONS.map((option) => (
                    <label key={option.name} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={selectedExtraToppings.includes(option.name)}
                        onChange={() =>
                          toggleOption(
                            option.name,
                            selectedExtraToppings,
                            setSelectedExtraToppings,
                            24
                          )
                        }
                      />
                      <span>
                        {option.name} {option.price > 0 ? `(+ $${option.price.toFixed(2)})` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="space-y-2">
            <label
              htmlFor="observation"
              className="block text-xs font-medium text-slate-700 uppercase tracking-wide"
            >
              Special Requests
            </label>
            <textarea
              id="observation"
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={1000}
              placeholder="e.g. no granola, extra strawberries..."
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-500">{observation.length}/1000 characters</p>
          </div>

          {validationError && (
            <p className="text-sm text-red-600 font-medium">{validationError}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-lg text-primaryDark">
              $ {finalPrice.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-full bg-primary text-white font-semibold text-sm px-6 py-2.5 shadow-md hover:bg-primaryDark transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
