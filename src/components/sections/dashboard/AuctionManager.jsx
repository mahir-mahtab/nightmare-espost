import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Users, DollarSign, Clock, Gavel, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../../../services/api.js';
import wsService from '../../../services/websocket.js';

const AuctionManager = ({ event }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [auctionState, setAuctionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('auction');
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  
  const auctionTimerRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    loadInitialData();
    
    // Connect to WebSocket
    wsService.connect(event._id);
    
    // Subscribe to real-time updates
    wsService.onAuctionUpdate((data) => {
      setAuctionState(data);
    });

    wsService.onBidPlaced((data) => {
      setAuctionState(prev => ({
        ...prev,
        currentBid: data.amount,
        currentBidder: data.teamId,
        bids: [...(prev.bids || []), data]
      }));
    });

    wsService.onAuctionStart((data) => {
      setAuctionState(data);
      startTimer(data.duration || 60);
    });

    wsService.onAuctionEnd((data) => {
      setAuctionState(data);
      stopTimer();
      loadInitialData(); // Refresh to get updated player/team data
    });

    wsService.onTeamUpdate(() => {
      loadTeams();
    });

    wsService.onPlayerUpdate(() => {
      loadPlayers();
    });

    return () => {
      wsService.removeAllListeners();
      wsService.disconnect();
      stopTimer();
    };
  }, [event._id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPlayers(),
        loadTeams(),
        loadAuctionState()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const data = await apiService.getPlayers(event._id);
      setPlayers(data.players || []);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await apiService.getTeams(event._id);
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadAuctionState = async () => {
    try {
      const data = await apiService.getAuctionState(event._id);
      setAuctionState(data);
      
      if (data?.isActive && data?.currentPlayer) {
        const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000);
        const remaining = Math.max(0, (data.duration || 60) - elapsed);
        startTimer(remaining);
      }
    } catch (error) {
      console.error('Failed to load auction state:', error);
    }
  };

  const startTimer = (duration) => {
    stopTimer();
    setTimeRemaining(duration);
    
    auctionTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (auctionTimerRef.current) {
      clearInterval(auctionTimerRef.current);
      auctionTimerRef.current = null;
    }
    setTimeRemaining(0);
  };

  const handleStartAuction = async (player) => {
    try {
      await apiService.startAuction(event._id, player._id);
      wsService.emitStartAuction(player._id);
    } catch (error) {
      alert(`Failed to start auction: ${error.message}`);
    }
  };

  const handleEndAuction = async () => {
    try {
      await apiService.endAuction(event._id);
      wsService.emitEndAuction();
    } catch (error) {
      alert(`Failed to end auction: ${error.message}`);
    }
  };

  const handleResetAuction = async () => {
    if (!confirm('Are you sure you want to reset the auction? This will clear all bids and sold players.')) {
      return;
    }
    
    try {
      await apiService.resetAuction(event._id);
      wsService.emitResetAuction();
      loadInitialData();
    } catch (error) {
      alert(`Failed to reset auction: ${error.message}`);
    }
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const getAvailablePlayers = () => {
    return players.filter(p => !p.teamId && p._id !== auctionState?.currentPlayer?._id);
  };

  const getSoldPlayers = () => {
    return players.filter(p => p.teamId);
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.teamId === teamId);
  };

  const getTeamSpent = (team) => {
    const teamPlayers = getTeamPlayers(team._id);
    return teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
  };

  const getTeamRemaining = (team) => {
    return (event.pursePerTeam || 1000000) - getTeamSpent(team);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex gap-2 border-b-2 border-white/10 pb-2">
        <button
          onClick={() => setActiveView('auction')}
          className={`px-4 py-2 font-bold transition-colors ${
            activeView === 'auction' ? 'bg-primary text-black' : 'text-white/70 hover:text-white'
          }`}
        >
          LIVE AUCTION
        </button>
        <button
          onClick={() => setActiveView('teams')}
          className={`px-4 py-2 font-bold transition-colors ${
            activeView === 'teams' ? 'bg-primary text-black' : 'text-white/70 hover:text-white'
          }`}
        >
          TEAMS OVERVIEW
        </button>
      </div>

      {/* Auction View */}
      {activeView === 'auction' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Auction Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Player on Auction */}
            {auctionState?.isActive && auctionState?.currentPlayer ? (
              <div className="brutal-border bg-gradient-to-br from-primary/20 to-black/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-primary mb-1">PLAYER ON AUCTION</p>
                    <h3 className="text-3xl font-black text-white">{auctionState.currentPlayer.name}</h3>
                    <p className="text-white/60">{auctionState.currentPlayer.role || 'All-Rounder'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className={`text-3xl font-black ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeRemaining}s
                      </span>
                    </div>
                    <p className="text-xs text-white/60">TIME REMAINING</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/30 p-4">
                    <p className="text-xs font-bold text-white/60 mb-1">BASE PRICE</p>
                    <p className="text-xl font-black text-primary">
                      {formatCurrency(auctionState.currentPlayer.basePrice || 100000)}
                    </p>
                  </div>
                  <div className="bg-black/30 p-4">
                    <p className="text-xs font-bold text-white/60 mb-1">CURRENT BID</p>
                    <p className="text-xl font-black text-green-400">
                      {formatCurrency(auctionState.currentBid || auctionState.currentPlayer.basePrice)}
                    </p>
                  </div>
                </div>

                {auctionState.currentBidder && (
                  <div className="bg-black/30 p-4 mb-6">
                    <p className="text-xs font-bold text-white/60 mb-1">LEADING TEAM</p>
                    <p className="text-lg font-black text-white">
                      {teams.find(t => t._id === auctionState.currentBidder)?.name || 'Unknown'}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleEndAuction}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-black transition-colors"
                  >
                    <Gavel className="w-5 h-5" />
                    <span>SOLD!</span>
                  </button>
                  <button
                    onClick={handleEndAuction}
                    className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition-colors"
                  >
                    UNSOLD
                  </button>
                </div>
              </div>
            ) : (
              <div className="brutal-border bg-black/30 p-12 text-center">
                <Gavel className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 font-bold mb-2">NO ACTIVE AUCTION</p>
                <p className="text-white/40 text-sm">Select a player from the list to start bidding</p>
              </div>
            )}

            {/* Recent Bids */}
            {auctionState?.bids && auctionState.bids.length > 0 && (
              <div className="brutal-border bg-black/30 p-6">
                <h4 className="text-lg font-black text-white mb-4">RECENT BIDS</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auctionState.bids.slice().reverse().slice(0, 10).map((bid, idx) => {
                    const team = teams.find(t => t._id === bid.teamId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-black/30">
                        <span className="text-white font-bold">{team?.name || 'Unknown Team'}</span>
                        <span className="text-primary font-black">{formatCurrency(bid.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Available Players List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-white">AVAILABLE PLAYERS</h4>
              <button
                onClick={handleResetAuction}
                className="p-2 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Reset Auction"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="brutal-border bg-black/30 p-4 max-h-[600px] overflow-y-auto">
              {getAvailablePlayers().length === 0 ? (
                <p className="text-white/40 text-center py-8">No players available</p>
              ) : (
                <div className="space-y-2">
                  {getAvailablePlayers().map((player) => (
                    <div
                      key={player._id}
                      className="p-3 bg-black/30 hover:bg-black/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-white">{player.name}</p>
                          <p className="text-xs text-white/60">{player.role || 'All-Rounder'}</p>
                        </div>
                        <button
                          onClick={() => handleStartAuction(player)}
                          disabled={auctionState?.isActive}
                          className="p-2 bg-primary/20 hover:bg-primary/30 text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Start Auction"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-primary font-bold">
                        Base: {formatCurrency(player.basePrice || 100000)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sold Players Count */}
            <div className="bg-black/30 p-4">
              <p className="text-xs text-white/60 mb-1">AUCTION PROGRESS</p>
              <p className="text-2xl font-black text-white">
                {getSoldPlayers().length} / {players.length}
              </p>
              <div className="mt-2 h-2 bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(getSoldPlayers().length / players.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teams Overview */}
      {activeView === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => {
            const teamPlayers = getTeamPlayers(team._id);
            const spent = getTeamSpent(team);
            const remaining = getTeamRemaining(team);
            const isExpanded = expandedTeams.has(team._id);

            return (
              <div key={team._id} className="brutal-border bg-black/30">
                <div
                  className="p-6 cursor-pointer hover:bg-black/50 transition-colors"
                  onClick={() => toggleTeamExpand(team._id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{team.name}</h3>
                      <p className="text-sm text-white/60">{team.ownerName || 'Team Owner'}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-white/60" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-white/60" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-white/60 mb-1">PLAYERS</p>
                      <p className="text-lg font-black text-primary">
                        {teamPlayers.length} / {event.maxPlayersPerTeam || 11}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">SPENT</p>
                      <p className="text-lg font-black text-red-400">
                        {formatCurrency(spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">REMAINING</p>
                      <p className="text-lg font-black text-green-400">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Purse Bar */}
                  <div className="mt-4 h-2 bg-black/50 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(spent / (event.pursePerTeam || 1000000)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Team Players List */}
                {isExpanded && (
                  <div className="border-t-2 border-white/10 p-6 bg-black/20">
                    {teamPlayers.length === 0 ? (
                      <p className="text-white/40 text-center py-4">No players yet</p>
                    ) : (
                      <div className="space-y-2">
                        {teamPlayers.map((player) => (
                          <div key={player._id} className="flex items-center justify-between p-3 bg-black/30">
                            <div>
                              <p className="font-bold text-white">{player.name}</p>
                              <p className="text-xs text-white/60">{player.role || 'All-Rounder'}</p>
                            </div>
                            <p className="text-primary font-black">{formatCurrency(player.soldPrice || 0)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuctionManager;
