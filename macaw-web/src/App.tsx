import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import HomeSections from './components/HomeSections';
import CategoryTabs from './components/CategoryTabs';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import HiringPage from './pages/HiringPage';
import ContactPage from './pages/ContactPage';
import EventsPage from './pages/EventsPage';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import PromoBar from './components/PromoBar';
import { CartProvider } from './context/CartContext';

function App() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] =
    useState<string>('build-your-own');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const path = location.pathname;
  const isAbout = path === '/about';
  const isHiring = path === '/hiring';
  const isContact = path === '/contact';
  const isEvents = path === '/events';
  const backgroundImage = isAbout
    ? '/pictures/about.avif'
    : isHiring || isContact || isEvents
      ? 'none'
      : '/pictures/Painel1.avif';
  const plainBg = isHiring || isContact || isEvents ? 'bg-amber-50/95' : '';

  return (
    <CartProvider>
      <div
        className={`min-h-screen flex flex-col relative ${plainBg}`}
        style={
          backgroundImage !== 'none'
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }
            : undefined
        }
      >
        {!isHiring && !isContact && !isEvents && (
          <div className="absolute inset-0 bg-white/88 backdrop-blur-[1px]" aria-hidden />
        )}
        <div className="relative flex flex-col min-h-screen">
          <PromoBar />
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
              <Route
                path="/menu"
                element={
                  <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
                    <CategoryTabs
                      selected={selectedCategory}
                      onChange={setSelectedCategory}
                    />
                    <MenuPage
                      category={selectedCategory}
                      onItemAddedToCart={() => setIsCartOpen(true)}
                      onSelectCategory={setSelectedCategory}
                    />
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
