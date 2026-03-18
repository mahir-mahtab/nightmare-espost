import { Link } from 'react-router-dom';
import { Calendar, Award, ArrowRight } from 'lucide-react';
import { CyberCard, PrizeRow } from '../ui/index.jsx';
import { TOURNAMENT_DATA, PRIZE_STRUCTURE } from '../../data/constants.js';

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

export default EventSpotlightSection;
