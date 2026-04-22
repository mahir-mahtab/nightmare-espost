import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { io } from 'socket.io-client';
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
} from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import EventSubNav from '../components/layout/EventSubNav.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { EVENT_ROUTE_TABS } from '../data/eventsMockData.js';
import { eventsService } from '../data/eventsService.js';
import useEventAuth from '../hooks/useEventAuth.js';
import { config } from '../config.js';

const FILTER_STATES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'unsold', label: 'Unsold' },
];

const AUCTION_FILTER_STATES = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'unsold', label: 'Unsold' },
];

const LOT_STATUS_STYLES = {
  pending: 'border-white/25 bg-white/10 text-white/80',
  active: 'border-amber-300/60 bg-amber-300/20 text-amber-200',
  sold: 'border-emerald-300/60 bg-emerald-400/20 text-emerald-200',
  unsold: 'border-rose-400/60 bg-rose-500/20 text-rose-200',
};

// Dynamic page title component based on context
const ContextualPageTitle = ({ activeTab, summary, auction, compact = false }) => {
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
      case 'auction-state':
        return { title: 'Auction State', subtitle: 'Search Lot Status' };
      default:
        return { title: 'Events', subtitle: 'Event Management' };
    }
  };

  const config = getTitleConfig();

  return (
    <div className={`${compact ? 'mb-3' : 'mb-6'} overflow-hidden`}>
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className={`flex ${compact ? 'flex-wrap items-center' : 'items-baseline'} gap-2 md:gap-4`}>
          <h1 className={`font-display font-black text-white uppercase ${compact ? 'text-xl sm:text-2xl md:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}>{config.title}</h1>
          <span className={`${compact ? 'inline' : 'hidden sm:inline'} font-display text-sm md:text-base font-bold text-primary/80 uppercase tracking-wider`}>
            {config.subtitle}
          </span>
        </div>
      </Motion.div>
    </div>
  );
};

const EventCard = ({ summary, auctionLots }) => {
  const soldCount = auctionLots.filter((lot) => lot.status === 'sold').length;
  const activeCount = auctionLots.filter((lot) => lot.status === 'active').length;
  const sponsorImageUrl = summary.sponsorImageUrl || '/sponsor.png';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 xl:grid xl:grid-cols-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,0,0,0.1),transparent_50%)]" />

      <div className="relative p-8 xl:col-span-8 xl:p-12">
        <div className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black tracking-[0.26em] text-primary uppercase">
          <Calendar className="h-3.5 w-3.5" />
          Live Tournament
        </div>

        <h3 className="mt-8 font-display text-4xl sm:text-5xl md:text-6xl leading-tight font-black uppercase text-white">
          {summary.title}
          <span className="block mt-2 text-primary">{summary.season}</span>
        </h3>

        <p className="mt-6 max-w-2xl text-sm md:text-base leading-relaxed text-white/60">
          Participate in live selections, place bids in real time, and finalize player acquisitions with our dynamic event platform.
        </p>

        <div className="mt-10 flex flex-wrap gap-8 border-y border-white/10 py-6 sm:gap-16">
          <div>
            <p className="text-[10px] font-black tracking-[0.24em] text-white/40 uppercase">Match Type</p>
            <p className="mt-2 text-lg font-bold text-white">{summary.game} <span className="text-white/30">|</span> {summary.mode}</p>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[0.24em] text-white/40 uppercase">Stream Starts</p>
            <p className="mt-2 text-lg font-bold text-white">{summary.streamStart}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-[10px] font-black tracking-[0.24em] text-white/40 uppercase">Presented By</p>
          <img
            src={sponsorImageUrl}
            alt={`${summary.title} sponsor`}
            className="h-10 w-auto max-w-50 object-contain sm:h-14"
            onError={(event) => {
              event.currentTarget.src = '/sponsor.png';
            }}
          />
        </div>
      </div>

      <div className="relative flex flex-col justify-center border-t border-white/10 bg-white/2 p-8 xl:col-span-4 xl:border-t-0 xl:border-l">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard icon={Users} value={summary.registration} label="Registrations" />
          <MetricCard icon={Target} value={summary.slots} label="Slots" />
          <MetricCard icon={Gavel} value={activeCount} label="Active Lots" />
          <MetricCard icon={Trophy} value={soldCount} label="Players Sold" />
        </div>
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
        className="group event-team-card overflow-hidden rounded-4xl border border-white/15 bg-zinc-950/95 shadow-[0_18px_34px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45"
      >
        <div className="relative p-5 md:p-6">
          <div className="absolute inset-0 opacity-85">
            <div className="h-full w-full bg-[radial-gradient(circle_at_14%_14%,rgba(255,90,0,0.38),transparent_42%),radial-gradient(circle_at_82%_84%,rgba(250,204,21,0.2),transparent_45%)]" />
          </div>
          <div className="relative flex items-start gap-3">
            <img src={team.ownerAvatar} alt={team.ownerName} className="h-12 w-16 shrink-0 rounded-md border-2 border-white/45 object-cover shadow-[0_8px_14px_rgba(0,0,0,0.35)] md:h-13 md:w-18" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.18em] text-white/60 uppercase">Owner</p>
              <h3 className="line-clamp-2 font-display text-sm font-black text-white md:text-base">{team.ownerName}</h3>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/12 bg-black/35 px-3 py-2.5">
            <div>
              <p className="text-[9px] font-bold tracking-[0.16em] text-white/45 uppercase">Available Coins</p>
              <p className="mt-0.5 font-display text-lg font-black text-primary md:text-xl">{team.coinsLeft}</p>
            </div>
            <div className="h-8 w-px bg-linear-to-b from-white/10 via-white/20 to-white/10" />
            <div className="flex-1 text-right">
              <p className="text-[9px] font-bold tracking-[0.16em] text-white/45 uppercase">Sold</p>
              <p className="mt-0.5 font-display text-lg font-black text-white md:text-xl">{team.playersSold || 0}</p>
            </div>
          </div>
          <div className="relative mt-4 rounded-3xl border-2 border-amber-300/40 bg-[linear-gradient(135deg,rgba(252,211,77,0.95),rgba(251,146,60,0.98))] px-4 py-2.5 text-center font-display text-base font-black text-zinc-950 shadow-[0_8px_16px_rgba(251,146,60,0.22)] md:text-lg">
            {team.name}
          </div>
          <div className="relative mt-4 space-y-2">
            <p className="text-center text-[9px] font-bold tracking-[0.18em] text-white/50 uppercase">Roster</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {team.roster.map((avatar) => (
                <img key={avatar} src={avatar} alt="Team player" className="h-8 w-12 rounded-md border-2 border-white/30 object-cover shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:scale-110 md:h-9 md:w-14" />
              ))}
            </div>
          </div>
        </div>
      </Motion.article>
    ))}
  </div>
);

const PlayerGrid = ({ players, onSelect }) => (
  <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {players.map((player) => (
      <button
        key={player.id}
        type="button"
        onClick={() => onSelect(player.id)}
        className="group relative mx-auto w-full max-w-52 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 text-left shadow-[0_12px_24px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/65"
      >
        <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
          <img src={player.image} alt={player.name} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
          {player.status !== 'active' && <span className="sold-stamp">{player.status}</span>}
        </div>
        <div className="border-y border-primary/55 bg-[linear-gradient(92deg,#f59e0b,#f97316)] px-2.5 py-1.5 font-display text-sm font-black text-zinc-950 uppercase md:text-base">
          {player.name}
        </div>
        <div className="grid grid-cols-3 gap-1.5 bg-[linear-gradient(180deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98))] px-2.5 py-2.5 text-[10px] text-white md:text-xs">
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Role</p>
            <p className="font-display text-[11px] font-bold md:text-xs">{player.role}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Coin</p>
            <p className="font-display text-[11px] font-bold md:text-xs">{player.nmCoin}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Rank</p>
            <p className="font-display text-[11px] font-bold md:text-xs">{player.rankPoint}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

const AuctionLotTile = ({ lot, player, isActive, onSelect }) => {
  if (!player) {
    return null;
  }

  const lotStatus = String(lot.status || 'pending').toLowerCase();
  const lotStatusStyle = LOT_STATUS_STYLES[lotStatus] || LOT_STATUS_STYLES.pending;
  const playerImage = lot.playerImageUrl || player.image;
  const playerRole = lot.playerRole || player.role || '-';

  return (
    <button
      type="button"
      onClick={() => onSelect(lot.id)}
      className={`group relative w-full overflow-hidden rounded-xl border p-2 text-left transition-all ${
        isActive ? 'border-primary/75 bg-primary/14' : 'border-white/15 bg-black/45 hover:border-primary/45'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-white/20 bg-white">
          <img src={playerImage} alt={player.name} className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black tracking-[0.08em] text-white uppercase">{player.name}</p>
          <p className="mt-0.5 truncate text-[10px] text-white/60">{playerRole}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] uppercase ${lotStatusStyle}`}>
            {lotStatus}
          </span>
          <p className="text-[10px] font-bold text-primary">{lot.currentBid}</p>
        </div>
      </div>
    </button>
  );
};

const AuctionOwnerTile = ({ owner, isLeader }) => (
  <div
    className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
      isLeader ? 'border-primary/70 bg-primary/12' : 'border-white/15 bg-black/45'
    }`}
  >
    <img src={owner.avatar} alt={owner.name} className="h-10 w-14 rounded-md border border-white/20 object-cover" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-[11px] font-bold tracking-[0.08em] text-white uppercase">{owner.name}</p>
      <p className={`text-[10px] ${isLeader ? 'text-primary' : 'text-white/45'}`}>{isLeader ? 'Top bid' : 'Watching'}</p>
    </div>
  </div>
);

