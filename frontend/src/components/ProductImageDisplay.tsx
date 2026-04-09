import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { productGradientStyle, productInitials } from '../utils/productImage';

interface ProductLike {
  id: string;
  name: string;
  imageUrl: string;
}

interface Props {
  product: ProductLike;
  /** ex.: h-40, ou w-16 h-16 */
  containerClassName: string;
  initialsClassName?: string;
  imgClassName?: string;
  alt?: string;
  /** Primeiras do /menu ou modal: inicia download antes e com prioridade alta no navegador. */
  priority?: boolean;
  /** Cards no mobile: círculo de iniciais menor (não usar no modal). */
  compactPlaceholder?: boolean;
}

/**
 * Foto do Square ou placeholder (gradiente + iniciais).
 * Usa placeholder atrás da imagem até onLoad para transição rápida; prioriza primeiras fotos quando `priority`.
 */
function ProductImageDisplay({
  product,
  containerClassName,
  initialsClassName = 'text-2xl md:text-3xl',
  imgClassName = 'w-full h-full object-cover',
  alt,
  priority = false,
  compactPlaceholder = false,
}: Props) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const url = product.imageUrl?.trim();
  const showImg = Boolean(url) && !broken;

  useEffect(() => {
    setBroken(false);
    setLoaded(false);
  }, [product.id, product.imageUrl]);

  useLayoutEffect(() => {
    if (!showImg) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [showImg, url, product.id]);

  if (!showImg) {
    return (
      <div
        className={`relative flex items-center justify-center select-none overflow-hidden ${containerClassName}`}
        style={productGradientStyle(product.id)}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <span
          className={`relative z-[1] font-display font-bold tracking-tight text-primaryDark/90 drop-shadow-sm rounded-full flex items-center justify-center bg-white/55 backdrop-blur-[2px] ${
            compactPlaceholder
              ? 'ring-2 ring-white/40 w-10 h-10'
              : 'ring-4 ring-white/40 w-[4.25rem] h-[4.25rem]'
          } ${initialsClassName}`}
        >
          {productInitials(product.name)}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <div
        className="absolute inset-0 z-0"
        style={productGradientStyle(product.id)}
        aria-hidden
      />
      <img
        ref={imgRef}
        src={url}
        alt={alt ?? product.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
        className={`relative z-[1] ${imgClassName} transition-opacity duration-300 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default ProductImageDisplay;
