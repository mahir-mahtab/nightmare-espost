import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Coins,
  Gavel,
  LogOut,
  Search,
  Target,
  Timer,
  Trophy,
  Users,
  Flame,
  Zap,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import EventSubNav from '../components/layout/EventSubNav.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { EVENT_ROUTE_TABS } from '../data/eventsMockData.js';
import { eventsService } from '../data/eventsService.js';
import useEventAuth from '../hooks/useEventAuth.js';

const FILTER_STATES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'unsold', label: 'Unsold' },
];

// Dynamic page title component based on context
const ContextualPageTitle = ({ activeTab, summary, auction }) => {
  const getTitleConfig = () => {
    switch (activeTab) {
      case 'event':
        return { title: 'Tournament Overview', subtitle: summary?.title || 'Event Information' };
      case 'team':
        return { title: 'Teams', subtitle: 'Team Roster' };
      case 'players':
        return { title: 'Available Players', subtitle: `${auction?.lots?.length || 0} Players Available` };
      case 'auction':
        return { title: 'Live Selection', subtitle: 'NOW LIVE' };
      case 'players-buy':
        return { title: 'Purchase', subtitle: 'Player Selection' };
      default:
        return { title: 'Events', subtitle: 'Event Management' };
    }
  };

  const config = getTitleConfig();

  return (
    <div className="mb-6 overflow-hidden">
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-baseline gap-2 md:gap-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase">{config.title}</h1>
          <span className="hidden sm:inline font-display text-base md:text-lg font-bold text-primary/80 uppercase tracking-wider">{config.subtitle}</span>
        </div>
      </Motion.div>
    </div>
  );
};

const EventCard = ({ summary, auctionLots }) => {
  const soldCount = auctionLots.filter((lot) => lot.status === 'sold').length;
  const activeCount = auctionLots.filter((lot) => lot.status === 'active').length;

  return (
    <div className="grid gap-6 md:gap-8 md:grid-cols-1 lg:grid-cols-5">
      <CyberCard accent className="lg:col-span-3">
        <div className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute -top-16 -left-10 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-primary/12 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black tracking-[0.26em] text-primary uppercase">
              <Calendar className="h-3.5 w-3.5" />
              Live Tournament
            </div>
            <h3 className="mt-6 font-display text-3xl sm:text-4xl md:text-5xl leading-tight font-black uppercase">
              {summary.title}
              <span className="block text-primary">{summary.season}</span>
            </h3>
            <p className="mt-4 md:mt-5 max-w-2xl text-xs md:text-sm leading-relaxed text-white/65">
              Participate in live selections, place bids in real time, and finalize player acquisitions with our dynamic event platform.
            </p>
            <div className="mt-6 md:mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="border border-white/10 bg-black/70 p-4">
                <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">Match Type</p>
                <p className="mt-2 text-base md:text-lg font-bold text-white">{summary.game} • {summary.mode}</p>
              </div>
              <div className="border border-white/10 bg-black/70 p-4">
                <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">Stream Starts</p>
                <p className="mt-2 text-base md:text-lg font-bold text-white">{summary.streamStart}</p>
              </div>
            </div>
          </div>
        </div>
      </CyberCard>
      <div className="space-y-4 lg:col-span-2">
        <MetricCard icon={Users} value={summary.registration} label="Registrations" />
        <MetricCard icon={Target} value={summary.slots} label="Slots" />
        <MetricCard icon={Gavel} value={activeCount} label="Active Lots" />
        <MetricCard icon={Trophy} value={soldCount} label="Players Sold" />
      </div>
    </div>
  );
};

const MetricCard = ({ icon, value, label }) => {
  const IconComponent = icon;

  return (
    <CyberCard hover className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">{label}</p>
          <p className="mt-2 font-display text-2xl md:text-3xl font-black text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center border border-primary/40 bg-primary/15">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CyberCard>
  );
};

