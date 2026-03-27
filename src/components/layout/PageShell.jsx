import { motion as Motion } from 'framer-motion';
import { Navbar, Footer, FeaturedEventBanner } from './index.jsx';
import { GlitchText } from '../ui/index.jsx';

const PageShell = ({ children, title, subtitle, accent, subHeader }) => (
  <div className="min-h-screen bg-black text-white">
    <Navbar />
    <main className="pt-24">
      {subHeader}
      <section className="relative overflow-hidden px-6 pb-12 pt-12 md:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {accent && (
              <span className="mb-3 inline-block text-[10px] font-bold tracking-[0.4em] text-primary uppercase">
                {accent}
              </span>
            )}
            <h1 className="font-display text-5xl font-black uppercase sm:text-6xl lg:text-7xl">
              <GlitchText>{title}</GlitchText>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60">{subtitle}</p>
          </Motion.div>
        </div>
      </section>
      {children}
    </main>
    <Footer />
  </div>
);

export default PageShell;
