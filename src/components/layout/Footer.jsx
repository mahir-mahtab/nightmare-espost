import { Link } from 'react-router-dom';
import { Facebook, Send } from 'lucide-react';
import { GlitchText } from '../ui/index.jsx';
import { NAV_LINKS, ORG_INFO } from '../../data/constants.js';

const Footer = () => (
  <footer className="border-t border-white/10 bg-black">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl font-black uppercase tracking-[0.08em]">
            <GlitchText>Nightmare</GlitchText> <span className="text-primary">Esports</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Professional esports organization based in {ORG_INFO.location}. {ORG_INFO.partnerships}.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">Quick Links</h4>
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm text-white/60 transition-colors hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">Services</h4>
          <div className="flex flex-col gap-2">
            {ORG_INFO.services.map((service) => (
              <span key={service} className="text-sm text-white/60">{service}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">Follow Us</h4>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.facebook.com/share/1AUaWNekdw/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-primary"
            >
              <Facebook size={16} />
              Facebook
            </a>
            <a
              href="https://discord.gg/RyqtEcSFn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-primary"
            >
              <Send size={16} />
              Discord
            </a>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
        <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">
          Built for competitive dominance
        </p>
        <p className="text-[10px] text-white/30">
          © 2026 Nightmare Esports. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
