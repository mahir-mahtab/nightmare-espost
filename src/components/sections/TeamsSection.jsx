import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { CyberCard, TeamCard } from '../ui/index.jsx';
import { TEAMS_DATA, INVITED_TEAMS } from '../../data/constants.js';

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

export default TeamsSection;
