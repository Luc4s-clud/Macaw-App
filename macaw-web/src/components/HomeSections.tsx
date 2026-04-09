import { Link } from 'react-router-dom';

const acaiText =
  'Native to the Amazon rainforest, açaí berries are small, deep-purple fruits celebrated for their rich, earthy flavor and exceptional nutritional profile. Naturally high in antioxidants — sometimes up to ten times more than blueberries — they offer a powerful, plant-based boost with every bite.';

const pitayaText =
  'Vibrant and nutrient-rich, pitaya – also known as dragon fruit – is a tropical superfruit prized for its bright pink hue and subtly sweet flavor. Packed with fiber, magnesium, and powerful antioxidants, it\'s as nourishing as it is eye-catching, offering a naturally refreshing way to fuel your day.';

function HomeSections() {
  return (
    <>
      {/* Açaí — text left, image right */}
      <section className="bg-amber-50/90 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 4-6 8-10 10-4 2-8 0-10-4s0-8 4-10c4-2 8 0 10 4z' fill='%236d28d9' fill-opacity='1'/%3E%3Cpath d='M50 25c-3 3-7 5-11 4-4-1-7-4-8-8-1-4 1-8 4-11' fill='%236d28d9' fill-opacity='0.6'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              AÇAÍ
            </h2>
            <p className="text-slate-700 text-base md:text-lg leading-relaxed mb-6">
              {acaiText}
            </p>
            <Link
              to="/menu"
              className="text-primary font-semibold underline underline-offset-4 decoration-2 hover:text-primaryDark transition-colors"
            >
              View Menu
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 shadow-inner">
            <img
              src="/pictures/Painel1.avif"
              alt="Açaí berries in a wooden bowl"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Pitaya — image left, text right */}
      <section className="bg-amber-50/90 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 4-6 8-10 10-4 2-8 0-10-4s0-8 4-10c4-2 8 0 10 4z' fill='%236d28d9' fill-opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 shadow-inner order-2 md:order-1">
            <img
              src="/pictures/pitaya.avif"
              alt="Pitaya - dragon fruit"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
              PITAYA
            </h2>
            <p className="text-slate-700 text-base md:text-lg leading-relaxed mb-6">
              {pitayaText}
            </p>
            <Link
              to="/menu"
              className="text-primary font-semibold underline underline-offset-4 decoration-2 hover:text-primaryDark transition-colors"
            >
              Order Online
            </Link>
          </div>
        </div>
      </section>

      {/* Three cards — Our Story, Hiring, Contact Us */}
      <section className="bg-primary py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: 'Our Story', slug: 'our-story', image: '/pictures/about.avif', to: '/about' as const },
              { title: 'Hiring', slug: 'hiring', image: '/pictures/Hiring.jpg', to: '/hiring' as const },
              { title: 'Contact Us', slug: 'contact', image: '/pictures/Contact.jpg', to: '/contact' as const },
            ].map(({ title, slug, image, to }) => {
              const isRoute = to.startsWith('/');
              const content = (
                <div className="aspect-[4/3] relative bg-slate-700 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
                  <div className="absolute inset-0 flex items-end justify-center p-4">
                    <span className="font-display text-xl font-semibold text-white">
                      {title}
                    </span>
                  </div>
                </div>
              );
              return isRoute ? (
                <Link
                  key={slug}
                  to={to}
                  className="group block rounded-lg overflow-hidden border-2 border-amber-400/80 shadow-lg hover:border-amber-300 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={slug}
                  href={to}
                  className="group block rounded-lg overflow-hidden border-2 border-amber-400/80 shadow-lg hover:border-amber-300 transition-colors"
                >
                  {content}
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeSections;
