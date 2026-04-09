import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { CartProvider } from './context/CartContext';

function App() {
  const location = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    prefetchMenu();
  }, []);

  const path = location.pathname;
  const isAbout = path === '/about';
  const isHiring = path === '/hiring';
  const isContact = path === '/contact';
  const isEvents = path === '/events';
  const isSignIn = path === '/sign-in';
  const backgroundImage = isAbout
    ? '/pictures/about.avif'
    : isHiring || isContact || isEvents || isSignIn
      ? 'none'
      : '/pictures/Painel1.avif';
  const plainBg =
    isHiring || isContact || isEvents || isSignIn ? 'bg-amber-50/95' : '';

  return (
    <CartProvider>
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
        {!isHiring && !isContact && !isEvents && !isSignIn && (
          <div className="absolute inset-0 z-[1] bg-white/88 backdrop-blur-[2px]" aria-hidden />
        )}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header
            onCartClick={() => setIsCartOpen(true)}
            />
          <main className="flex-1">
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
              <Route
                path="/menu"
                element={
                  <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-10 space-y-4 sm:space-y-6">
                    <MenuPage onItemAddedToCart={() => setIsCartOpen(true)} />
                  </section>
                }
              />
            </Routes>
          </main>
          <Footer />
          <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
      </div>
    </CartProvider>
  );
}

export default App;
