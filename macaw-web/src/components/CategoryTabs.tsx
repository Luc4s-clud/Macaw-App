import type { CategoryId } from '../types/product';

const categories: { id: CategoryId; label: string }[] = [
  { id: 'build-your-own', label: 'Build your own' },
  { id: 'bowls-24oz', label: 'Bowls - 24 Oz' },
  { id: 'bowls-16oz', label: 'Bowls - 16 Oz' },
  { id: 'special-cups', label: 'Special Cups' },
  { id: 'smoothies', label: 'Smoothies' },
  { id: 'drinks', label: 'Drinks' },
];

interface Props {
  selected: CategoryId | string;
  onChange: (category: CategoryId) => void;
}

function CategoryTabs({ selected, onChange }: Props) {
  return (
    <div id="menu" className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => {
        const isActive = cat.id === selected;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`whitespace-nowrap rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white hover:border-primary/30'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryTabs;
