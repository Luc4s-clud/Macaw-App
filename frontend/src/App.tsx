import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { prefetchMenu } from './services/api';
import Header from './components/Header';
import Hero from './components/Hero';
import HomeSections from './components/HomeSections';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import HiringPage from './pages/HiringPage';
import ContactPage from './pages/ContactPage';
import EventsPage from './pages/EventsPage';
import SignInPage from './pages/SignInPage';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import MobileBottomBar from './components/MobileBottomBar';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutCompletePage from './pages/CheckoutCompletePage';
import TrackOrderPage from './pages/TrackOrderPage';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'sonner';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWelcomeOrderModal, setShowWelcomeOrderModal] = useState(() => location.pathname === '/');
  const [isNavigatingToMenu, setIsNavigatingToMenu] = useState(false);

  useEffect(() => {
    prefetchMenu();
  }, []);

  const path = location.pathname;
  const isAbout = path === '/about';
  const isHiring = path === '/hiring';
  const isContact = path === '/contact';
  const isEvents = path === '/events';
  const isSignIn = path === '/sign-in';
  const isTrackOrder = path === '/track-order';
  const isCheckout = path === '/checkout' || path === '/checkout/complete';
  const backgroundImage = isAbout
    ? '/pictures/about.avif'
    : isHiring || isContact || isEvents || isSignIn || isCheckout || isTrackOrder
      ? 'none'
      : '/pictures/Painel1.avif';
  const plainBg =
    isHiring || isContact || isEvents || isSignIn || isCheckout || isTrackOrder
      ? 'bg-amber-50/95'
      : '';

  function handleOrderNowClick() {
    setIsNavigatingToMenu(true);
    window.setTimeout(() => {
      setShowWelcomeOrderModal(false);
      navigate('/menu');
      setIsNavigatingToMenu(false);
    }, 280);
  }

  return (
    <CartProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: 'font-body text-[15px] shadow-lg border border-slate-200/80',
            success: '!border-[#6d28d9]/25',
          },
        }}
      />
      <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${plainBg}`}>
        {backgroundImage !== 'none' && (
          <div
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            aria-hidden
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-[1.08] blur-[6px] sm:blur-[7px]"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          </div>
        )}
        {!isHiring && !isContact && !isEvents && !isSignIn && !isCheckout && (
          <div className="absolute inset-0 z-[1] bg-white/88 backdrop-blur-[2px]" aria-hidden />
        )}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header
            onCartClick={() => setIsCartOpen(true)}
            />
          <main className={`flex-1 pt-[4.25rem] sm:pt-[4.6rem] ${path === '/' ? 'pb-44 md:pb-0' : ''}`}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Hero />
                    <HomeSections />
                  </>
                }
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/hiring" element={<HiringPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/complete" element={<CheckoutCompletePage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route
                path="/menu"
                element={
                  <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-10 space-y-4 sm:space-y-6">
                    <MenuPage onItemAddedToCart={() => {}} />
                  </section>
                }
              />
            </Routes>
          </main>
          <Footer />
          {path === '/' && (
            <MobileBottomBar
              onPromoClick={() => navigate('/sign-in?mode=register&promo=first-order-30')}
            />
          )}
          <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
        {path === '/' && showWelcomeOrderModal && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
              isNavigatingToMenu ? 'bg-black/0 backdrop-blur-none' : 'bg-black/55 backdrop-blur-[1px]'
            }`}
          >
            <div
              className={`relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-8 text-center shadow-2xl transition-all duration-300 ${
                isNavigatingToMenu
                  ? 'translate-y-3 scale-95 opacity-0'
                  : 'translate-y-0 scale-100 opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setIsNavigatingToMenu(false);
                  setShowWelcomeOrderModal(false);
                }}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close popup"
              >
                ×
              </button>
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Now Available: Online Ordering
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Save yourself some time and order directly through our website today!
              </p>
              <button
                type="button"
                onClick={handleOrderNowClick}
                disabled={isNavigatingToMenu}
                className="mt-6 inline-flex items-center justify-center border-b-2 border-primary px-2 pb-1 text-sm font-semibold tracking-wide text-primaryDark hover:text-primary"
              >
                {isNavigatingToMenu ? 'Opening menu...' : 'Order Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </CartProvider>
  );
}

export default App;
