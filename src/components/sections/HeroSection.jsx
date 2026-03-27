import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { GlitchText, CyberCard } from '../ui/index.jsx';
import { TOURNAMENT_DATA } from '../../data/constants.js';

const HeroSection = () => (
  <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pt-20">
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

export default HeroSection;
