import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Calendar, ChevronRight, Menu, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { name: 'HOME', path: '/' },
  { name: 'ABOUT', path: '/about' },
  { name: 'TEAMS', path: '/teams' },
  { name: 'ACHIEVEMENTS', path: '/achievements' },
  { name: 'EVENTS', path: '/events' },
];

const EventTicker = () => {
  return (
    <div className="border-b border-primary/25 bg-black pt-24">
      <div className="overflow-hidden">
        <div className="flex w-max animate-marquee">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-8 py-3 text-[10px] font-bold tracking-[0.28em] text-white/80 uppercase"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary">NMXERD T1 Elite League</span>
              <span>36 Slots</span>
              <span>Registration: June 2</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
        scrolled ? 'border-b border-white/10 bg-black/90 backdrop-blur-xl' : 'bg-black/65'
      }`}
    >
      <nav className="mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/image.png"
            alt="Nightmare Esports logo"
            className="h-9 w-9 rounded object-cover ring-1 ring-white/20"
          />
          <div className="leading-none">
            <div className="font-display text-sm font-black tracking-[0.14em] text-primary">NIGHTMARE</div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-white/70">ESPORTS</div>
          </div>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `text-xs font-bold tracking-[0.18em] uppercase transition-colors ${
                  isActive ? 'text-primary' : 'text-white/90 hover:text-primary'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/20 text-white transition hover:border-primary hover:text-primary"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <div className="border-t border-white/10 bg-black/95 px-5 pb-6 pt-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `rounded border px-4 py-3 text-xs font-bold tracking-[0.2em] uppercase ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/15 text-white/90 hover:border-primary/60 hover:text-primary'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

const LandingPage = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <EventTicker />

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,0,0,0.22),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:54px_54px]" />

          <div className="relative mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <p className="text-[11px] font-bold tracking-[0.45em] text-primary uppercase">We are powering esports networks</p>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
                Nightmare
                <br />
                <span className="text-primary">Esports</span>
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/70 md:text-base">
                Professional esports organization based in Bangladesh, operating tournaments, team operations,
                and talent development for PUBG Mobile and expanding titles.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-black tracking-[0.2em] text-black uppercase transition hover:bg-white"
                >
                  Explore Events
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-xs font-black tracking-[0.2em] uppercase transition hover:border-primary hover:text-primary"
                >
                  About Org
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 hidden h-20 w-20 bg-primary md:block" />
              <div className="absolute -right-8 top-14 hidden h-16 w-28 border-4 border-primary md:block" />
              <div className="overflow-hidden border border-white/20 bg-zinc-950 p-3 shadow-[0_0_0_1px_rgba(255,0,0,0.2)]">
                <img
                  src="https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2084&auto=format&fit=crop"
                  alt="Nightmare Esports showcase"
                  className="h-[420px] w-full object-cover brightness-75"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-950 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-black uppercase sm:text-5xl">
                Achieve<span className="text-primary">ments</span>
              </h2>
              <Link to="/achievements" className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                Full Records
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="border border-white/10 bg-black p-6 transition hover:border-primary/70">
                <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">NMxERD T1 Elite League</p>
                <h3 className="font-display text-2xl font-black uppercase">Quadratic Esports</h3>
                <p className="mt-2 text-sm text-primary">1st Runners Up</p>
              </article>
              <article className="border border-white/10 bg-black p-6 transition hover:border-primary/70">
                <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">NMxERD T1 Elite League</p>
                <h3 className="font-display text-2xl font-black uppercase">Before The Storm</h3>
                <p className="mt-2 text-sm text-primary">2nd Runners Up</p>
              </article>
              <article className="border border-white/10 bg-black p-6 transition hover:border-primary/70">
                <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Internal Rosters</p>
                <h3 className="font-display text-2xl font-black uppercase">Nightmare Official</h3>
                <p className="mt-2 text-sm text-primary">Invited Pro Team</p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <article className="border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8">
              <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Event Spotlight</p>
              <h3 className="mt-3 font-display text-3xl font-black uppercase">NMXERD T1 Elite League Season 3</h3>
              <p className="mt-4 text-sm leading-7 text-white/70">
                50 teams registered for 36 slots, featuring strong T2 and T3 competition with collaboration from ERD.
                Average lobby range: 64-74 players.
              </p>
              <Link to="/events" className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                View Event Details <ChevronRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="border border-white/10 bg-zinc-950 p-8">
              <p className="text-[10px] font-bold tracking-[0.24em] text-white/50 uppercase">Teams</p>
              <h3 className="mt-3 font-display text-3xl font-black uppercase">Active PUBG Mobile Rosters</h3>
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                <li className="flex justify-between border-b border-white/10 pb-3">
                  <span>Nightmare Esports</span>
                  <span className="text-primary">1st Line-up</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-3">
                  <span>Nightmare Official</span>
                  <span className="text-primary">2nd Line-up</span>
                </li>
              </ul>
              <Link to="/teams" className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                See Full Team Page <ChevronRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-display text-xl font-black uppercase tracking-[0.12em]">
            Nightmare <span className="text-primary">Esports</span>
          </div>
          <p className="text-[11px] tracking-[0.15em] text-white/45 uppercase">
            Built for competitive dominance.
          </p>
        </div>
      </footer>
    </div>
  );
};

const PageShell = ({ title, subtitle }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <EventTicker />
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
        <h1 className="font-display text-5xl font-black uppercase sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">{subtitle}</p>
      </section>
    </div>
  );
};

const TeamsView = () => (
  <PageShell
    title="Teams"
    subtitle="Current competitive squads: Nightmare Esports 1st line-up and Nightmare Official 2nd line-up for PUBG Mobile operations."
  />
);

const AchievementsView = () => (
  <PageShell
    title="Achievements"
    subtitle="Tournament recognition includes NMxERD T1 Elite League podium records with top placements and league advancement milestones."
  />
);

const EventsView = () => (
  <PageShell
    title="Events"
    subtitle="NMxERD T1 Elite League featured 50 registrations for 36 slots and maintained consistent lobby quality through ERD collaboration."
  />
);

const AboutView = () => (
  <PageShell
    title="About"
    subtitle="Nightmare Esports is a professional Bangladesh-based organization focused on tournaments, team operations, and talent growth."
  />
);

export default LandingPage;
export { TeamsView, AchievementsView, EventsView, AboutView };
