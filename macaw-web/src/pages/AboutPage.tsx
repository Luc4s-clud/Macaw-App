const aboutText =
  "Macaw Açaíteria was born from a passion for authenticity and community. We bring the vibrant flavors of Brazil to your neighborhood - using only real, natural ingredients and traditional recipes. Whether you're craving a refreshing smoothie or a perfectly layered açaí bowl, every item is made fresh to order with love. Our space is designed to feel like home: warm, welcoming, and full of good vibes. Come in and taste the difference - the real taste of Brazilian açaí.";

function AboutPage() {
  return (
    <>
      {/* Hero — about.avif with "About" title */}
      <section className="relative min-h-[320px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src="/pictures/about.avif"
          alt="Macaw Açaíteria - About"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <h1 className="relative font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight">
          About
        </h1>
      </section>

      {/* Beige section — Macaw Açaíteria + text */}
      <section className="bg-amber-50/95 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 Q40 5 60 20 Q75 40 60 60 Q40 75 20 60 Q5 40 20 10z' fill='%236d28d9' fill-opacity='0.5'/%3E%3Cpath d='M40 15 L45 35 L65 40 L45 45 L40 65 L35 45 L15 40 L35 35 Z' fill='%236d28d9' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 py-14 md:py-20 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-6">
            Macaw Açaíteria
          </h2>
          <p className="text-slate-700 text-base md:text-lg leading-relaxed">
            {aboutText}
          </p>
        </div>
      </section>

      {/* Gallery — About2.avif + about3.avif */}
      <section className="bg-slate-100 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-lg overflow-hidden shadow-lg bg-white">
              <img
                src="/pictures/About2.avif"
                alt="Açaí bowls - Macaw Açaíteria"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg bg-white">
              <img
                src="/pictures/about3.avif"
                alt="Açaí bowls - Macaw Açaíteria"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutPage;
