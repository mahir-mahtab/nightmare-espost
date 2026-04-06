import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TOURNAMENT_DATA } from '../../data/constants.js';

/**
 * TODO: API Integration
 * Replace TOURNAMENT_DATA with live event data:
 * - GET /api/public/events?status=live - Get currently live tournament
 * - Or GET /api/public/events/featured - Get featured event
 * 
 * Implementation:
 * 1. Fetch live event data (could share with HeroSection via context/props)
 * 2. Conditionally render banner only if there's a live event
 * 3. Map response (fields: name, slots, season)
 * 
 * Note: Consider fetching at App.jsx level and passing via context
 * to avoid duplicate API calls across header components
 */

const FeaturedEventBanner = () => (
  <div className="relative border-b border-primary/20 bg-gradient-to-r from-primary/10 via-black to-primary/10">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Live Event</span>
        </div>
        <span className="hidden text-white/30 sm:inline">|</span>
        <span className="hidden text-sm font-medium text-white/80 sm:inline">{TOURNAMENT_DATA.name}</span>
        <span className="hidden text-white/30 md:inline">|</span>
        <span className="hidden text-sm text-white/50 md:inline">{TOURNAMENT_DATA.slots} Slots • {TOURNAMENT_DATA.season}</span>
      </div>
      <Link
        to="/events/event"
        className="group flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-primary uppercase transition-colors hover:text-white"
      >
        View Details
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  </div>
);

export default FeaturedEventBanner;
