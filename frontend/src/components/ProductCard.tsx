import type { Product } from '../types/product';
import ProductImageDisplay from './ProductImageDisplay';

interface Props {
  product: Product;
  onClick: () => void;
  priority?: boolean;
}

function ProductCard({ product, onClick, priority = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden bg-white flex flex-col border border-slate-200/90 shadow-[0_4px_20px_rgba(109,40,217,0.07)] hover:shadow-[0_12px_40px_rgba(109,40,217,0.12)] hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Mobile: altura fixa baixa para não ocupar metade da tela; desktop: proporção 4:3 */}
      <div className="relative h-24 shrink-0 overflow-hidden bg-slate-100 md:h-auto md:aspect-[4/3]">
        <ProductImageDisplay
          product={product}
          priority={priority}
          compactPlaceholder
          initialsClassName="text-sm sm:text-base md:text-2xl"
          containerClassName="absolute inset-0 w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/5 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      </div>
      <div className="flex-1 p-2.5 sm:p-5 flex flex-col gap-1.5 sm:gap-3 min-h-0 sm:min-h-[7.5rem]">
        <div className="space-y-1 sm:space-y-1.5">
          <h3 className="font-display text-sm sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-primaryDark transition-colors">
            {product.name}
          </h3>
          {product.description ? (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {product.description}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span className="font-display text-base sm:text-lg font-semibold tabular-nums text-primaryDark">
            ${product.price.toFixed(2)}
          </span>
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primaryDark text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 sm:px-4 sm:py-2 shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            Add to order
          </span>
        </div>
      </div>
    </button>
  );
}

export default ProductCard;
