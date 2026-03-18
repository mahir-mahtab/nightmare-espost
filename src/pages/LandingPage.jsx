import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Calendar, ChevronRight, Menu, X, Trophy, Users, Zap, Target, Shield, Award, Star, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

// ============================================
// DATA - Sourced from /info files
// ============================================

const NAV_LINKS = [
  { name: 'HOME', path: '/' },
  { name: 'ABOUT', path: '/about' },
  { name: 'TEAMS', path: '/teams' },
  { name: 'ACHIEVEMENTS', path: '/achievements' },
  { name: 'EVENTS', path: '/events' },
];

const TOURNAMENT_DATA = {
  name: 'NMxERD T1 Elite League',
  season: 'Season 3',
  slots: 36,
  registrations: 50,
  registrationDate: 'June 2nd',
  avgLobbySize: '64-74 players',
  partners: ['Krafton', 'Tencent Games', 'Lightspeed & Quantum', 'United Nations Community'],
};

const ACHIEVEMENTS_DATA = [
  {
    rank: '1ST RUNNERS UP',
    team: 'Quadratic Esports',
    tag: 'Q4',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'silver',
  },
  {
    rank: '2ND RUNNERS UP',
    team: 'Before The Storm',
    tag: 'B4S',
    event: 'NMxERD T1 Elite League',
    date: '17/06/2025',
    color: 'bronze',
  },
  {
    rank: 'INVITED PRO',
    team: 'Nightmare Official',
    tag: 'NM',
    event: 'T1 Elite League',
    date: '2025',
    color: 'primary',
  },
];

const TEAMS_DATA = [
  { name: 'Nightmare Esports', role: '1st Line-up', status: 'Active', game: 'PUBG Mobile' },
  { name: 'Nightmare Official', role: '2nd Line-up', status: 'Active', game: 'PUBG Mobile' },
];

const INVITED_TEAMS = [
  'DS Demolition Crew',
  'ERD Raven Claw',
  'Badrage Esports',
  'Nightmare Official',
  'ERD Zeroday',
  'T4esOutrage',
  'SF71 Esports',
];

const PRIZE_STRUCTURE = [
  { rank: 'Top 2', rewards: 'Slot in 2K Tournament Semi-Finals + Season 4 Finals' },
  { rank: 'Top 3', rewards: 'Slot in 2K Qualifier Finals' },
  { rank: 'Top 5', rewards: 'Certificates, Banners + Season 4 Quarter Finals' },
];

const ORG_INFO = {
  location: 'Bangladesh',
  focus: 'PUBG Mobile',
  services: ['Tournament Operations', 'Team Management', 'Talent Development'],
  expansion: 'Multiple game titles planned',
  partnerships: 'Open for sponsorships and strategic partnerships',
};

// ============================================
// REUSABLE CARD COMPONENTS
// ============================================

const GlitchText = ({ children, className = '' }) => (
  <span className={`relative inline-block ${className}`}>
    <span className="relative z-10">{children}</span>
    <span className="absolute top-0 left-0.5 -z-10 text-primary/50 blur-[1px]" aria-hidden="true">{children}</span>
  </span>
);

