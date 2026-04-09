import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative min-h-[380px] md:min-h-[480px] flex flex-col items-center justify-center overflow-hidden">
      <img
        src="/pictures/Painel1.avif"
        alt="Açaí bowls - Macaw Acaiteria"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-w-6xl mx-auto px-4 py-16 text-center flex-1 flex flex-col justify-center">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 uppercase tracking-tight">
          Authentic. Fresh. Naturally Delicious.
        </h1>
        <div className="flex flex-col items-center gap-4">
          <Link
            to="/menu"
            className="text-white font-medium text-lg border-b-2 border-white pb-1 hover:opacity-90 transition-opacity"
          >
            Order Online
          </Link>
        </div>
      </div>
      <div className="relative flex justify-center pb-6">
        <ChevronDown className="w-8 h-8 text-white/90" aria-hidden />
      </div>
    </section>
  );
}

export default Hero;
