import { Users, Target, Trophy, Shield } from 'lucide-react';
import { StatBlock } from '../ui/index.jsx';
import { TOURNAMENT_DATA, TEAMS_DATA, ACHIEVEMENTS_DATA } from '../../data/constants.js';

/**
 * TODO: API Integration
 * Replace hardcoded data with aggregated stats API:
 * - GET /api/public/stats - Fetch dashboard statistics
 * 
 * Expected response:
 * {
 *   teamsRegistered: number,    // from TOURNAMENT_DATA.registrations
 *   tournamentSlots: number,    // from TOURNAMENT_DATA.slots
 *   tournamentWins: number,     // from ACHIEVEMENTS_DATA.length
 *   activeRosters: number       // from TEAMS_DATA.length
 * }
 * 
 * Implementation:
 * 1. Add useState for stats object
 * 2. Fetch on mount or receive via props from LandingPage
 * 3. Use database view: dashboard_stats (already defined in schema)
 * 
 * Note: Consider server-side caching for frequently accessed stats
 */

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
