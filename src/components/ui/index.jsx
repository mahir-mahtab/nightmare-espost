import { Trophy, Shield, ExternalLink } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useState } from 'react';

// Glitch Text Effect
export const GlitchText = ({ children, className = '' }) => (
  <span className={`relative inline-block ${className}`}>
    <span className="relative z-10">{children}</span>
    <span className="absolute top-0 left-0.5 -z-10 text-primary/50 blur-[1px]" aria-hidden="true">{children}</span>
  </span>
);

// Cyber Card with corner accents
export const CyberCard = ({ children, className = '', accent = false, hover = true }) => (
  <div
    className={`
      relative overflow-hidden border bg-zinc-950
      ${accent ? 'border-primary/50' : 'border-white/10'}
      ${hover ? 'transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_-5px_rgba(255,0,0,0.3)]' : ''}
      ${className}
    `}
  >
    <div className="absolute top-0 left-0 h-1 w-8 bg-primary" />
    <div className="absolute top-0 right-0 h-8 w-1 bg-primary" />
    <div className="absolute bottom-0 right-0 h-1 w-8 bg-primary" />
    <div className="absolute bottom-0 left-0 h-8 w-1 bg-primary" />
    {children}
  </div>
);

// Stat Block with icon
export const StatBlock = ({ value, label, icon }) => {
  const IconEl = icon;
  return (
    <div className="group relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent opacity-0 blur transition-opacity group-hover:opacity-100" />
      <div className="relative border border-white/10 bg-black p-5 transition-colors group-hover:border-primary/50">
        <div className="mb-3 flex items-center gap-2">
          <IconEl className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">{label}</span>
        </div>
        <div className="font-display text-3xl font-black text-white">{value}</div>
      </div>
    </div>
  );
};

// Achievement Card with Certificate Image
export const AchievementCard = ({ rank, placement, team, tag, event, date, color, image }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const colorMap = {
    silver: { gradient: 'from-gray-300 to-gray-500', icon: 'text-gray-300', border: 'border-gray-400/50', glow: 'rgba(156,163,175,0.3)' },
    bronze: { gradient: 'from-amber-500 to-amber-700', icon: 'text-amber-500', border: 'border-amber-500/50', glow: 'rgba(245,158,11,0.3)' },
    copper: { gradient: 'from-orange-400 to-orange-600', icon: 'text-orange-400', border: 'border-orange-400/50', glow: 'rgba(251,146,60,0.3)' },
    steel: { gradient: 'from-slate-400 to-slate-600', icon: 'text-slate-400', border: 'border-slate-400/50', glow: 'rgba(148,163,184,0.3)' },
    primary: { gradient: 'from-red-500 to-red-700', icon: 'text-primary', border: 'border-primary/50', glow: 'rgba(255,0,0,0.3)' },
  };
  
  const colors = colorMap[color] || colorMap.steel;

  return (
    <>
      <CyberCard 
        className="group h-full cursor-pointer p-0" 
        accent={color === 'silver'}
      >
        {/* Top gradient bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${colors.gradient}`} />
        
        {/* Certificate Image */}
        {image && (
          <div 
            className="relative overflow-hidden"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img 
                src={image} 
                alt={`${team} certificate`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-2 border border-white/30 bg-black/50 px-4 py-2 backdrop-blur-sm">
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wider uppercase">View Certificate</span>
                </div>
              </div>
            </div>
            {/* Scanline effect */}
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
          </div>
        )}
        
        {/* Content */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${colors.icon}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black tracking-[0.15em] uppercase bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                  {rank}
                </span>
                {placement && (
                  <span className="text-[9px] font-medium text-white/40">{placement}</span>
                )}
              </div>
            </div>
            <span className={`border px-2 py-1 font-display text-xs font-bold text-white/70 ${colors.border}`}>
              {tag}
            </span>
          </div>
          
          <h3 className="font-display text-lg font-black uppercase leading-tight transition-colors group-hover:text-primary">
            {team}
          </h3>
          
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[9px] font-bold tracking-[0.1em] text-white/40 uppercase">{event}</span>
            <span className="text-[9px] text-white/30">{date}</span>
          </div>
        </div>
      </CyberCard>
      
      {/* Full-screen Modal */}
      {isModalOpen && image && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <span className="text-xs tracking-wider uppercase">Close</span>
              <span className="text-xl">&times;</span>
            </button>
            
            {/* Image container */}
            <div className="relative overflow-hidden border-2 border-white/20">
              <img 
                src={image} 
                alt={`${team} certificate`}
                className="max-h-[85vh] w-auto object-contain"
              />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 h-4 w-12 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 h-4 w-12 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 h-4 w-12 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 h-4 w-12 border-b-2 border-r-2 border-primary" />
            </div>
            
            {/* Caption */}
            <div className="mt-4 text-center">
              <h4 className="font-display text-xl font-bold uppercase text-white">{team}</h4>
              <p className={`mt-1 text-sm font-bold uppercase bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                {rank} • {event}
              </p>
            </div>
          </Motion.div>
        </div>
      )}
    </>
  );
};

// Team Card
export const TeamCard = ({ name, role, status, game }) => (
  <CyberCard className="group relative">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="relative p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center border border-primary/30 bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <span className="block text-[10px] font-bold tracking-[0.2em] text-primary uppercase">{role}</span>
          <span className="text-[10px] text-white/40">{game}</span>
        </div>
      </div>
      <h3 className="font-display text-lg font-black uppercase">{name}</h3>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span className="text-[10px] font-bold tracking-[0.15em] text-green-500 uppercase">{status}</span>
      </div>
    </div>
  </CyberCard>
);

// Prize Row
export const PrizeRow = ({ rank, rewards, index }) => (
  <Motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group flex items-center gap-4 border-b border-white/10 py-4 transition-colors hover:border-primary/30"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/50 bg-primary/10 font-display text-sm font-black text-primary">
      {rank.split(' ')[1]}
    </div>
    <div className="flex-1">
      <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">{rank}</span>
      <p className="mt-1 text-sm text-white/80 transition-colors group-hover:text-white">{rewards}</p>
    </div>
  </Motion.div>
);

// Section Header
export const SectionHeader = ({ label, title, highlightedText, align = 'left' }) => (
  <div className={align === 'center' ? 'text-center' : ''}>
    {label && (
      <span className="text-[10px] font-bold tracking-[0.4em] text-primary/80 uppercase">{label}</span>
    )}
    <h2 className="mt-2 font-display text-4xl font-black uppercase sm:text-5xl">
      {title}<span className="text-primary">{highlightedText}</span>
    </h2>
  </div>
);
