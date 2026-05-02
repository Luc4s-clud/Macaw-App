import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface MobileBottomBarProps {
  onPromoClick: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MobileBottomBar({ onPromoClick }: MobileBottomBarProps) {
  const [scrollY, setScrollY] = useState(0);
  const [promoClosed, setPromoClosed] = useState(false);

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (scrollY < 40) {
      setPromoClosed(false);
    }
  }, [scrollY]);

  const progress = useMemo(() => {
    if (promoClosed) return 0;
    return clamp((scrollY - 28) / 240, 0, 1);
  }, [promoClosed, scrollY]);

  const compactOpacity = clamp(1 - progress * 1.6, 0, 1);
  const compactTranslate = progress * 18;
  const compactScale = 1 - progress * 0.07;

  const promoOpacity = clamp((progress - 0.12) / 0.88, 0, 1);
  const promoTranslate = (1 - promoOpacity) * 22;
  const promoScale = 0.96 + promoOpacity * 0.04;

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 px-2 pb-2 pointer-events-none"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-hidden={false}
    >
      <div className="mx-auto w-full max-w-xl relative min-h-[10.5rem]">
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: compactOpacity,
            transform: `translateY(${compactTranslate}px) scale(${compactScale})`,
            pointerEvents: compactOpacity > 0.15 ? 'auto' : 'none',
          }}
        >
          <div className="overflow-hidden rounded-full border border-white/25 bg-primary/95 text-white shadow-[0_14px_32px_rgba(39,10,58,0.35)] backdrop-blur-md">
            <div className="grid grid-cols-3 divide-x divide-white/25">
              <Link to="/menu" className="py-3 text-center text-[1.15rem] font-medium tracking-wide hover:bg-white/10 transition-colors">
                Order Online
              </Link>
              <Link to="/sign-in" className="py-3 text-center text-[1.15rem] font-medium tracking-wide hover:bg-white/10 transition-colors">
                Sign In
              </Link>
              <Link
                to="/sign-in?mode=register"
                className="py-3 text-center text-[1.15rem] font-medium tracking-wide hover:bg-white/10 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: promoOpacity,
            transform: `translateY(${promoTranslate}px) scale(${promoScale})`,
            pointerEvents: promoOpacity > 0.15 ? 'auto' : 'none',
          }}
        >
          <div
            className="relative rounded-2xl border border-white/20 bg-primary/95 px-5 py-4 text-white shadow-[0_16px_36px_rgba(39,10,58,0.4)] backdrop-blur-md cursor-pointer"
            onClick={onPromoClick}
            role="button"
            tabIndex={0}
            aria-label="Open sign in or register"
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPromoClick();
              }
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setPromoClosed(true);
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close promotion"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="pr-8 text-[2rem] leading-none font-semibold tracking-tight">Get 30% off your first order</p>
            <p className="mt-3 text-lg leading-snug text-white/90">
              Become a VIP, get 30% off your first order and receive updates on future discounts, loyalty and more!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileBottomBar;
