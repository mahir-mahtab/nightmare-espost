import { motion as Motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { SOCIAL_LINKS } from '../../data/constants.js';

const StayConnectedSection = () => (
  <section className="relative overflow-hidden px-6 py-24">
    {/* Diagonal Background Pattern */}
    <div className="absolute inset-0 bg-zinc-950" />
    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.01)_10px,rgba(255,255,255,0.01)_20px)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.05),transparent_70%)]" />
    
    <div className="relative mx-auto max-w-5xl">
      {/* Section Header */}
      <div className="mb-16 text-center">
        <Motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block text-[11px] font-bold tracking-[0.4em] text-primary uppercase"
        >
          Connect With Us
        </Motion.span>
        <Motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 font-display text-4xl font-black uppercase sm:text-5xl"
        >
          Stay <span className="text-primary">Connected</span>
        </Motion.h2>
        {/* Decorative line */}
        <div className="mx-auto mt-6 flex items-center justify-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="h-1 w-16 bg-primary" />
        </div>
      </div>

      {/* Social Cards Grid */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {SOCIAL_LINKS.map((social, index) => {
          const IconComponent = social.icon;
          return (
            <Motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`group relative flex flex-col items-center justify-center border-2 border-white/10 bg-black/50 p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_-5px] ${social.color}`}
            >
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary/40 transition-all group-hover:h-6 group-hover:w-6 group-hover:border-current" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/40 transition-all group-hover:h-6 group-hover:w-6 group-hover:border-current" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary/40 transition-all group-hover:h-6 group-hover:w-6 group-hover:border-current" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-primary/40 transition-all group-hover:h-6 group-hover:w-6 group-hover:border-current" />
              
              {/* Icon */}
              <div className="mb-5 flex h-16 w-16 items-center justify-center text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:text-current">
                <IconComponent className="h-10 w-10" strokeWidth={1.5} />
              </div>
              
              {/* Name */}
              <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/80 transition-colors group-hover:text-current">
                {social.name}
              </span>
              
              {/* External Link Indicator */}
              <ExternalLink className="absolute top-3 right-3 h-3 w-3 text-white/20 opacity-0 transition-all group-hover:opacity-100 group-hover:text-current" />
              
              {/* Bottom Accent */}
              <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-current transition-all duration-300 group-hover:w-1/2" />
            </Motion.a>
          );
        })}
      </div>
    </div>
  </section>
);

export default StayConnectedSection;