const TeamGrid = ({ teams }) => (
  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {teams.map((team) => (
      <Motion.article
        key={team.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="event-team-card overflow-hidden rounded-[2rem] border border-primary/30"
      >
        <div className="relative p-6">
          <div className="absolute inset-0 opacity-70">
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,0,0.38),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(255,80,0,0.24),transparent_45%)]" />
          </div>
          <div className="relative flex items-center gap-4">
            <img src={team.ownerAvatar} alt={team.ownerName} className="h-12 md:h-14 w-12 md:w-14 rounded-full border-2 border-white/40 object-cover" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/65 uppercase">Owner</p>
              <h3 className="font-display text-lg md:text-xl font-black text-white">{team.ownerName}</h3>
            </div>
          </div>
          <div className="relative mt-6 rounded-full border border-amber-200/20 bg-amber-300 px-4 py-2 text-center font-display text-base md:text-lg font-black text-zinc-900">
            {team.name}
          </div>
          <div className="relative mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              {team.roster.map((avatar) => (
                <img key={avatar} src={avatar} alt="Team player" className="h-8 md:h-10 w-8 md:w-10 rounded-full border border-white/40 object-cover" />
              ))}
            </div>
            <div className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-center sm:text-right">
              <p className="text-[9px] tracking-[0.2em] text-white/45 uppercase">Coin Left</p>
              <p className="font-display text-base font-bold text-white">{team.coinsLeft}</p>
            </div>
          </div>
        </div>
      </Motion.article>
    ))}
  </div>
);

