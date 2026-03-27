import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Coins,
  Gavel,
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

const FILTER_STATES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'unsold', label: 'Unsold' },
];

const EventCard = ({ summary, auctionLots }) => {
  const soldCount = auctionLots.filter((lot) => lot.status === 'sold').length;
  const activeCount = auctionLots.filter((lot) => lot.status === 'active').length;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <CyberCard accent className="lg:col-span-3">
        <div className="relative overflow-hidden p-8">
          <div className="absolute -top-16 -left-10 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-primary/12 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black tracking-[0.26em] text-primary uppercase">
              <Calendar className="h-3.5 w-3.5" />
              Live Tournament
            </div>
            <h3 className="mt-6 font-display text-4xl leading-tight font-black uppercase lg:text-5xl">
              {summary.title}
              <span className="block text-primary">{summary.season}</span>
            </h3>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65">
              Streamers can scout players, raise bids in real time, and finalize purchases with a fast command-center workflow.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 bg-black/70 p-4">
                <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">Match Type</p>
                <p className="mt-2 text-lg font-bold text-white">{summary.game} · {summary.mode}</p>
              </div>
              <div className="border border-white/10 bg-black/70 p-4">
                <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">Stream Starts</p>
                <p className="mt-2 text-lg font-bold text-white">{summary.streamStart}</p>
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
          <p className="mt-2 font-display text-3xl font-black text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center border border-primary/40 bg-primary/15">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CyberCard>
  );
};

const TeamGrid = ({ teams }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <img src={team.ownerAvatar} alt={team.ownerName} className="h-14 w-14 rounded-full border-2 border-white/40 object-cover" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/65 uppercase">Owner</p>
              <h3 className="font-display text-xl font-black text-white">{team.ownerName}</h3>
            </div>
          </div>
          <div className="relative mt-6 rounded-full border border-amber-200/20 bg-amber-300 px-4 py-2 text-center font-display text-lg font-black text-zinc-900">
            {team.name}
          </div>
          <div className="relative mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {team.roster.map((avatar) => (
                <img key={avatar} src={avatar} alt="Team player" className="h-10 w-10 rounded-full border border-white/40 object-cover" />
              ))}
            </div>
            <div className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-right">
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
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="border-y border-primary/60 bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 font-display text-xl font-black text-zinc-950 uppercase">
          {player.name}
        </div>
        <div className="grid grid-cols-3 gap-2 bg-zinc-950 px-4 py-3 text-white">
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Role</p>
            <p className="font-display text-sm font-bold">{player.role}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">NM Coin</p>
            <p className="font-display text-sm font-bold">{player.nmCoin}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">Rank</p>
            <p className="font-display text-sm font-bold">{player.rankPoint}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

const PanelTitle = ({ title }) => (
  <h3 className="font-display text-5xl font-black text-white/95 uppercase lg:text-6xl">{title}</h3>
);

const EventsPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || 'event';

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
    if (!tabIds.includes(activeTab)) {
      navigate('/events/event', { replace: true });
    }
  }, [activeTab, navigate, tabIds]);

  const loadBaseData = async () => {
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
      setSelectedOwnerId(ownerPayload[0]?.id || '');
      setBidAmount(String(auctionPayload.lots[0]?.currentBid || 0));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

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
    try {
      if (!selectedAuctionId || !selectedOwnerId) {
        return;
      }

      await eventsService.placeBid({
        auctionId: selectedAuctionId,
        ownerId: selectedOwnerId,
        amount: Number(bidAmount),
      });
      await refreshBoard();
      showActionState('Bid accepted');
    } catch (bidError) {
      setError(bidError.message || 'Failed to place bid');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await eventsService.markAuctionStatus({
        auctionId: selectedAuctionId,
        status,
      });
      await refreshBoard();
      showActionState(`Player marked as ${status}`);
    } catch (statusError) {
      setError(statusError.message || 'Failed to change status');
    }
  };

  const handleFinalizePurchase = async () => {
    try {
      await eventsService.finalizePurchase({
        auctionId: selectedAuctionId,
        ownerId: selectedOwnerId,
        amount: Number(bidAmount),
      });
      await refreshBoard();
      showActionState('Purchase finalized');
    } catch (purchaseError) {
      setError(purchaseError.message || 'Failed to finalize purchase');
    }
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
        <div className="space-y-7">
          <div className="event-filter-wrap rounded-2xl border border-white/12 p-5">
            <div className="grid gap-4 lg:grid-cols-5">
              <label className="relative flex items-center lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-primary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="text"
                  placeholder="Search player or team"
                  className="h-11 w-full border border-white/20 bg-black/65 pr-4 pl-10 text-sm text-white outline-none transition-colors focus:border-primary/70"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
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
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
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
                className="h-11 border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
              >
                {FILTER_STATES.map((status) => (
                  <option key={status.value} value={status.value} className="bg-zinc-900">
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <PlayerGrid players={players} onSelect={(id) => {
            const matchingLot = auction.lots.find((lot) => lot.playerId === id);
            if (matchingLot) {
              setSelectedAuctionId(matchingLot.id);
              navigate('/events/auction');
            }
          }} />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[220px_1fr_220px]">
          <CyberCard className="p-5">
            <PanelTitle title="Players" />
            <div className="mt-6 space-y-3">
              {auction.lots.map((lot) => {
                const player = playerById[lot.playerId];
                if (!player) {
                  return null;
                }

                const isActive = lot.id === selectedAuctionId;

                return (
                  <button
                    type="button"
                    key={lot.id}
                    onClick={() => {
                      setSelectedAuctionId(lot.id);
                      setBidAmount(String(lot.currentBid));
                    }}
                    className={`relative w-full overflow-hidden rounded-2xl border p-2 text-left transition-all ${
                      isActive
                        ? 'border-primary/70 bg-primary/15'
                        : 'border-white/15 bg-black/45 hover:border-primary/45'
                    }`}
                  >
                    <img src={player.image} alt={player.name} className="h-24 w-full rounded-xl object-cover" />
                    {lot.status !== 'active' && <span className="sold-stamp">{lot.status}</span>}
                    <p className="mt-2 truncate text-xs font-bold tracking-[0.08em] text-white uppercase">{player.name}</p>
                  </button>
                );
              })}
            </div>
          </CyberCard>

          <CyberCard accent className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,0,0.2),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(255,90,0,0.12),transparent_40%)]" />
            <div className="relative p-6 sm:p-10">
              <div className="mb-6 text-center">
                <PanelTitle title={activeTab === 'auction' ? 'Live Auction' : 'Players Buy'} />
              </div>

              {selectedPlayer && (
                <div className="mx-auto max-w-md">
                  <div className="overflow-hidden rounded-4xl border border-white/20 bg-white">
                    <img src={selectedPlayer.image} alt={selectedPlayer.name} className="h-72 w-full object-cover" />
                    <div className="border-t border-primary/70 bg-zinc-950">
                      <div className="bg-red-600 px-4 py-2 text-center font-display text-2xl font-black text-white uppercase">
                        {selectedPlayer.name}
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-4 py-3">
                        <BidMeta label="Role" value={selectedPlayer.role} />
                        <BidMeta label="NM Coin" value={selectedAuction?.currentBid || selectedPlayer.nmCoin} />
                        <BidMeta label="Rank" value={selectedPlayer.rankPoint} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3 text-center">
                    <p className="text-[11px] font-bold tracking-[0.26em] text-white/55 uppercase">Current Bid</p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={bidAmount}
                        onChange={(event) => setBidAmount(event.target.value)}
                        className="h-12 w-full max-w-[220px] border border-white/30 bg-white text-center font-display text-3xl font-black text-zinc-950 outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handlePlaceBid}
                        className="flex h-12 w-12 items-center justify-center border border-white/40 bg-amber-300 text-zinc-900 transition-colors hover:bg-amber-200"
                        aria-label="Place bid"
                      >
                        <Coins className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex justify-center gap-2">
                      {increments.map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          onClick={() => setBidAmount(String(Number(bidAmount || 0) + increment))}
                          className="border border-white/25 bg-black/65 px-3 py-1 text-sm font-bold text-white transition-colors hover:border-primary/60"
                        >
                          +{increment}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 via-orange-500 to-red-500 transition-all"
                      style={{ width: `${Math.min(100, ((selectedAuction?.timeLeft || 0) / (auction.lotDuration || 30)) * 100)}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 font-display text-2xl font-black">
                    <Timer className="h-6 w-6 text-primary" />
                    <span>{String(selectedAuction?.timeLeft || 0).padStart(2, '0')} SEC</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('sold')}
                      className="border border-green-500/50 bg-green-500/10 px-3 py-2 text-xs font-bold tracking-[0.2em] text-green-300 uppercase"
                    >
                      Mark Sold
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('unsold')}
                      className="border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-xs font-bold tracking-[0.2em] text-yellow-300 uppercase"
                    >
                      Mark Unsold
                    </button>
                    {activeTab === 'players-buy' && (
                      <button
                        type="button"
                        onClick={handleFinalizePurchase}
                        className="border border-primary/60 bg-primary/20 px-3 py-2 text-xs font-bold tracking-[0.2em] text-primary uppercase"
                      >
                        Finalize Purchase
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CyberCard>

          <CyberCard className="p-5">
            <PanelTitle title="Owner" />
            <div className="mt-6 space-y-3">
              {owners.map((owner) => {
                const isSelected = owner.id === selectedOwnerId;
                const auctionHolder = selectedOwner?.id === owner.id;

                return (
                  <button
                    type="button"
                    key={owner.id}
                    onClick={() => setSelectedOwnerId(owner.id)}
                    className={`w-full overflow-hidden rounded-2xl border p-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary/70 bg-primary/15'
                        : 'border-white/15 bg-black/45 hover:border-primary/45'
                    }`}
                  >
                    <img src={owner.avatar} alt={owner.name} className="h-24 w-full rounded-xl object-cover" />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold tracking-[0.08em] text-white uppercase">{owner.name}</p>
                      {auctionHolder && <span className="rounded border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-primary uppercase">Top</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CyberCard>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <PageShell
        title="Events"
        subtitle="Loading streamer command center..."
        accent="Auction Hub"
        subHeader={<EventSubNav />}
      >
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <CyberCard className="p-8">
              <p className="font-display text-2xl font-black uppercase text-white">Preparing Live Board...</p>
            </CyberCard>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Events"
      subtitle="Streamer auction command center for scouting players, bidding, and closing purchases with route-based workflow tabs."
      accent="Auction Hub"
      subHeader={<EventSubNav />}
    >
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {EVENT_ROUTE_TABS.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-md border px-3 py-1.5 text-[10px] font-bold tracking-[0.22em] uppercase transition-colors ${
                    isActive
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-white/20 text-white/65 hover:border-primary/40 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

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

      <AnimatePresence>
        {(error || actionState) && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-5 bottom-5 z-50 max-w-sm"
          >
            <div className={`border px-4 py-3 text-sm ${error ? 'border-red-500/60 bg-red-500/10 text-red-200' : 'border-green-500/60 bg-green-500/10 text-green-200'}`}>
              <div className="flex items-start gap-2">
                {error ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                <span>{error || actionState}</span>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

const BidMeta = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[9px] font-bold tracking-[0.16em] text-white/45 uppercase">{label}</p>
    <p className="font-display text-base font-black text-white">{value}</p>
  </div>
);

export default EventsPage;
