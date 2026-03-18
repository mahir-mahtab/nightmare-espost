import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { NAV_LINKS } from '../../data/constants.js';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'border-b border-white/10 bg-black/95 backdrop-blur-xl' : 'bg-black/60'
      }`}
    >
      <nav className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/20 opacity-0 blur transition-opacity group-hover:opacity-100" />
            <img
              src="/image.png"
              alt="Nightmare Esports logo"
              className="relative h-10 w-10 rounded object-cover ring-2 ring-primary/30 transition-all group-hover:ring-primary"
            />
          </div>
          <div className="leading-none">
            <div className="font-display text-sm font-black tracking-[0.12em] text-primary">NIGHTMARE</div>
            <div className="text-[9px] font-bold tracking-[0.25em] text-white/60">ESPORTS</div>
          </div>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  isActive ? 'text-primary' : 'text-white/80 hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {isActive && <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-all hover:border-primary hover:bg-primary/10 hover:text-primary lg:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/98 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6">
              {NAV_LINKS.map((link, i) => (
                <Motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between border px-4 py-3.5 text-xs font-bold tracking-[0.2em] uppercase transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/10 text-white/80 hover:border-primary/50 hover:text-primary'
                      }`
                    }
                  >
                    {link.name}
                    <ChevronRight className="h-4 w-4" />
                  </NavLink>
                </Motion.div>
              ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