const AuctionHub = ({
  auction,
  selectedAuctionId,
  bidAmount,
  setBidAmount,
  selectedPlayer,
  selectedAuction,
  playerById,
  selectedOwner,
  owners,
  canBid,
  increments,
  onPlaceBid,
  onSelectAuction,
}) => {
  const activePlayerName = selectedPlayer?.name || 'No player selected';
  const focusedLotId = selectedAuctionId || auction.activeAuctionId;

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(140deg,rgba(100,0,0,0.34),rgba(0,0,0,0.92)_62%)] p-2.5 sm:p-3 lg:p-4">
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <CyberCard className="hidden min-h-0 overflow-hidden p-3 lg:flex lg:flex-col" hover={false}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg font-black uppercase text-white">Players</p>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">Queue</p>
          </div>
          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-2">
            {auction.lots.map((lot) => (
              <AuctionLotTile
                key={lot.id}
                lot={lot}
                player={playerById[lot.playerId]}
                isActive={lot.id === focusedLotId}
                onSelect={onSelectAuction}
              />
            ))}
          </div>
        </CyberCard>

        <CyberCard className="auction-main-panel min-h-0 overflow-hidden p-3 sm:p-4 lg:p-5" accent hover={false}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-white/15 bg-black/70">
                {selectedPlayer ? (
                  <img src={selectedPlayer.image} alt={selectedPlayer.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-black/70 text-white/45">
                    <Gavel className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.22em] text-white/45 uppercase">Now Selecting</p>
                    <h3 className="mt-1 font-display text-2xl font-black uppercase text-white md:text-3xl">{activePlayerName}</h3>
                  </div>
                  <span className="rounded border border-primary/50 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-primary uppercase">
                    Live Auction
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/45 p-3">
                  <BidMeta label="Role" value={selectedPlayer?.role || '-'} />
                  <BidMeta label="Current" value={selectedAuction?.currentBid || selectedPlayer?.nmCoin || '-'} />
                  <BidMeta label="Rank" value={selectedPlayer?.rankPoint || '-'} />
                </div>

                <div className="rounded-xl border border-primary/25 bg-black/55 p-3">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-white/45 uppercase">Current Bid</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="rounded-md border border-primary/45 bg-primary/12 px-3 py-1 font-display text-2xl font-black text-primary md:text-3xl">
                      {selectedAuction?.currentBid || 0}
                    </div>
                    <p className="text-[11px] text-white/70">
                      Leader: <span className="font-bold text-primary">{selectedOwner?.name || 'No bids yet'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  disabled={!canBid}
                  className="h-12 w-full min-w-40 flex-1 rounded border border-white/30 bg-white px-3 text-center font-display text-2xl font-black text-zinc-950 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-zinc-200"
                />
                <button
                  type="button"
                  onClick={onPlaceBid}
                  disabled={!canBid}
                  className="inline-flex h-12 items-center justify-center gap-2 border border-amber-300 bg-amber-300 px-4 text-xs font-bold tracking-[0.16em] text-zinc-900 uppercase transition-all hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-400"
                >
                  <Coins className="h-4 w-4" />
                  Bid
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {increments.map((increment) => (
                  <button
                    key={increment}
                    type="button"
                    onClick={() => setBidAmount(String(Number(bidAmount || 0) + increment))}
                    disabled={!canBid}
                    className="h-12 min-w-16 border border-white/25 bg-black/65 px-3 text-xs font-bold text-white transition-all hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +{increment}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <Motion.div
                  animate={{ width: `${Math.min(100, ((selectedAuction?.timeLeft || 0) / (auction.lotDuration || 30)) * 100)}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full bg-linear-to-r from-amber-300 via-orange-500 to-red-500"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 font-display text-xl font-black text-white md:text-2xl">
                  <Timer className="h-4 w-4 text-primary" />
                  {String(selectedAuction?.timeLeft || 0).padStart(2, '0')} SEC
                </div>
                {!canBid && <p className="text-[11px] text-amber-300">Viewing mode active. Sign in as owner to place bids.</p>}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:hidden">
              <CyberCard className="p-3" hover={false}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-base font-black uppercase text-white">Players Queue</p>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">Tap to switch</p>
                </div>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {auction.lots.map((lot) => (
                    <AuctionLotTile
                      key={lot.id}
                      lot={lot}
                      player={playerById[lot.playerId]}
                      isActive={lot.id === focusedLotId}
                      onSelect={onSelectAuction}
                    />
                  ))}
                </div>
              </CyberCard>

              <CyberCard className="p-3" hover={false}>
                <p className="font-display text-base font-black uppercase text-white">Owners</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {owners.map((owner) => (
                    <AuctionOwnerTile key={owner.id} owner={owner} isLeader={selectedOwner?.id === owner.id} />
                  ))}
                </div>
              </CyberCard>
            </div>
          </div>
        </CyberCard>

        <CyberCard className="hidden min-h-0 overflow-hidden p-3 lg:flex lg:flex-col" hover={false}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg font-black uppercase text-white">Owner</p>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">Bidders</p>
          </div>
          <div className="mt-3 space-y-2 overflow-y-auto pr-1">
            {owners.map((owner) => (
              <AuctionOwnerTile key={owner.id} owner={owner} isLeader={selectedOwner?.id === owner.id} />
            ))}
          </div>
        </CyberCard>
      </div>
    </div>
  );
};

const AuctionStateList = ({
  board,
  loading,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onOpenAuction,
}) => {
  const lots = board?.lots || [];

  return (
    <div className="space-y-5">
      <div className="event-filter-wrap rounded-2xl border border-white/12 p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-primary" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              type="text"
              placeholder="Search by player name"
              className="h-11 w-full border border-white/20 bg-black/65 pr-4 pl-10 text-sm text-white outline-none transition-colors focus:border-primary/70 rounded"
            />
          </label>

          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70 rounded"
          >
            {AUCTION_FILTER_STATES.map((item) => (
              <option key={item.value} value={item.value} className="bg-zinc-900">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CyberCard accent className="overflow-hidden p-0" hover={false}>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1fr)_110px] gap-3 border-b border-white/10 bg-black/55 px-4 py-3 text-[10px] font-bold tracking-[0.18em] text-white/55 uppercase">
          <p>Player</p>
          <p>Role</p>
          <p>Status</p>
          <p>Owned By</p>
          <p className="text-right">Action</p>
        </div>

        <div className="max-h-[62vh] overflow-y-auto">
          {loading && (
            <div className="border-b border-white/8 px-4 py-4 text-sm text-white/70">
              Fetching auction status...
            </div>
          )}

          {!loading && lots.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-white/60">
              No lots found for this filter.
            </div>
          )}

          {!loading && lots.map((lot) => {
            const lotStatus = normalizeLotStatus(lot.status);
            const lotStatusStyle = LOT_STATUS_STYLES[lotStatus] || LOT_STATUS_STYLES.pending;
            const ownerName = lotStatus === 'sold' ? (lot.ownerName || 'Unknown owner') : 'Not sold yet';

            return (
              <div
                key={lot.id}
                className="grid grid-cols-1 gap-3 border-b border-white/8 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1fr)_110px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-white/20 bg-white">
                    {lot.playerImageUrl ? (
                      <img src={lot.playerImageUrl} alt={lot.playerName} className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/70 text-white/40">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{lot.playerName || 'Unknown player'}</p>
                    <p className="truncate text-[11px] text-white/50">Lot #{lot.lotOrder}</p>
                  </div>
                </div>

                <p className="text-xs font-semibold text-white/75">{lot.playerRole || '-'}</p>

                <div>
                  <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${lotStatusStyle}`}>
                    {lotStatus}
                  </span>
                </div>

                <p className="text-xs text-white/80">{ownerName}</p>

                <div className="md:text-right">
                  <button
                    type="button"
                    onClick={() => onOpenAuction(lot.id)}
                    className="inline-flex h-8 items-center justify-center rounded border border-primary/45 bg-primary/10 px-3 text-[10px] font-bold tracking-[0.12em] text-primary uppercase transition-colors hover:bg-primary/20"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CyberCard>
    </div>
  );
};

const BidMeta = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[9px] font-bold tracking-[0.16em] text-white/45 uppercase">{label}</p>
    <p className="font-display text-base font-black text-white md:text-lg">{value}</p>
  </div>
);

const SoldAnnouncementPopup = ({ data, onClose }) => {
  if (!data) {
    return null;
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      className="fixed top-4 left-1/2 z-70 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      <div className="rounded-xl border border-emerald-400/45 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(0,0,0,0.78))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">Player Sold</p>
            <p className="mt-1 font-display text-lg font-black uppercase text-white">{data.playerName}</p>
            <p className="mt-1 text-sm text-white/90">Sold to <span className="font-bold text-emerald-300">{data.ownerName}</span></p>
            <p className="mt-1 text-xs font-bold tracking-[0.14em] text-white/70 uppercase">Final Bid: {data.amount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/30 bg-black/35 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase hover:bg-black/60"
          >
            Close
          </button>
        </div>
      </div>
    </Motion.div>
  );
};

const normalizeLotStatus = (status) => String(status || 'pending').toLowerCase();

const normalizeEndTime = (endsAt) => {
  if (!endsAt) {
    return null;
  }

  const endMs = typeof endsAt === 'number' ? endsAt : new Date(endsAt).getTime();
  if (!Number.isFinite(endMs)) {
    return null;
  }

  return endMs;
};

const computeSecondsLeft = (endsAt) => {
  const endMs = normalizeEndTime(endsAt);
  if (!endMs) {
    return 0;
  }

  return Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
};

const EventsPage = () => {
  const navigate = useNavigate();
  const { eventId, tab } = useParams();
  const activeTab = tab || 'event';
  const normalizedTab = activeTab === 'players-buy' ? 'auction-state' : activeTab;
  const isAuctionViewportTab = normalizedTab === 'auction';
  const { session, logout } = useEventAuth(eventId);
  const sessionEventId = session?.eventId || '';
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

  const [auctionStateBoard, setAuctionStateBoard] = useState(null);
  const [auctionStateLoading, setAuctionStateLoading] = useState(false);
  const [auctionStateSearch, setAuctionStateSearch] = useState('');
  const [auctionStateStatus, setAuctionStateStatus] = useState('all');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [soldAnnouncement, setSoldAnnouncement] = useState(null);

  useEffect(() => {
    if (activeTab === 'players-buy' && eventId) {
      navigate(`/events/${eventId}/auction-state`, { replace: true });
    }
  }, [activeTab, eventId, navigate]);

  useEffect(() => {
    if (!tabIds.includes(normalizedTab) && eventId) {
      navigate(`/events/${eventId}/event`, { replace: true });
    }
  }, [normalizedTab, eventId, navigate, tabIds]);

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
        eventsService.getEventSummary(eventId, session?.sessionToken),
        eventsService.getTeams(eventId, session?.sessionToken),
        eventsService.listPlayers(eventId, session?.sessionToken),
        eventsService.getOwners(eventId, session?.sessionToken),
        eventsService.getAuctionBoard(eventId, session?.sessionToken),
        eventsService.getBidIncrements(),
      ]);

      setSummary(summaryPayload);
      setTeams(teamPayload);
      setAllPlayers(allPlayersPayload);
      setPlayers(allPlayersPayload);
      setOwners(ownerPayload);
      setAuction(auctionPayload);
      setAuctionStateBoard(auctionPayload);
      setIncrements(incrementsPayload);
      setSelectedAuctionId(auctionPayload.activeAuctionId);
      setBidAmount(String((auctionPayload.lots || []).find((lot) => lot.id === auctionPayload.activeAuctionId)?.currentBid || auctionPayload.lots?.[0]?.currentBid || 0));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load event data');
    } finally {
      setLoading(false);
    }
  }, [session, eventId]);

  const refreshBoard = useCallback(async () => {
    const [auctionPayload, allPlayersPayload, filteredPlayers] = await Promise.all([
      eventsService.getAuctionBoard(eventId, session?.sessionToken),
      eventsService.listPlayers(eventId, session?.sessionToken),
      eventsService.listPlayers(eventId, session?.sessionToken, {
        search,
        role: roleFilter,
        teamId: teamFilter,
        status: statusFilter,
      }),
    ]);

    setAuction(auctionPayload);
    setAuctionStateBoard(auctionPayload);
    setAllPlayers(allPlayersPayload);
    setPlayers(filteredPlayers);
  }, [eventId, session, search, roleFilter, teamFilter, statusFilter]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!summary) {
        return;
      }

      try {
        const filteredPlayers = await eventsService.listPlayers(eventId, session?.sessionToken, {
          search,
          role: roleFilter,
          teamId: teamFilter,
          status: statusFilter,
        });
        setPlayers(filteredPlayers);
      } catch (filterError) {
        setError(filterError.message || 'Unable to filter players');
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [summary, search, roleFilter, teamFilter, statusFilter, eventId, session]);

  useEffect(() => {
    if (normalizedTab !== 'auction-state' || !eventId || !session?.sessionToken) {
      return undefined;
    }

    let isMounted = true;
    const timeout = setTimeout(async () => {
      setAuctionStateLoading(true);
      try {
        const board = await eventsService.getAuctionBoard(eventId, session.sessionToken, {
          search: auctionStateSearch,
          status: auctionStateStatus,
        });

        if (isMounted) {
          setAuctionStateBoard(board);
        }
      } catch (filterError) {
        if (isMounted) {
          setError(filterError.message || 'Unable to load auction state');
        }
      } finally {
        if (isMounted) {
          setAuctionStateLoading(false);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [normalizedTab, eventId, session, auctionStateSearch, auctionStateStatus]);

  useEffect(() => {
    if (normalizedTab !== 'auction-state') {
      return;
    }

    if (auctionStateSearch.trim() || auctionStateStatus !== 'all') {
      return;
    }

    setAuctionStateBoard(auction);
  }, [normalizedTab, auctionStateSearch, auctionStateStatus, auction]);

  useEffect(() => {
    if (!eventId || !session?.sessionToken || !session?.eventId) {
      return undefined;
    }

    const socketBaseUrl = config.apiUrl.replace(/\/api$/, '');
    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      auth: {
        token: session.sessionToken,
      },
    });

    const isSameEvent = (incomingEventId) => {
      if (!incomingEventId) {
        return false;
      }

      if (sessionEventId && incomingEventId === sessionEventId) {
        return true;
      }

      return incomingEventId === eventId;
    };

    const syncAuctionState = (state) => {
      if (!state || !isSameEvent(state.eventId)) {
        return;
      }

      setAuction({
        activeAuctionId: state.activeLotId,
        lotDuration: state.lotDuration,
        activeLotEndsAt: state.activeLotEndsAt || null,
        timeLeft: Number(state.timeLeft || 0),
        lots: (state.lots || []).map((lot) => {
          if (lot.id !== state.activeLotId) {
            return lot;
          }

          return {
            ...lot,
            timeLeft: computeSecondsLeft(state.activeLotEndsAt || lot.endsAt),
          };
        }),
      });

      if (state.activeLotId) {
        setSelectedAuctionId((prevId) => (prevId ? prevId : state.activeLotId));
      }
    };

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_event', { eventId: sessionEventId || eventId });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    socket.on('reconnect', () => {
      socket.emit('join_event', { eventId: sessionEventId || eventId });
    });

    socket.on('auction_state', (state) => {
      syncAuctionState(state);
    });

    socket.on('timer_tick', ({ eventId: incomingEventId, timeLeft, activeLotId, activeLotEndsAt }) => {
      if (!isSameEvent(incomingEventId)) {
        return;
      }

      setAuction((prev) => {
        if (!prev) {
          return prev;
        }

        const resolvedActiveLotId = activeLotId || prev.activeAuctionId || null;
        const prevEndTime = normalizeEndTime(prev.activeLotEndsAt);
        const incomingEndTime = normalizeEndTime(activeLotEndsAt);
        const nextEndTime = incomingEndTime ?? prevEndTime;
        const parsedTimeLeft = Number(timeLeft);
        const nextTimeLeft = Number.isFinite(parsedTimeLeft) ? parsedTimeLeft : Number(prev.timeLeft || 0);
        const activeLot = (prev.lots || []).find((lot) => lot.id === resolvedActiveLotId);
        const currentLotTimeLeft = Number(activeLot?.timeLeft ?? prev.timeLeft ?? 0);

        const topLevelTimeUnchanged = Number(prev.timeLeft || 0) === nextTimeLeft;
        const lotTimeUnchanged = currentLotTimeLeft === nextTimeLeft;
        const endTimeUnchanged = prevEndTime === nextEndTime;
        const activeLotUnchanged = (prev.activeAuctionId || null) === resolvedActiveLotId;

        if (topLevelTimeUnchanged && lotTimeUnchanged && endTimeUnchanged && activeLotUnchanged) {
          return prev;
        }

        const nextLots = !resolvedActiveLotId || lotTimeUnchanged
          ? (prev.lots || [])
          : (prev.lots || []).map((lot) => {
            if (lot.id !== resolvedActiveLotId) {
              return lot;
            }

            return {
              ...lot,
              timeLeft: nextTimeLeft,
            };
          });

        return {
          ...prev,
          activeAuctionId: resolvedActiveLotId,
          activeLotEndsAt: nextEndTime,
          timeLeft: nextTimeLeft,
          lots: nextLots,
        };
      });
    });

    socket.on('joined_event', ({ eventId: incomingEventId }) => {
      if (!isSameEvent(incomingEventId)) {
        return;
      }

      setSocketConnected(true);
    });

    socket.on('new_bid', ({ eventId: incomingEventId, lotId, ownerId, amount, timeLeft, activeLotEndsAt }) => {
      if (!isSameEvent(incomingEventId)) {
        return;
      }

      setAuction((prev) => {
        if (!prev) {
          return prev;
        }

        const prevEndTime = normalizeEndTime(prev.activeLotEndsAt);
        const incomingEndTime = normalizeEndTime(activeLotEndsAt);
        const nextEndTime = incomingEndTime ?? prevEndTime;
        const parsedTimeLeft = Number(timeLeft);
        const targetLot = (prev.lots || []).find((lot) => lot.id === lotId) || null;
        const lotTimeLeft = Number.isFinite(parsedTimeLeft)
          ? parsedTimeLeft
          : Number(targetLot?.timeLeft ?? computeSecondsLeft(nextEndTime));

        const lotChanged = Boolean(targetLot) && (
          targetLot.currentOwnerId !== ownerId
          || Number(targetLot.currentBid ?? 0) !== Number(amount ?? 0)
          || Number(targetLot.timeLeft ?? 0) !== lotTimeLeft
        );
        const endTimeChanged = prevEndTime !== nextEndTime;
        const shouldUpdateTopLevelTime = lotId === prev.activeAuctionId && Number(prev.timeLeft || 0) !== lotTimeLeft;

        if (!lotChanged && !endTimeChanged && !shouldUpdateTopLevelTime) {
          return prev;
        }

        const nextLots = lotChanged
          ? (prev.lots || []).map((lot) => (
            lot.id === lotId
              ? {
                ...lot,
                currentOwnerId: ownerId,
                currentBid: amount,
                timeLeft: lotTimeLeft,
              }
              : lot
          ))
          : (prev.lots || []);

        return {
          ...prev,
          activeLotEndsAt: nextEndTime,
          timeLeft: shouldUpdateTopLevelTime ? lotTimeLeft : prev.timeLeft,
          lots: nextLots,
        };
      });
    });

    socket.on('lot_status_changed', ({ eventId: incomingEventId, lot }) => {
      if (!isSameEvent(incomingEventId) || !lot) {
        return;
      }

      const incomingStatus = normalizeLotStatus(lot.status);

      setAuction((prev) => {
        if (!prev) {
          return prev;
        }

        const previousLot = (prev.lots || []).find((item) => item.id === lot.id) || null;
        const previousStatus = normalizeLotStatus(previousLot?.status);

        if (incomingStatus === 'sold' && previousStatus !== 'sold') {
          setSoldAnnouncement({
            lotId: lot.id,
            playerName: lot.playerName || previousLot?.playerName || 'Player',
            ownerName: lot.currentOwnerName || previousLot?.currentOwnerName || 'Unknown owner',
            amount: Number(lot.currentBid ?? previousLot?.currentBid ?? 0),
          });
        }

        return {
          ...prev,
          lots: (prev.lots || []).map((item) => (item.id === lot.id ? { ...item, ...lot } : item)),
        };
      });
    });

    socket.on('active_lot_changed', ({ eventId: incomingEventId, newLotId }) => {
      if (!isSameEvent(incomingEventId)) {
        return;
      }

      if (newLotId) {
        setSelectedAuctionId(newLotId);
      }
    });

    socket.on('auction_error', (payload) => {
      setError(payload?.message || 'Connection to the live auction was interrupted');
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId, session, sessionEventId]);

  useEffect(() => {
    if (!auction?.activeAuctionId) {
      return undefined;
    }

    const interval = setInterval(() => {
      setAuction((prev) => {
        if (!prev?.activeAuctionId) {
          return prev;
        }

        const activeLot = (prev.lots || []).find((lot) => lot.id === prev.activeAuctionId);
        const endTime = prev.activeLotEndsAt || activeLot?.endsAt || null;
        const secondsLeft = computeSecondsLeft(endTime);
        const currentTopLevel = Number(prev.timeLeft || 0);
        const currentLotTimeLeft = Number(activeLot?.timeLeft ?? currentTopLevel);
        const shouldUpdateLot = Boolean(activeLot) && (
          currentLotTimeLeft !== secondsLeft
          || Boolean(!activeLot.endsAt && endTime)
        );
        const shouldUpdateTopLevel = currentTopLevel !== secondsLeft;

        if (!shouldUpdateLot && !shouldUpdateTopLevel) {
          return prev;
        }

        const nextLots = shouldUpdateLot
          ? (prev.lots || []).map((lot) => (
            lot.id === prev.activeAuctionId
              ? { ...lot, timeLeft: secondsLeft, endsAt: lot.endsAt || endTime }
              : lot
          ))
          : (prev.lots || []);

        return {
          ...prev,
          timeLeft: shouldUpdateTopLevel ? secondsLeft : prev.timeLeft,
          lots: nextLots,
        };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [auction?.activeLotEndsAt, auction?.activeAuctionId]);

  useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timeout = setTimeout(() => setError(''), 2500);
    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!soldAnnouncement) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setSoldAnnouncement(null);
    }, 4500);

    return () => clearTimeout(timeout);
  }, [soldAnnouncement]);

  const playerById = useMemo(
    () => Object.fromEntries(allPlayers.map((player) => [player.id, player])),
    [allPlayers],
  );

  const ownerById = useMemo(
    () => Object.fromEntries(owners.map((owner) => [owner.id, owner])),
    [owners],
  );

  const selectedAuction = useMemo(
    () => auction?.lots.find((lot) => lot.id === selectedAuctionId)
      || auction?.lots.find((lot) => lot.id === auction?.activeAuctionId)
      || auction?.lots?.[0]
      || null,
    [auction, selectedAuctionId],
  );

  const selectedPlayer = selectedAuction ? playerById[selectedAuction.playerId] : null;
  const selectedOwner = selectedAuction ? ownerById[selectedAuction.currentOwnerId] : null;

  useEffect(() => {
    if (!auction?.lots?.length) {
      return;
    }

    const availableIds = new Set(auction.lots.map((lot) => lot.id));
    const activeLotId = auction.activeAuctionId || null;

    if (normalizedTab === 'auction' && activeLotId && selectedAuctionId !== activeLotId) {
      setSelectedAuctionId(activeLotId);
      return;
    }

    if (!selectedAuctionId || !availableIds.has(selectedAuctionId)) {
      setSelectedAuctionId(activeLotId || auction.lots[0].id);
    }
  }, [auction, normalizedTab, selectedAuctionId]);

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
      setError('Owner session required to place bids');
      return;
    }

    try {
      if (!selectedAuctionId) {
        return;
      }

      await eventsService.placeBid({
        eventId,
        sessionToken: session.sessionToken,
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

  const handleLogout = () => {
    logout();
    navigate('/events');
  };

  const handleSelectAuction = (auctionId) => {
    setSelectedAuctionId(auctionId);

    const nextLot = auction?.lots.find((lot) => lot.id === auctionId);
    if (nextLot?.currentBid !== undefined && nextLot?.currentBid !== null) {
      setBidAmount(String(nextLot.currentBid));
    }
  };

  const renderTab = () => {
    if (!summary || !auction) {
      return null;
    }

    if (normalizedTab === 'event') {
      return <EventCard summary={summary} auctionLots={auction.lots} />;
    }

    if (normalizedTab === 'team') {
      return <TeamGrid teams={teams} />;
    }

    if (normalizedTab === 'players') {
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

    if (normalizedTab === 'auction-state') {
      return (
        <AuctionStateList
          board={auctionStateBoard || auction}
          loading={auctionStateLoading}
          search={auctionStateSearch}
          status={auctionStateStatus}
          onSearchChange={setAuctionStateSearch}
          onStatusChange={setAuctionStateStatus}
          onOpenAuction={(lotId) => {
            setSelectedAuctionId(lotId);
            if (eventId) {
              navigate(`/events/${eventId}/auction`);
            }
          }}
        />
      );
    }

    // Live auction tab
    return (
      <AuctionHub
        auction={auction}
        selectedAuctionId={selectedAuctionId}
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        selectedPlayer={selectedPlayer}
        selectedAuction={selectedAuction}
        playerById={playerById}
        selectedOwner={selectedOwner}
        owners={owners}
        canBid={canBid}
        increments={increments}
        onPlaceBid={handlePlaceBid}
        onSelectAuction={handleSelectAuction}
      />
    );
  };

  if (loading) {
    return (
      <PageShell
        subtitle="Preparing your event experience..."
        accent="Event Management"
        subHeader={<EventSubNav eventId={eventId} />}
      >
        <section className="px-4 pb-12 sm:px-5 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <CyberCard className="p-6 md:p-8">
              <p className="font-display text-xl md:text-2xl font-black uppercase text-white">Loading event details...</p>
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
      showFooter={!isAuctionViewportTab}
      hideIntro={isAuctionViewportTab}
    >
      <section className={isAuctionViewportTab ? 'h-[calc(100dvh-8rem)] overflow-hidden px-3 pb-3 pt-2 sm:px-4 lg:px-6 md:h-[calc(100dvh-8.5rem)]' : 'px-4 pb-12 sm:px-5 lg:px-6'}>
        <div className={`mx-auto max-w-7xl ${isAuctionViewportTab ? 'flex h-full min-h-0 flex-col' : ''}`}>
          {/* Dynamic Title */}
          <ContextualPageTitle activeTab={normalizedTab} summary={summary} auction={auction} compact={isAuctionViewportTab} />

          {/* Session Info Bar */}
          <div className={`${isAuctionViewportTab ? 'mb-3 p-2.5 md:p-3' : 'mb-6 p-3 md:p-4'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-white/12 bg-black/35 rounded-lg`}>
            <div className="text-[11px] md:text-xs font-bold tracking-[0.16em] text-white/70 uppercase">
              Current Session: {session?.displayName || 'Guest'} | {session?.role === 'owner' ? 'Owner' : 'Guest'}
            </div>
            <div className={`text-[10px] font-bold tracking-[0.16em] uppercase ${socketConnected ? 'text-green-300' : 'text-yellow-300'}`}>
              Connection: {socketConnected ? 'Live' : 'Reconnecting'}
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
              key={normalizedTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24 }}
              className={isAuctionViewportTab ? 'min-h-0 flex-1' : ''}
            >
              {renderTab()}
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {soldAnnouncement && (
          <SoldAnnouncementPopup
            data={soldAnnouncement}
            onClose={() => setSoldAnnouncement(null)}
          />
        )}
      </AnimatePresence>

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
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5" />
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
