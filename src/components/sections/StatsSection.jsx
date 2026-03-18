import { Users, Target, Trophy, Shield } from 'lucide-react';
import { StatBlock } from '../ui/index.jsx';
import { TOURNAMENT_DATA, TEAMS_DATA, ACHIEVEMENTS_DATA } from '../../data/constants.js';

const StatsSection = () => (
  <section className="border-y border-white/10 bg-black px-6 py-16">
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBlock value={TOURNAMENT_DATA.registrations} label="Teams Registered" icon={Users} />
        <StatBlock value={TOURNAMENT_DATA.slots} label="Tournament Slots" icon={Target} />
        <StatBlock value={ACHIEVEMENTS_DATA.length} label="Tournament Wins" icon={Trophy} />
        <StatBlock value={TEAMS_DATA.length} label="Active Rosters" icon={Shield} />
      </div>
    </div>
  </section>
);

export default StatsSection;
