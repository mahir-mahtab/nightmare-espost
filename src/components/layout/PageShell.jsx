import { motion as Motion } from 'framer-motion';
import { Navbar, Footer } from './index.jsx';

const PageShell = ({
  children,
  subtitle,
  accent,
  subHeader,
  showNavbar = true,
  showFooter = true,
  hideIntro = false,
}) => (
  <div className="min-h-screen bg-black text-white">
    {showNavbar && <Navbar />}
    <main className={showNavbar ? 'pt-20 md:pt-22' : ''}>
      {subHeader}
      {!hideIntro && (
        <section className="relative overflow-hidden px-4 pb-8 pt-4 sm:px-5 md:pt-10 lg:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.1),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl">
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {accent && (
                <span className="mb-3 inline-block text-[10px] font-bold tracking-[0.4em] text-primary uppercase">
                  {accent}
                </span>
              )}
              {subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">{subtitle}</p>}
            </Motion.div>
          </div>
        </section>
      )}
      {children}
    </main>
    {showFooter && <Footer />}
  </div>
);

export default PageShell;
