import { Menu, ShoppingBag, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
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

  const navLinkBase = 'transition-colors text-sm font-medium tracking-wide';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 bg-gradient-to-r from-primaryDark via-primary to-primaryDark border-b border-white/10 ${
        scrolled ? 'shadow-xl shadow-black/30 backdrop-blur-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[4.25rem] sm:h-[4.6rem] flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:justify-center gap-2 md:gap-4 w-full">
        <nav
          className="hidden md:flex items-center gap-2 md:justify-self-start rounded-full bg-white/10 ring-1 ring-white/20 px-2 py-1 backdrop-blur-sm"
          aria-label="Primary"
        >
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${navLinkBase} relative px-4 py-2 rounded-full ${
                  isActive
                    ? 'bg-white !text-primaryDark shadow-sm font-semibold'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 md:justify-self-center">
          <Link
            to="/"
            className="group flex items-center gap-2 sm:gap-3 shrink-0 rounded-full bg-white/10 pl-1.5 pr-3 py-1 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/15 hover:ring-white/35"
            aria-label="Macaw Acaiteria - Home"
          >
            <img
              src="/pictures/15Macaw_RGB.png"
              alt="Macaw Acaiteria logo"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ring-1 ring-white/35 shadow-sm"
            />
            <div className="text-left min-w-0">
              <span className="font-display text-sm sm:text-lg font-semibold text-white tracking-tight block leading-tight truncate max-w-[11rem] sm:max-w-none">
                MACAW ACAITERIA
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/80 group-hover:text-white/90 transition-colors">
                Real taste of Brazil
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 md:justify-self-end">
          <nav
            className="hidden md:flex items-center gap-2 shrink-0 rounded-full bg-white/10 ring-1 ring-white/20 px-2 py-1 backdrop-blur-sm"
            aria-label="Account"
          >
            <a href="#gift-cards" className={`${navLinkBase} px-3 py-2 text-white/90 hover:text-white rounded-full hover:bg-white/10`}>
              Gift Cards
            </a>
            <NavLink
              to="/sign-in"
              className={({ isActive }) =>
                `${navLinkBase} max-w-[10rem] truncate px-3 py-2 rounded-full ${
                  isActive
                    ? 'bg-white !text-primaryDark shadow-sm font-semibold'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`
              }
              title={user ? 'My account' : 'Sign In'}
            >
              {!authLoading && user
                ? displayName
                  ? displayName.split(/\s+/)[0]
                  : 'Account'
                : 'Sign In'}
            </NavLink>
            <button
              onClick={onCartClick}
              type="button"
              data-cart-button="true"
              className="relative flex items-center gap-2 rounded-full bg-white/95 text-primary px-4 py-2 text-sm font-semibold shadow-md hover:bg-white ring-1 ring-white/30 transition-all hover:shadow-lg"
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
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
          <button
            onClick={onCartClick}
            type="button"
            data-cart-button="true"
            className="md:hidden relative p-2 rounded-full bg-white/95 text-primary ring-1 ring-white/30 shadow-sm"
            aria-label={`Cart${count > 0 ? `, ${count} items` : ''}`}
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
          className="md:hidden fixed inset-x-0 top-[4.25rem] sm:top-[4.6rem] bottom-0 bg-gradient-to-b from-primary to-primaryDark z-40 border-t border-white/10 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <nav className="flex flex-col p-5 gap-2" aria-label="Mobile">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary text-base font-semibold py-3 px-4 rounded-xl bg-white shadow-sm'
                    : 'text-white/90 hover:text-white text-base font-medium py-3 px-4 rounded-xl hover:bg-white/10 transition-colors'
                }
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <hr className="border-white/15 my-3" />
            <a href="#gift-cards" className="text-white/85 py-2 px-4 text-sm rounded-lg hover:bg-white/10 transition-colors">
              Gift Cards
            </a>
            <NavLink
              to="/sign-in"
              className={({ isActive }) =>
                `py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-white text-primary' : 'text-white/85 hover:bg-white/10'
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              {user ? (displayName ? `Hi, ${displayName.split(/\s+/)[0]}` : 'My account') : 'Sign In'}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