const PlayerGrid = ({ players, onSelect }) => (
  <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
    {players.map((player) => (
      <button
        key={player.id}
        type="button"
        onClick={() => onSelect(player.id)}
        className="group relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-zinc-950 text-left transition-all hover:border-primary/70"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          <img src={player.image} alt={player.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {player.status !== 'active' && <span className="sold-stamp">{player.status}</span>}
        </div>
        <div className="border-y border-primary/60 bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-2 font-display text-base md:text-lg font-black text-zinc-950 uppercase">
          {player.name}
        </div>
        <div className="grid grid-cols-3 gap-2 bg-zinc-950 px-3 py-3 text-white text-[10px] md:text-xs">
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Role</p>
            <p className="font-display text-xs md:text-sm font-bold">{player.role}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Coin</p>
            <p className="font-display text-xs md:text-sm font-bold">{player.nmCoin}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Rank</p>
            <p className="font-display text-xs md:text-sm font-bold">{player.rankPoint}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

// Stunning Auction Hub Layout - Mobile optimized
const AuctionHub = ({
  auction,
  selectedAuctionId,
  setSelectedAuctionId,
  bidAmount,
  setBidAmount,
  selectedPlayer,
  selectedAuction,
  playerById,
  selectedOwner,
  owners,
  selectedOwnerId,
  setSelectedOwnerId,
  canBid,
  increments,
  activeTab,
  onPlaceBid,
  onStatusChange,
  onFinalizePurchase,
}) => {
  return (
    <div className="space-y-4 min-h-[600px] flex flex-col">
      <div className="grid gap-4 flex-1 grid-cols-1 sm:grid-cols-4 lg:grid-cols-[160px_1fr_160px] xl:grid-cols-[200px_1fr_200px] overflow-visible">
        {/* Players List - Left Panel */}
        <div className="col-span-1">
          <CyberCard className="flex flex-col h-full p-4">
            <p className="font-display text-xl md:text-2xl font-black text-white/95 uppercase leading-tight">Roster</p>
            <div className="mt-4 flex gap-2 overflow-x-auto sm:overflow-visible lg:flex-col lg:space-y-2 flex-1 items-start content-start flex-wrap lg:flex-nowrap pb-2 sm:pb-0">
              {auction.lots.map((lot) => {
                const player = playerById[lot.playerId];
                if (!player) {
                  return null;
                }

                const isActive = lot.id === selectedAuctionId;

                return (
                  <Motion.button
                    key={lot.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setSelectedAuctionId(lot.id);
                      setBidAmount(String(lot.currentBid));
                    }}
                    className={`relative flex-none w-16 md:w-20 lg:w-full overflow-hidden rounded-xl border p-1.5 text-center lg:text-left transition-all ${
                      isActive ? 'border-primary/70 bg-primary/15 shadow-lg shadow-primary/30' : 'border-white/15 bg-black/45 hover:border-primary/45'
                    }`}
                  >
                    <img src={player.image} alt={player.name} className="h-12 w-12 mx-auto lg:h-full lg:w-full rounded-lg object-cover" />
                    {lot.status !== 'active' && <span className="sold-stamp text-xs">{lot.status}</span>}
                    <p className="mt-1 truncate text-[10px] md:text-xs lg:text-xs font-bold tracking-[0.08em] text-white uppercase">{player.name}</p>
                  </Motion.button>
                );
              })}
            </div>
          </CyberCard>
        </div>

        {/* Main Auction Display - Center Panel */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <CyberCard accent className="relative overflow-hidden flex flex-col h-full">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,0,0.2),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(255,90,0,0.12),transparent_40%)]" />
            <Motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
            />

            <div className="relative p-4 md:p-6 flex flex-col h-full justify-start md:justify-center items-center">
              {/* Status Badge */}
              <Motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-2 md:mb-4 flex items-center gap-2 border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black tracking-[0.26em] text-primary uppercase rounded-full"
              >
                <Flame className="h-3.5 w-3.5 animate-pulse" />
                {activeTab === 'auction' ? 'Live Auction' : 'Purchase Mode'}
              </Motion.div>

              {selectedPlayer ? (
                <div className="mx-auto max-w-2xl w-full space-y-4">
                  {/* Player Card */}
                  <Motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="overflow-hidden rounded-2xl border border-white/20 bg-white"
                  >
                    <div className="relative overflow-hidden aspect-video md:aspect-[3/2] bg-white">
                      <img src={selectedPlayer.image} alt={selectedPlayer.name} className="h-full w-full object-cover object-top" />
                      {/* Status indicator */}
                      <div className={`absolute top-4 right-4 px-3 py-1.5 rounded font-bold text-xs uppercase flex items-center gap-1.5 ${
                        selectedAuction?.status === 'sold' 
                          ? 'bg-green-500/20 border border-green-500/60 text-green-300'
                          : selectedAuction?.status === 'unsold'
                          ? 'bg-yellow-500/20 border border-yellow-500/60 text-yellow-300'
                          : 'bg-red-500/20 border border-red-500/60 text-red-300 animate-pulse'
                      }`}>
                        <Zap className="h-3 w-3" />
                        {selectedAuction?.status === 'active' ? 'LIVE' : selectedAuction?.status}
                      </div>
                    </div>
                    <div className="border-t border-primary/70 bg-zinc-950">
                      <div className="bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2.5 text-center font-display text-xl md:text-2xl font-black text-white uppercase">
                        {selectedPlayer.name}
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-4 py-3">
                        <BidMeta label="Role" value={selectedPlayer.role} />
                        <BidMeta label="Current Bid" value={selectedAuction?.currentBid || selectedPlayer.nmCoin} />
                        <BidMeta label="Rank" value={selectedPlayer.rankPoint} />
                      </div>
                    </div>
                  </Motion.div>

                  {/* Bidding Section */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-center text-[10px] font-bold tracking-[0.2em] text-white/55 uppercase">Place Your Bid</p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={bidAmount}
                        onChange={(event) => setBidAmount(event.target.value)}
                        disabled={!canBid}
                        className="h-12 w-full max-w-[180px] border border-white/30 bg-white text-center font-display text-2xl md:text-3xl font-black text-zinc-950 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-zinc-200 rounded-lg"
                      />
                      <Motion.button
                        whileHover={canBid ? { scale: 1.1 } : {}}
                        whileTap={canBid ? { scale: 0.95 } : {}}
                        type="button"
                        onClick={onPlaceBid}
                        disabled={!canBid}
                        className="flex h-12 w-12 items-center justify-center border-2 border-amber-300 bg-gradient-to-br from-amber-300 to-amber-400 text-zinc-900 transition-all hover:shadow-lg hover:shadow-amber-400/50 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:border-zinc-400 rounded-lg font-bold"
                        aria-label="Place bid"
                      >
                        <Coins className="h-5 w-5" />
                      </Motion.button>
                    </div>

                    {/* Increment Buttons */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {increments.map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          onClick={() => setBidAmount(String(Number(bidAmount || 0) + increment))}
                          disabled={!canBid}
                          className="border border-white/25 bg-black/65 px-3 py-2 text-xs md:text-sm font-bold text-white transition-all hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40 rounded"
                        >
                          +{increment}
                        </button>
                      ))}
                    </div>

                    {!canBid && <p className="text-xs text-amber-300 text-center">View-only mode active for current session.</p>}
                  </div>

                  {/* Countdown Timer */}
                  <Motion.div
                    animate={selectedAuction?.timeLeft < 5 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: selectedAuction?.timeLeft < 5 ? Infinity : 0 }}
                    className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-red-500/50 rounded-xl p-4 space-y-2"
                  >
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <Motion.div
                        animate={{ width: `${Math.min(100, ((selectedAuction?.timeLeft || 0) / (auction.lotDuration || 30)) * 100)}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                        className="h-full bg-gradient-to-r from-amber-300 via-orange-500 to-red-500"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 font-display text-2xl md:text-3xl font-black">
                      <Timer className="h-6 w-6 text-primary animate-pulse" />
                      <span className={selectedAuction?.timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-white'}>
                        {String(selectedAuction?.timeLeft || 0).padStart(2, '0')} SEC
                      </span>
                    </div>
                  </Motion.div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2">
                    <Motion.button
                      whileHover={canBid ? { scale: 1.05 } : {}}
                      whileTap={canBid ? { scale: 0.95 } : {}}
                      type="button"
                      onClick={() => onStatusChange('sold')}
                      disabled={!canBid}
                      className="border border-green-500/50 bg-green-500/10 px-4 py-2 text-xs md:text-sm font-bold tracking-[0.2em] text-green-300 uppercase disabled:cursor-not-allowed disabled:opacity-40 rounded hover:bg-green-500/20 transition-all flex-1 sm:flex-none"
                    >
                      Mark Acquired
                    </Motion.button>
                    <Motion.button
                      whileHover={canBid ? { scale: 1.05 } : {}}
                      whileTap={canBid ? { scale: 0.95 } : {}}
                      type="button"
                      onClick={() => onStatusChange('unsold')}
                      disabled={!canBid}
                      className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-xs md:text-sm font-bold tracking-[0.2em] text-yellow-300 uppercase disabled:cursor-not-allowed disabled:opacity-40 rounded hover:bg-yellow-500/20 transition-all flex-1 sm:flex-none"
                    >
                      Mark Unavailable
                    </Motion.button>
                    {activeTab === 'players-buy' && (
                      <Motion.button
                        whileHover={canBid ? { scale: 1.05 } : {}}
                        whileTap={canBid ? { scale: 0.95 } : {}}
                        type="button"
                        onClick={onFinalizePurchase}
                        disabled={!canBid}
                        className="border border-primary/60 bg-primary/20 px-4 py-2 text-xs md:text-sm font-bold tracking-[0.2em] text-primary uppercase disabled:cursor-not-allowed disabled:opacity-40 rounded hover:bg-primary/30 transition-all flex-1 sm:flex-none"
                      >
                        Confirm Selection
                      </Motion.button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Gavel className="h-12 w-12 text-primary/40 mb-4" />
                  <p className="text-white/40 text-sm">Choose a player from the roster</p>
                </div>
              )}
            </div>
          </CyberCard>
        </div>

        {/* Participants Panel - Right Panel */}
        <div className="col-span-1">
          <CyberCard className="flex flex-col h-full p-4">
            <p className="font-display text-xl md:text-2xl font-black text-white/95 uppercase leading-tight">Bidders</p>
            <div className="mt-4 flex gap-2 overflow-x-auto sm:overflow-visible lg:flex-col lg:space-y-2 flex-1 items-start content-start flex-wrap lg:flex-nowrap pb-2 sm:pb-0">
              {owners.map((owner) => {
                const isSelected = owner.id === selectedOwnerId;
                const auctionHolder = selectedOwner?.id === owner.id;

                return (
                  <Motion.button
                    key={owner.id}
                    whileHover={canBid ? { scale: 1.05 } : {}}
                    whileTap={canBid ? { scale: 0.95 } : {}}
                    type="button"
                    onClick={() => {
                      if (canBid) {
                        setSelectedOwnerId(owner.id);
                      }
                    }}
                    className={`relative flex-none w-16 md:w-20 lg:w-full overflow-hidden rounded-xl border p-1.5 text-center lg:text-left transition-all ${
                      isSelected ? 'border-primary/70 bg-primary/15 shadow-lg shadow-primary/30' : 'border-white/15 bg-black/45 hover:border-primary/45'
                    } ${!canBid ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <img src={owner.avatar} alt={owner.name} className="h-12 w-12 mx-auto lg:h-full lg:w-full rounded-lg object-cover" />
                    <div className="mt-1 flex flex-col lg:flex-row items-center justify-between gap-1 lg:gap-2">
                      <p className="truncate text-[10px] md:text-xs lg:text-xs font-bold tracking-[0.08em] text-white uppercase">{owner.name}</p>
                      {auctionHolder && (
                        <span className="rounded border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[8px] lg:text-[9px] tracking-[0.18em] text-primary uppercase font-bold">
                          Top
                        </span>
                      )}
                    </div>
                  </Motion.button>
                );
              })}
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

const BidMeta = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[9px] font-bold tracking-[0.16em] text-white/45 uppercase">{label}</p>
    <p className="font-display text-lg md:text-xl font-black text-white">{value}</p>
  </div>
);

const EventsPage = () => {
  const navigate = useNavigate();
  const { eventId, tab } = useParams();
  const activeTab = tab || 'event';
  const { session, logout } = useEventAuth(eventId);
  const canBid = session?.role === 'owner' && Boolean(session?.ownerId);

  const tabIds = useMemo(() => EVENT_ROUTE_TABS.map((item) => item.id), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState('');

  const [summary, setSummary] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [auction, setAuction] = useState(null);
  const [increments, setIncrements] = useState([]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    if (!tabIds.includes(activeTab) && eventId) {
      navigate(`/events/${eventId}/event`, { replace: true });
    }
  }, [activeTab, eventId, navigate, tabIds]);

  useEffect(() => {
    if (canBid && session?.ownerId) {
      setSelectedOwnerId(session.ownerId);
    }
  }, [canBid, session]);

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        summaryPayload,
        teamPayload,
        allPlayersPayload,
        ownerPayload,
        auctionPayload,
        incrementsPayload,
      ] = await Promise.all([
        eventsService.getEventSummary(),
        eventsService.getTeams(),
        eventsService.listPlayers(),
        eventsService.getOwners(),
        eventsService.getAuctionBoard(),
        eventsService.getBidIncrements(),
      ]);

      setSummary(summaryPayload);
      setTeams(teamPayload);
      setAllPlayers(allPlayersPayload);
      setPlayers(allPlayersPayload);
      setOwners(ownerPayload);
      setAuction(auctionPayload);
      setIncrements(incrementsPayload);
      setSelectedAuctionId(auctionPayload.activeAuctionId);
      setSelectedOwnerId(canBid && session?.ownerId ? session.ownerId : ownerPayload[0]?.id || '');
      setBidAmount(String(auctionPayload.lots[0]?.currentBid || 0));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  }, [canBid, session]);

  const refreshBoard = async () => {
    const [auctionPayload, allPlayersPayload, filteredPlayers] = await Promise.all([
      eventsService.getAuctionBoard(),
      eventsService.listPlayers(),
      eventsService.listPlayers({
        search,
        role: roleFilter,
        teamId: teamFilter,
        status: statusFilter,
      }),
    ]);

    setAuction(auctionPayload);
    setAllPlayers(allPlayersPayload);
    setPlayers(filteredPlayers);
  };

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!summary) {
        return;
      }

      try {
        const filteredPlayers = await eventsService.listPlayers({
          search,
          role: roleFilter,
          teamId: teamFilter,
          status: statusFilter,
        });
        setPlayers(filteredPlayers);
      } catch (filterError) {
        setError(filterError.message || 'Failed to filter players');
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [summary, search, roleFilter, teamFilter, statusFilter]);

  useEffect(() => {
    if (!auction || !selectedAuctionId) {
      return undefined;
    }

    const interval = setInterval(() => {
      setAuction((prev) => {
        if (!prev) {
          return prev;
        }

        const nextLots = prev.lots.map((lot) => {
          if (lot.id !== selectedAuctionId || lot.status !== 'active' || lot.timeLeft <= 0) {
            return lot;
          }

          return {
            ...lot,
            timeLeft: Math.max(0, lot.timeLeft - 1),
          };
        });

        return { ...prev, lots: nextLots };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [auction, selectedAuctionId]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeout = setTimeout(() => setError(''), 2500);
    return () => clearTimeout(timeout);
  }, [error]);

  const playerById = useMemo(
    () => Object.fromEntries(allPlayers.map((player) => [player.id, player])),
    [allPlayers],
  );

  const ownerById = useMemo(
    () => Object.fromEntries(owners.map((owner) => [owner.id, owner])),
    [owners],
  );

  const selectedAuction = useMemo(
    () => auction?.lots.find((lot) => lot.id === selectedAuctionId) || null,
    [auction, selectedAuctionId],
  );

  const selectedPlayer = selectedAuction ? playerById[selectedAuction.playerId] : null;
  const selectedOwner = selectedAuction ? ownerById[selectedAuction.currentOwnerId] : null;

  const roleOptions = useMemo(
    () => ['all', ...new Set(allPlayers.map((player) => player.role))],
    [allPlayers],
  );

  const teamOptions = useMemo(
    () => [
      { id: 'all', name: 'All Teams' },
      ...teams.map((team) => ({ id: team.id, name: team.name })),
    ],
    [teams],
  );

  const showActionState = (message) => {
    setActionState(message);
    setTimeout(() => {
      setActionState('');
    }, 1800);
  };

  const handlePlaceBid = async () => {
    if (!canBid || !session?.ownerId) {
      setError('Administrative access required to place bids');
      return;
    }

    try {
      if (!selectedAuctionId) {
        return;
      }

      await eventsService.placeBid({
        auctionId: selectedAuctionId,
        ownerId: session.ownerId,
        amount: Number(bidAmount),
      });
      await refreshBoard();
      showActionState('Bid placed successfully');
    } catch (bidError) {
      setError(bidError.message || 'Unable to place bid');
    }
  };

  const handleStatusChange = async (status) => {
    if (!canBid) {
      setError('Administrative access required');
      return;
    }

    try {
      await eventsService.markAuctionStatus({
        auctionId: selectedAuctionId,
        status,
      });
      await refreshBoard();
      showActionState(`Player status updated`);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update status');
    }
  };

  const handleFinalizePurchase = async () => {
    if (!canBid || !session?.ownerId) {
      setError('Administrative access required');
      return;
    }

    try {
      await eventsService.finalizePurchase({
        auctionId: selectedAuctionId,
        ownerId: session.ownerId,
        amount: Number(bidAmount),
      });
      await refreshBoard();
      showActionState('Selection confirmed');
    } catch (purchaseError) {
      setError(purchaseError.message || 'Unable to confirm selection');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/events');
  };

  const renderTab = () => {
    if (!summary || !auction) {
      return null;
    }

    if (activeTab === 'event') {
      return <EventCard summary={summary} auctionLots={auction.lots} />;
    }

    if (activeTab === 'team') {
      return <TeamGrid teams={teams} />;
    }

    if (activeTab === 'players') {
      return (
        <div className="space-y-6">
          <div className="event-filter-wrap rounded-2xl border border-white/12 p-4 md:p-5">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              <label className="relative flex items-center sm:col-span-2 lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-primary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="text"
                  placeholder="Search player or team"
                  className="h-11 w-full border border-white/20 bg-black/65 pr-4 pl-10 text-sm text-white outline-none transition-colors focus:border-primary/70 rounded"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70 rounded"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role} className="bg-zinc-900">
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70 rounded"
              >
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id} className="bg-zinc-900">
                    {team.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70 rounded sm:col-span-2 lg:col-span-1"
              >
                {FILTER_STATES.map((status) => (
                  <option key={status.value} value={status.value} className="bg-zinc-900">
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <PlayerGrid
            players={players}
            onSelect={(id) => {
              const matchingLot = auction.lots.find((lot) => lot.playerId === id);
              if (matchingLot && eventId) {
                setSelectedAuctionId(matchingLot.id);
                navigate(`/events/${eventId}/auction`);
              }
            }}
          />
        </div>
      );
    }

    // Auction and Players-Buy tabs
    return (
      <AuctionHub
        auction={auction}
        selectedAuctionId={selectedAuctionId}
        setSelectedAuctionId={setSelectedAuctionId}
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        selectedPlayer={selectedPlayer}
        selectedAuction={selectedAuction}
        playerById={playerById}
        selectedOwner={selectedOwner}
        owners={owners}
        selectedOwnerId={selectedOwnerId}
        setSelectedOwnerId={setSelectedOwnerId}
        canBid={canBid}
        increments={increments}
        activeTab={activeTab}
        onPlaceBid={handlePlaceBid}
        onStatusChange={handleStatusChange}
        onFinalizePurchase={handleFinalizePurchase}
      />
    );
  };

  if (loading) {
    return (
      <PageShell
        subtitle="Preparing your event panel..."
        accent="Event Management"
        subHeader={<EventSubNav eventId={eventId} />}
      >
        <section className="px-4 md:px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <CyberCard className="p-6 md:p-8">
              <p className="font-display text-xl md:text-2xl font-black uppercase text-white">Loading Event Data...</p>
            </CyberCard>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      accent="Event Management"
      subHeader={<EventSubNav eventId={eventId} />}
    >
      <section className="px-4 md:px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {/* Dynamic Title */}
          <ContextualPageTitle activeTab={activeTab} summary={summary} auction={auction} />

          {/* Session Info Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-white/12 bg-black/35 p-3 md:p-4 rounded-lg">
            <div className="text-[11px] md:text-xs font-bold tracking-[0.16em] text-white/70 uppercase">
              Current Session: {session?.displayName || 'User'} • {session?.role === 'owner' ? 'Administrator' : 'Spectator'}
            </div>
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center md:justify-start gap-2 border border-white/20 bg-black/60 hover:bg-black/80 px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-white/80 uppercase transition-all rounded"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout Event
            </Motion.button>
          </div>

          {/* Main Content with Animation */}
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24 }}
            >
              {renderTab()}
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Toast Notifications - Enhanced */}
      <AnimatePresence>
        {(error || actionState) && (
          <Motion.div
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50 max-w-sm"
          >
            <div
              className={`border px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm rounded-lg backdrop-blur-sm font-bold tracking-wide ${
                error
                  ? 'border-red-500/60 bg-red-500/10 text-red-200'
                  : 'border-green-500/60 bg-green-500/10 text-green-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {error ? (
                  <AlertTriangle className="mt-0.5 h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
                )}
                <span>{error || actionState}</span>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default EventsPage;
