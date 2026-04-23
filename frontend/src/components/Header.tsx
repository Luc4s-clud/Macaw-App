import { Menu, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onCartClick: () => void;
}

const navItems = [
  { to: '/menu', label: 'Menu' },
  { to: '/track-order', label: 'Track Order' },
  { to: '/about', label: 'Our Story' },
  { to: '/events', label: 'Events & Specials' },
] as const;

function Header({ onCartClick }: HeaderProps) {
  const { items } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const displayName =
    profile?.fullName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    '';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navLinkBase =
    'text-white/90 hover:text-white transition-colors text-sm font-medium tracking-wide';
  const navLinkDesktop = `${navLinkBase} relative py-2 after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full`;

  return (
    <header
      className={`sticky top-0 z-30 transition-shadow duration-300 bg-primary border-b border-white/10 ${
        scrolled ? 'shadow-lg shadow-black/15' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[4.25rem] sm:h-16 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:justify-center gap-2 md:gap-3 w-full">
        <nav
          className="hidden md:flex items-center gap-7 lg:gap-9 md:justify-self-start"
          aria-label="Primary"
        >
          {navItems.map(({ to, label }) => (
            <Link key={to} to={to} className={navLinkDesktop}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 md:justify-self-center">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0"
            aria-label="Macaw Acaiteria - Home"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/12 flex items-center justify-center font-display font-bold text-white text-base sm:text-lg ring-1 ring-white/25">
              M
            </div>
            <div className="text-left min-w-0">
              <span className="font-display text-sm sm:text-lg font-semibold text-white tracking-tight block leading-tight truncate max-w-[11rem] sm:max-w-none">
                MACAW ACAITERIA
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/75">
                Real taste of Brazil
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 md:justify-self-end">
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 shrink-0" aria-label="Account">
            <a href="#gift-cards" className={navLinkBase}>
              Gift Cards
            </a>
            <Link
              to="/sign-in"
              className={`${navLinkBase} max-w-[10rem] truncate`}
              title={user ? 'Minha conta' : 'Entrar'}
            >
              {!authLoading && user
                ? displayName
                  ? displayName.split(/\s+/)[0]
                  : 'Account'
                : 'Sign In'}
            </Link>
            <button
              onClick={onCartClick}
              type="button"
              className="relative flex items-center gap-2 rounded-full bg-white/95 text-primary px-4 py-2 text-sm font-semibold shadow-md hover:bg-white ring-1 ring-white/30 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden />
              <span>Cart</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="sr-only">{mobileOpen ? 'Fechar menu' : 'Abrir menu'}</span>
          </button>
          <button
            onClick={onCartClick}
            type="button"
            className="md:hidden relative p-2 rounded-full bg-white/95 text-primary ring-1 ring-white/30"
            aria-label={`Carrinho${count > 0 ? `, ${count} itens` : ''}`}
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

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="md:hidden fixed inset-x-0 top-[4.25rem] bottom-0 bg-primary z-40 border-t border-white/10 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navegação"
        >
          <nav className="flex flex-col p-6 gap-1" aria-label="Mobile">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={
                  to === '/menu'
                    ? 'text-white text-lg font-semibold py-3 px-4 rounded-xl bg-white/10 border border-white/15'
                    : 'text-white/90 hover:text-white text-base font-medium py-3 px-4 rounded-xl hover:bg-white/5 transition-colors'
                }
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <hr className="border-white/15 my-3" />
            <a href="#gift-cards" className="text-white/85 py-2 px-4 text-sm">
              Gift Cards
            </a>
            <Link
              to="/sign-in"
              className="text-white/85 py-2 px-4 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {user ? (displayName ? `Olá, ${displayName.split(/\s+/)[0]}` : 'Minha conta') : 'Sign In'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
