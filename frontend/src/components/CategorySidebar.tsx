export interface CategoryTabItem {
  id: string;
  label: string;
  /** IDs vindos da API neste grupo (para filtro); default = [id] */
  backendIds?: string[];
}

const DEFAULT_CATEGORIES: CategoryTabItem[] = [
  { id: 'build-your-own', label: 'Build your own', backendIds: ['build-your-own'] },
  { id: 'bowls-24oz', label: 'Bowls - 24 Oz', backendIds: ['bowls-24oz'] },
  { id: 'bowls-16oz', label: 'Bowls - 16 Oz', backendIds: ['bowls-16oz'] },
  { id: 'special-cups', label: 'Special Cups', backendIds: ['special-cups'] },
  { id: 'smoothies', label: 'Smoothies', backendIds: ['smoothies'] },
  { id: 'drinks', label: 'Drinks', backendIds: ['drinks'] },
];

/** Converte id do Square (ex: "bowls-24oz") em label amigável */
export function categoryIdToLabel(id: string): string {
  const known: Record<string, string> = {
    'build-your-own': 'Build your own',
    'bowls-24oz': 'Bowls - 24 Oz',
    'bowls-16oz': 'Bowls - 16 Oz',
    'special-cups': 'Special Cups',
    smoothies: 'Smoothies',
    drinks: 'Drinks',
  };
  return known[id] ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  categories?: CategoryTabItem[];
  selected: string;
  onChange: (category: string) => void;
}

const chipActive =
  'bg-gradient-to-br from-primary to-primaryDark text-white shadow-md ring-1 ring-white/20';
const chipIdle =
  'bg-white text-slate-700 border border-slate-200/90 active:scale-[0.98]';

const rowActive =
  'bg-gradient-to-br from-primary to-primaryDark text-white shadow-lg shadow-primary/25 ring-1 ring-white/20';
const rowIdle =
  'text-slate-700 bg-white/60 hover:bg-violet-50 border border-slate-200/80 hover:border-primary/30 hover:text-primaryDark';

function CategorySidebar({ categories = DEFAULT_CATEGORIES, selected, onChange }: Props) {
  return (
    <>
      {/* Mobile: faixa horizontal com rolagem — evita coluna estreita ao lado do grid */}
      <nav
        className="md:hidden sticky z-[15] -mx-1 px-1 pt-0.5 pb-2 mb-0.5 bg-gradient-to-b from-white/98 via-white/95 to-transparent backdrop-blur-md border-b border-slate-200/70"
        style={{ top: 'calc(4.25rem + env(safe-area-inset-top, 0px))' }}
        aria-label="Categorias do menu"
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary/70 px-1.5 mb-1.5">
          Categorias
        </p>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-touch pb-0.5 pl-1.5 pr-3 snap-x snap-mandatory">
          {categories.map((cat) => {
            const isActive = cat.id === selected;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange(cat.id)}
                className={`shrink-0 snap-start max-w-[80vw] rounded-full px-3 py-1.5 text-left text-[13px] font-medium antialiased leading-snug transition-all duration-200 ${
                  isActive ? chipActive : chipIdle
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop: sidebar vertical */}
      <div className="hidden md:block w-48 lg:w-[15.5rem] shrink-0" aria-hidden />
      <aside
        id="menu"
        className="hidden md:flex fixed z-20 top-24 lg:top-28 left-[max(0.75rem,calc((100vw-80rem)/2+0.75rem))] lg:left-[max(1rem,calc((100vw-80rem)/2+1rem))] flex-col w-48 lg:w-[15.5rem] rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-white to-violet-50/40 backdrop-blur-md p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-8rem)]"
        aria-label="Categorias do menu"
      >
        <div className="mb-3 sm:mb-4 px-0.5">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-primary/75">
            Menu
          </p>
          <h2 className="mt-1 font-display text-sm sm:text-base font-semibold text-slate-900 leading-tight">
            Categorias
          </h2>
        </div>
        <nav
          className="flex flex-col gap-1.5 overflow-y-auto pr-1 -mr-1 min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.primary/0.35)_transparent]"
          aria-label="Lista de categorias"
        >
          {categories.map((cat) => {
            const isActive = cat.id === selected;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange(cat.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm font-medium antialiased leading-snug transition-all duration-200 break-words whitespace-normal ${
                  isActive ? rowActive : rowIdle
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default CategorySidebar;