const CyberCard = ({ children, className = '', accent = false, hover = true }) => (
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

const StatBlock = ({ value, label, icon }) => {
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

const AchievementCard = ({ rank, team, tag, event, date, color }) => {
  const colorMap = {
    silver: 'from-gray-400 to-gray-600',
    bronze: 'from-amber-600 to-amber-800',
    primary: 'from-red-500 to-red-700',
  };

  return (
    <CyberCard className="group p-0" accent={color === 'primary'}>
      <div className={`h-1.5 w-full bg-gradient-to-r ${colorMap[color]}`} />
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${colorMap[color]} bg-clip-text`}>
            <Trophy className={`h-5 w-5 ${color === 'primary' ? 'text-primary' : color === 'silver' ? 'text-gray-400' : 'text-amber-600'}`} />
            <span className="text-[10px] font-black tracking-[0.2em] text-transparent uppercase">{rank}</span>
          </div>
          <span className="border border-white/20 px-2 py-1 font-display text-xs font-bold text-white/60">{tag}</span>
        </div>
        <h3 className="font-display text-xl font-black uppercase leading-tight transition-colors group-hover:text-primary">{team}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase">{event}</span>
          <span className="text-[10px] text-white/30">{date}</span>
        </div>
      </div>
    </CyberCard>
  );
};

const TeamCard = ({ name, role, status, game }) => (
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

const PrizeRow = ({ rank, rewards, index }) => (
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
    <ChevronRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-primary" />
  </Motion.div>
);

// ============================================
// LAYOUT COMPONENTS
// ============================================

const EventTicker = () => (
  <div className="border-b border-primary/25 bg-black pt-24">
    <div className="overflow-hidden">
      <div className="flex w-max animate-marquee">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 px-8 py-3 text-[10px] font-bold tracking-[0.25em] text-white/80 uppercase"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary">{TOURNAMENT_DATA.name}</span>
            <span className="text-white/40">|</span>
            <span>{TOURNAMENT_DATA.slots} Slots</span>
            <span className="text-white/40">|</span>
            <span>Registration: {TOURNAMENT_DATA.registrationDate}</span>
            <span className="text-white/40">|</span>
            <span className="text-primary">{TOURNAMENT_DATA.season}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
          className="inline-flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
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

const Footer = () => (
  <footer className="border-t border-white/10 bg-black">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-3">
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
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
        <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">
          Built for competitive dominance
        </p>
        <p className="text-[10px] text-white/30">
          © 2025 Nightmare Esports. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// ============================================
// LANDING PAGE SECTIONS
// ============================================

const HeroSection = () => (
  <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,0,0,0.15),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,0,0,0.08),transparent_50%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
    
    {/* Floating Accent Shapes */}
    <div className="absolute right-[10%] top-32 hidden h-32 w-32 border-4 border-primary/20 lg:block" />
    <div className="absolute left-[5%] bottom-20 hidden h-20 w-20 bg-primary/10 lg:block" />

    <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="inline-flex items-center gap-3 border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-[10px] font-bold tracking-[0.4em] text-primary uppercase">
            Powering Esports Networks
          </span>
        </div>

        <h1 className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          <GlitchText>Nightmare</GlitchText>
          <br />
          <span className="text-primary">Esports</span>
        </h1>

        <p className="max-w-lg text-base leading-relaxed text-white/60">
          Professional esports organization based in <span className="text-white">Bangladesh</span>, 
          operating tournaments, team operations, and talent development for 
          <span className="text-primary"> PUBG Mobile</span> and expanding titles.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/events"
            className="group inline-flex items-center gap-3 bg-primary px-7 py-4 text-[11px] font-black tracking-[0.2em] text-black uppercase transition-all hover:bg-white"
          >
            Explore Events
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 border border-white/20 px-7 py-4 text-[11px] font-black tracking-[0.2em] uppercase transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            About Organization
          </Link>
        </div>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-primary/10 blur-3xl" />
        <CyberCard className="relative" hover={false}>
          <div className="p-2">
            <img
              src="https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2084&auto=format&fit=crop"
              alt="Nightmare Esports showcase"
              className="h-[400px] w-full object-cover brightness-75 grayscale-[20%] lg:h-[450px]"
            />
          </div>
          {/* Overlay Stats */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-white/10 bg-black/80 p-3 backdrop-blur">
                <div className="font-display text-xl font-black text-primary">{TOURNAMENT_DATA.slots}</div>
                <div className="text-[9px] font-bold tracking-[0.15em] text-white/50 uppercase">Slots</div>
              </div>
              <div className="border border-white/10 bg-black/80 p-3 backdrop-blur">
                <div className="font-display text-xl font-black text-primary">{TOURNAMENT_DATA.registrations}</div>
                <div className="text-[9px] font-bold tracking-[0.15em] text-white/50 uppercase">Teams</div>
              </div>
              <div className="border border-white/10 bg-black/80 p-3 backdrop-blur">
                <div className="font-display text-xl font-black text-primary">S3</div>
                <div className="text-[9px] font-bold tracking-[0.15em] text-white/50 uppercase">Season</div>
              </div>
            </div>
          </div>
        </CyberCard>
      </Motion.div>
    </div>
  </section>
);

const StatsSection = () => (
  <section className="border-y border-white/10 bg-black px-6 py-16">
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBlock value={TOURNAMENT_DATA.registrations} label="Teams Registered" icon={Users} />
        <StatBlock value={TOURNAMENT_DATA.slots} label="Tournament Slots" icon={Target} />
        <StatBlock value="7" label="Invited Pros" icon={Star} />
        <StatBlock value={TEAMS_DATA.length} label="Active Rosters" icon={Shield} />
      </div>
    </div>
  </section>
);

const AchievementsSection = () => (
  <section className="bg-zinc-950 px-6 py-20">
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-primary/80 uppercase">Recognition</span>
          <h2 className="mt-2 font-display text-4xl font-black uppercase sm:text-5xl">
            Achieve<span className="text-primary">ments</span>
          </h2>
        </div>
        <Link
          to="/achievements"
          className="group inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-white/60 uppercase transition-colors hover:text-primary"
        >
          Full Records
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {ACHIEVEMENTS_DATA.map((achievement, i) => (
          <Motion.div
            key={achievement.team}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <AchievementCard {...achievement} />
          </Motion.div>
        ))}
      </div>
    </div>
  </section>
);

const EventSpotlightSection = () => (
  <section className="px-6 py-20">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Main Event Card */}
        <div className="lg:col-span-3">
          <CyberCard className="h-full" accent>
            <div className="relative h-full p-8">
              <div className="absolute right-8 top-8 font-display text-[80px] font-black leading-none text-primary/10">
                S3
              </div>
              <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Event Spotlight</span>
                </div>
                
                <h3 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
                  {TOURNAMENT_DATA.name}
                  <span className="block text-primary">{TOURNAMENT_DATA.season}</span>
                </h3>

                <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60">
                  {TOURNAMENT_DATA.registrations} teams registered for {TOURNAMENT_DATA.slots} slots, 
                  featuring strong T2 and T3 competition with collaboration from ERD. 
                  Average lobby range: {TOURNAMENT_DATA.avgLobbySize}.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {TOURNAMENT_DATA.partners.slice(0, 3).map((partner) => (
                    <span
                      key={partner}
                      className="border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-white/60"
                    >
                      {partner}
                    </span>
                  ))}
                </div>

                <Link
                  to="/events"
                  className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase transition-colors hover:text-white"
                >
                  View Event Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* Prize Structure */}
        <div className="lg:col-span-2">
          <CyberCard className="h-full">
            <div className="p-8">
              <div className="mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Prize Structure</span>
              </div>
              <div className="space-y-0">
                {PRIZE_STRUCTURE.map((prize, i) => (
                  <PrizeRow key={prize.rank} {...prize} index={i} />
                ))}
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  </section>
);

const TeamsSection = () => (
  <section className="border-t border-white/10 bg-zinc-950 px-6 py-20">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Active Rosters */}
        <div>
          <div className="mb-8">
            <span className="text-[10px] font-bold tracking-[0.4em] text-primary/80 uppercase">Rosters</span>
            <h2 className="mt-2 font-display text-3xl font-black uppercase sm:text-4xl">
              Active <span className="text-primary">Teams</span>
            </h2>
          </div>
          <div className="space-y-4">
            {TEAMS_DATA.map((team, i) => (
              <Motion.div
                key={team.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <TeamCard {...team} />
              </Motion.div>
            ))}
          </div>
          <Link
            to="/teams"
            className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase"
          >
            View Full Roster
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Invited Teams */}
        <div>
          <div className="mb-8">
            <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">T1 Elite League</span>
            <h2 className="mt-2 font-display text-3xl font-black uppercase sm:text-4xl">
              Invited <span className="text-primary">Pros</span>
            </h2>
          </div>
          <CyberCard>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {INVITED_TEAMS.map((team, i) => (
                  <Motion.div
                    key={team}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-3 border-b border-white/5 py-3 ${
                      team === 'Nightmare Official' ? 'text-primary' : 'text-white/70'
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center border border-current text-[10px] font-bold opacity-50">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{team}</span>
                  </Motion.div>
                ))}
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  </section>
);

// ============================================
// MAIN LANDING PAGE
// ============================================

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    <Navbar />
    <EventTicker />
    <main>
      <HeroSection />
      <StatsSection />
      <AchievementsSection />
      <EventSpotlightSection />
      <TeamsSection />
    </main>
    <Footer />
  </div>
);

// ============================================
// PAGE VIEWS (For Routes)
// ============================================

const PageShell = ({ children, title, subtitle, accent }) => (
  <div className="min-h-screen bg-black text-white">
    <Navbar />
    <EventTicker />
    <main>
      <section className="relative overflow-hidden px-6 pb-12 pt-16 md:pt-20">
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

const TeamsView = () => (
  <PageShell
    title="Teams"
    subtitle="Our competitive squads competing at the highest level in PUBG Mobile tournaments across Bangladesh and beyond."
    accent="Active Rosters"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2">
          {TEAMS_DATA.map((team, i) => (
            <Motion.div
              key={team.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CyberCard className="h-full" accent={i === 0}>
                <div className="p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center border border-primary/30 bg-primary/10">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      <span className="text-[10px] font-bold tracking-[0.15em] text-green-500 uppercase">{team.status}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">{team.role}</span>
                  <h3 className="mt-2 font-display text-2xl font-black uppercase">{team.name}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5">
                    <Target className="h-3.5 w-3.5 text-white/50" />
                    <span className="text-xs text-white/60">{team.game}</span>
                  </div>
                </div>
              </CyberCard>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  </PageShell>
);

const AchievementsView = () => (
  <PageShell
    title="Achievements"
    subtitle="Tournament recognition and podium records from the NMxERD T1 Elite League and competitive events."
    accent="Hall of Fame"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          {ACHIEVEMENTS_DATA.map((achievement, i) => (
            <Motion.div
              key={achievement.team}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AchievementCard {...achievement} />
            </Motion.div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="mb-8 font-display text-2xl font-black uppercase">
            Prize <span className="text-primary">Structure</span>
          </h2>
          <CyberCard>
            <div className="p-8">
              {PRIZE_STRUCTURE.map((prize, i) => (
                <PrizeRow key={prize.rank} {...prize} index={i} />
              ))}
            </div>
          </CyberCard>
        </div>
      </div>
    </section>
  </PageShell>
);

const EventsView = () => (
  <PageShell
    title="Events"
    subtitle={`${TOURNAMENT_DATA.name} featured ${TOURNAMENT_DATA.registrations} registrations for ${TOURNAMENT_DATA.slots} slots with consistent lobby quality through ERD collaboration.`}
    accent="Tournament Calendar"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <CyberCard accent>
          <div className="p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Featured Event</span>
                </div>
                <h3 className="font-display text-3xl font-black uppercase">
                  {TOURNAMENT_DATA.name}
                  <span className="block text-primary">{TOURNAMENT_DATA.season}</span>
                </h3>
                <p className="mt-6 text-sm leading-relaxed text-white/60">
                  A highly competitive PUBG Mobile event featuring a limited number of slots and a clear path 
                  to future seasons. The event attracted a wide range of teams from T3 and T2 categories, 
                  creating an exciting environment for new teams to showcase their skills.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {TOURNAMENT_DATA.partners.map((partner) => (
                    <span
                      key={partner}
                      className="border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-white/60"
                    >
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatBlock value={TOURNAMENT_DATA.registrations} label="Registrations" icon={Users} />
                <StatBlock value={TOURNAMENT_DATA.slots} label="Slots" icon={Target} />
                <StatBlock value="64-74" label="Avg Lobby" icon={Zap} />
                <StatBlock value="7" label="Invited Pros" icon={Star} />
              </div>
            </div>
          </div>
        </CyberCard>

        <div className="mt-12">
          <h2 className="mb-6 font-display text-2xl font-black uppercase">
            Invited <span className="text-primary">Teams</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INVITED_TEAMS.map((team, i) => (
              <Motion.div
                key={team}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 border p-4 transition-colors ${
                  team === 'Nightmare Official'
                    ? 'border-primary/50 bg-primary/5 text-primary'
                    : 'border-white/10 text-white/70 hover:border-white/20'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center border border-current font-display text-sm font-bold opacity-60">
                  {i + 1}
                </span>
                <span className="font-medium">{team}</span>
              </Motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </PageShell>
);

const AboutView = () => (
  <PageShell
    title="About"
    subtitle={`Professional esports organization based in ${ORG_INFO.location}. ${ORG_INFO.partnerships}.`}
    accent="Who We Are"
  >
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3">
          <CyberCard accent>
            <div className="p-8">
              <Target className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Our Focus</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Currently focused on <span className="text-primary">{ORG_INFO.focus}</span> with {ORG_INFO.expansion}.
              </p>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="p-8">
              <Zap className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Services</h3>
              <ul className="mt-4 space-y-2">
                {ORG_INFO.services.map((service) => (
                  <li key={service} className="flex items-center gap-2 text-sm text-white/60">
                    <ChevronRight className="h-3 w-3 text-primary" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </CyberCard>

          <CyberCard>
            <div className="p-8">
              <Users className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-display text-xl font-black uppercase">Partnerships</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {ORG_INFO.partnerships}. Contact us for sponsorship opportunities and collaborations.
              </p>
            </div>
          </CyberCard>
        </div>
      </div>
    </section>
  </PageShell>
);

export default LandingPage;
export { TeamsView, AchievementsView, EventsView, AboutView };
