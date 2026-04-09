import type { Product } from '../types/product';

interface Props {
  product: Product;
  onClick: () => void;
}

function ProductCard({ product, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2">
        <div>
          <h3 className="font-display text-base md:text-lg font-semibold text-slate-900">
            {product.name}
          </h3>
          <p className="text-xs md:text-sm text-slate-600 line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-primaryDark">
            ${product.price.toFixed(2)}
          </span>
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-white text-xs font-semibold px-3 py-1 group-hover:bg-primaryDark transition-colors">
            Order
          </span>
        </div>
      </div>
    </button>
  );
}

export default ProductCard;
