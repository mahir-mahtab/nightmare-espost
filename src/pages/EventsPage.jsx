import { motion as Motion } from 'framer-motion';
import { Calendar, Users, Target, Zap, Trophy } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard, StatBlock } from '../components/ui/index.jsx';
import { TOURNAMENT_DATA, INVITED_TEAMS, ACHIEVEMENTS_DATA } from '../data/constants.js';

const EventsPage = () => (
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
                <StatBlock value={ACHIEVEMENTS_DATA.length} label="Podium Finishes" icon={Trophy} />
              </div>
            </div>
          </div>
        </CyberCard>

        <div className="mt-12">
          <h2 className="mb-6 font-display text-2xl font-black uppercase">
            Participating <span className="text-primary">Teams</span>
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

export default EventsPage;
