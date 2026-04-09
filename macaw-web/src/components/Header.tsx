import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onCartClick: () => void;
}

function Header({ onCartClick }: HeaderProps) {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLink =
    'text-white/95 hover:text-accent transition-colors text-sm font-medium';

  return (
    <header
      className={`sticky top-0 z-30 transition-shadow duration-300 bg-primary ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/menu" className={`${navLink} bg-accent/20 text-white px-3 py-1.5 rounded`}>
            Order Online
          </Link>
          <Link to="/menu" className={navLink}>
            Menu
          </Link>
          <Link to="/about" className={navLink}>
            Our Story
          </Link>
          <Link to="/events" className={navLink}>
            Events & Specials
          </Link>
        </nav>

        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Macaw Acaiteria - Home"
        >
          <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center font-display font-bold text-white text-lg border border-white/30">
            M
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-display text-lg font-semibold text-white tracking-tight block leading-tight">
              MACAW ACAITERIA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/80">
              Real taste of Brazil
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#gift-cards" className={navLink}>
            Gift Cards
          </a>
          <a href="#signin" className={navLink}>
            Sign In
          </a>
          <button
            onClick={onCartClick}
            type="button"
            className="relative flex items-center gap-2 rounded-full bg-accent text-primary px-4 py-2 text-sm font-semibold shadow-md hover:bg-violet-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Online</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </nav>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={onCartClick}
            type="button"
            className="relative p-2 rounded-full bg-accent text-primary"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
