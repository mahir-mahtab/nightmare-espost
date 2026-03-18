import { motion as Motion } from 'framer-motion';
import { Shield, Target } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { TEAMS_DATA } from '../data/constants.js';

const TeamsPage = () => (
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

export default TeamsPage;
