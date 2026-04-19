import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Plus,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { config } from '../config.js';

const API_URL = `${config.apiUrl}/admin`;
const AUCTION_API_URL = `${config.apiUrl}/auction`;

const EVENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'edit', label: 'Edit Event' },
  { id: 'owners', label: 'Owners' },
  { id: 'teams', label: 'Teams' },
  { id: 'players', label: 'Players' },
  { id: 'lots', label: 'Auction Lots' },
];

const toText = (value) => (value == null ? '' : String(value));
const toOptional = (value) => {
  const text = toText(value).trim();
  return text ? text : undefined;
};

const toLocalDateTimeInput = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const apiErrorMessage = (payload, fallbackMessage) => {
  const baseMessage = payload?.message || fallbackMessage;

  if (Array.isArray(payload?.details) && payload.details.length > 0) {
    const first = payload.details[0];
    if (first?.path && first?.message) {
      return `${baseMessage} (${first.path}: ${first.message})`;
    }
  }

  if (payload?.code) {
    return `${baseMessage} [${payload.code}]`;
  }

  return baseMessage;
};

const EVENT_SLUG_REGEX = /^[a-z0-9-]{3,100}$/;
const PERSON_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,99}$/;
const TEAM_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s&.'-]{1,99}$/;
const PLAYER_ROLE_REGEX = /^[A-Za-z][A-Za-z0-9\s/-]{0,39}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isIntInRange = (value, min, max) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= min && numeric <= max;
};

const validateEventForm = (formData) => {
  if (!EVENT_SLUG_REGEX.test(toText(formData.slug).trim())) {
    return 'Slug must be 3-100 chars (lowercase letters, numbers, hyphens).';
  }
  if (toText(formData.title).trim().length < 3 || toText(formData.title).trim().length > 255) {
    return 'Title must be 3-255 characters.';
  }
  if (toText(formData.game).trim().length < 2 || toText(formData.game).trim().length > 100) {
    return 'Game must be 2-100 characters.';
  }
  if (toText(formData.password).length < 4 || toText(formData.password).length > 50) {
    return 'Password must be 4-50 characters.';
  }
  if (!isIntInRange(formData.registrationCount, 0, 100000)) {
    return 'Registrations must be a whole number between 0 and 100000.';
  }
  if (!isIntInRange(formData.maxSlots, 0, 100000)) {
    return 'Max slots must be a whole number between 0 and 100000.';
  }
  if (!isIntInRange(formData.auctionWindowSeconds, 10, 300)) {
    return 'Auction window must be a whole number between 10 and 300 seconds.';
  }
  if (!isValidUrl(toOptional(formData.bannerUrl))) {
    return 'Banner URL must be a valid URL.';
  }
  if (!isValidUrl(toOptional(formData.sponsorImageUrl))) {
    return 'Sponsor image URL must be a valid URL.';
  }

  return '';
};

const validateOwnerForm = (formData, requirePassword) => {
  if (!PERSON_NAME_REGEX.test(toText(formData.name).trim())) {
    return 'Owner name format is invalid.';
  }

  if (!EMAIL_REGEX.test(toText(formData.email).trim().toLowerCase())) {
    return 'Owner email format is invalid.';
  }

  const password = toText(formData.password);
  if (requirePassword && (password.length < 4 || password.length > 100)) {
    return 'Owner password must be 4-100 characters.';
  }
  if (!requirePassword && password && (password.length < 4 || password.length > 100)) {
    return 'Owner password must be 4-100 characters.';
  }

  if (!isValidUrl(toOptional(formData.avatarUrl))) {
    return 'Avatar URL must be a valid URL.';
  }

  return '';
};

const validateTeamForm = (formData) => {
  if (!TEAM_NAME_REGEX.test(toText(formData.name).trim())) {
    return 'Team name format is invalid.';
  }
  if (!UUID_REGEX.test(toText(formData.ownerId))) {
    return 'Please select a valid owner.';
  }
  if (!isIntInRange(formData.coinsLeft, 0, 100000)) {
    return 'Coins left must be a whole number between 0 and 100000.';
  }

  return '';
};

const validatePlayerForm = (formData) => {
  const name = toText(formData.name).trim();
  if (name.length < 2 || name.length > 255) {
    return 'Player name must be 2-255 characters.';
  }
  if (!EMAIL_REGEX.test(toText(formData.email).trim().toLowerCase())) {
    return 'Player email format is invalid.';
  }
  if (!PLAYER_ROLE_REGEX.test(toText(formData.role).trim())) {
    return 'Player role format is invalid.';
  }
  if (!isIntInRange(formData.rankPoint, 0, 100)) {
    return 'Rank point must be a whole number between 0 and 100.';
  }
  if (!isIntInRange(formData.basePrice, 0, 100000)) {
    return 'Base price must be a whole number between 0 and 100000.';
  }
  if (formData.finalPrice !== '' && formData.finalPrice !== null && formData.finalPrice !== undefined && !isIntInRange(formData.finalPrice, 0, 100000)) {
    return 'Final price must be a whole number between 0 and 100000.';
  }
  if (!isValidUrl(toOptional(formData.imageUrl))) {
    return 'Player image URL must be a valid URL.';
  }

  return '';
};

const validateLotForm = (formData) => {
  if (!UUID_REGEX.test(toText(formData.playerId))) {
    return 'Please select a valid player.';
  }
  if (!['PENDING', 'ACTIVE', 'SOLD', 'UNSOLD'].includes(toText(formData.status))) {
    return 'Lot status is invalid.';
  }
  if (!isIntInRange(formData.lotOrder, 1, 10000)) {
    return 'Lot order must be a whole number between 1 and 10000.';
  }
  const endsAt = toText(formData.endsAt).trim();
  if (endsAt && Number.isNaN(Date.parse(endsAt))) {
    return 'Ends at must be a valid datetime.';
  }

  return '';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin-token');

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [eventData, setEventData] = useState(null);
  const [loadingEventData, setLoadingEventData] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkType, setBulkType] = useState('owners');
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveAuctionState, setLiveAuctionState] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedEvent = useMemo(
    () => events.find((evt) => evt.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setError('');

      const response = await fetch(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin-token');
          navigate('/admin/login');
          return;
        }
        throw new Error(apiErrorMessage(payload, 'Unable to load events'));
      }

      const list = payload.data || [];
      setEvents(list);

      if (!selectedEventId && list.length > 0) {
        setSelectedEventId(list[0].id);
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load events');
    } finally {
      setLoadingEvents(false);
    }
  }, [token, navigate, selectedEventId]);

  const fetchEventFull = useCallback(async (eventId) => {
    if (!eventId) {
      setEventData(null);
      return;
    }

    try {
      setLoadingEventData(true);
      setError('');

      const response = await fetch(`${API_URL}/events/${eventId}/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin-token');
          navigate('/admin/login');
          return;
        }
        throw new Error(apiErrorMessage(payload, 'Unable to load event details'));
      }

      setEventData(payload.data);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load event details');
    } finally {
      setLoadingEventData(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchEvents();
  }, [token, navigate, fetchEvents]);

  useEffect(() => {
    setMessage('');
    if (selectedEventId) {
      fetchEventFull(selectedEventId);
    }
  }, [selectedEventId, fetchEventFull]);

  useEffect(() => {
    if (!token) {
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
        token,
      },
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      if (selectedEventId) {
        socket.emit('join_admin_event', { eventId: selectedEventId });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    socket.on('auction_state', (state) => {
      if (!state || !selectedEventId || state.eventId !== selectedEventId) {
        return;
      }

      setLiveAuctionState(state);
    });

    socket.on('auction_error', (payload) => {
      setError(payload?.message || 'Live connection interrupted');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedEventId]);

  useEffect(() => {
    setLiveAuctionState(null);
  }, [selectedEventId]);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    navigate('/admin/login');
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event permanently? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      setMessage('');

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to delete event'));
      }

      setMessage('Event deleted successfully');
      if (selectedEventId === eventId) {
        setSelectedEventId('');
        setEventData(null);
      }
      fetchEvents();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete event');
    }
  };

  return (
    <PageShell accent="Admin Dashboard" showNavbar={false}>
      <section className="px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black uppercase text-white md:text-5xl">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-white/60">Manage event operations and live auction controls</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded border px-3 py-2 text-[10px] font-bold tracking-[0.16em] uppercase ${socketConnected ? 'border-green-400/50 bg-green-500/10 text-green-300' : 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300'}`}>
                Connection: {socketConnected ? 'Live' : 'Reconnecting'}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded border border-primary bg-primary px-4 py-2.5 text-sm font-bold uppercase text-black transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
              <button
                onClick={fetchEvents}
                className="inline-flex items-center gap-2 rounded border border-white/30 bg-black/50 px-4 py-2.5 text-sm font-bold uppercase text-white transition-all hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded border border-white/30 bg-black/50 px-4 py-2.5 text-sm font-bold uppercase text-white transition-all hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {error && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </Motion.div>
          )}

          {message && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            </Motion.div>
          )}

          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <CyberCard className="p-4">
              <p className="mb-3 text-xs font-bold tracking-[0.2em] text-white/60 uppercase">Events</p>
              {loadingEvents ? (
                <p className="text-sm text-white/60">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-white/60">No events available yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`w-full rounded border px-3 py-2 text-left transition-all ${
                        selectedEventId === evt.id
                          ? 'border-primary bg-primary/15 text-white'
                          : 'border-white/15 bg-black/40 text-white/80 hover:border-white/40'
                      }`}
                    >
                      <p className="text-sm font-bold uppercase">{evt.title}</p>
                      <p className="mt-1 text-[11px] text-white/50">/{evt.slug}</p>
                    </button>
                  ))}
                </div>
              )}
            </CyberCard>

            <CyberCard className="p-4 md:p-6">
              {!selectedEvent ? (
                <p className="text-sm text-white/60">Select an event to open its admin panel.</p>
              ) : loadingEventData || !eventData ? (
                <p className="text-sm text-white/60">Loading event details...</p>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-3xl font-black uppercase text-white">{eventData.title}</h2>
                      <p className="mt-1 text-xs text-white/60">/{eventData.slug} | {eventData.status}</p>
                      {liveAuctionState && (
                        <p className="mt-1 text-[11px] text-primary/80">
                          Live Auction: {liveAuctionState.activeLotId ? `Lot ${liveAuctionState.activeLotId}` : 'No active lot'} | Time Left: {Number(liveAuctionState.timeLeft || 0)}s
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setBulkType('owners');
                          setShowBulkUploadModal(true);
                        }}
                        className="rounded border border-primary/50 bg-primary/10 px-3 py-2 text-xs font-bold uppercase text-primary hover:bg-primary/20"
                      >
                        Bulk Upload
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(eventData.id)}
                        className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase text-red-300 hover:bg-red-500/20"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {EVENT_TABS.map((tabItem) => (
                      <button
                        key={tabItem.id}
                        onClick={() => setActiveTab(tabItem.id)}
                        className={`rounded border px-3 py-1.5 text-xs font-bold uppercase ${
                          activeTab === tabItem.id
                            ? 'border-primary bg-primary text-black'
                            : 'border-white/20 bg-black/40 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'overview' && <OverviewTab eventData={eventData} />}
                  {activeTab === 'edit' && (
                    <EditEventTab
                      eventData={eventData}
                      token={token}
                      onSaved={async (savedMessage) => {
                        setMessage(savedMessage);
                        await fetchEvents();
                        await fetchEventFull(eventData.id);
                      }}
                      onError={setError}
                    />
                  )}
                  {activeTab === 'owners' && (
                    <OwnersTab
                      owners={eventData.owners || []}
                      eventId={eventData.id}
                      token={token}
                      onError={setError}
                      onChanged={async (doneMessage) => {
                        setMessage(doneMessage);
                        await fetchEventFull(eventData.id);
                      }}
                    />
                  )}
                  {activeTab === 'teams' && (
                    <TeamsTab
                      teams={eventData.teams || []}
                      owners={eventData.owners || []}
                      eventId={eventData.id}
                      token={token}
                      onError={setError}
                      onChanged={async (doneMessage) => {
                        setMessage(doneMessage);
                        await fetchEventFull(eventData.id);
                      }}
                    />
                  )}
                  {activeTab === 'players' && (
                    <PlayersTab
                      players={eventData.players || []}
                      teams={eventData.teams || []}
                      eventId={eventData.id}
                      token={token}
                      onError={setError}
                      onChanged={async (doneMessage) => {
                        setMessage(doneMessage);
                        await fetchEventFull(eventData.id);
                      }}
                    />
                  )}
                  {activeTab === 'lots' && (
                    <LotsTab
                      lots={eventData.auctionLots || []}
                      runtime={eventData.auctionRuntime || null}
                      players={eventData.players || []}
                      owners={eventData.owners || []}
                      eventId={eventData.id}
                      token={token}
                      onError={setError}
                      onChanged={async (doneMessage) => {
                        setMessage(doneMessage);
                        await fetchEventFull(eventData.id);
                      }}
                    />
                  )}
                </>
              )}
            </CyberCard>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <CreateEventModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (createdId) => {
            setShowCreateModal(false);
            setMessage('Event created successfully');
            await fetchEvents();
            if (createdId) {
              setSelectedEventId(createdId);
            }
          }}
          onError={setError}
        />
      )}

      {showBulkUploadModal && selectedEvent && (
        <BulkUploadModal
          eventId={selectedEvent.id}
          initialType={bulkType}
          token={token}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={async (doneMessage) => {
            setShowBulkUploadModal(false);
            setMessage(doneMessage);
            await fetchEventFull(selectedEvent.id);
            await fetchEvents();
          }}
          onError={setError}
        />
      )}
    </PageShell>
  );
};

const OverviewTab = ({ eventData }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Metric label="Status" value={toText(eventData.status)} />
    <Metric label="Game / Mode" value={`${toText(eventData.game)} / ${toText(eventData.mode) || '-'}`} />
    <Metric label="Teams / Owners" value={`${eventData._count?.teams || 0} / ${eventData._count?.owners || 0}`} />
    <Metric label="Players / Lots" value={`${eventData._count?.players || 0} / ${eventData._count?.auctionLots || 0}`} />
    <Metric label="Registrations" value={toText(eventData.registrationCount)} />
    <Metric label="Max Slots" value={toText(eventData.maxSlots)} />
    <Metric label="Auction Window" value={`${toText(eventData.auctionWindowSeconds)}s`} />
    <Metric label="Stream Start" value={toText(eventData.streamStartTime) || '-'} />
  </div>
);

const EditEventTab = ({ eventData, token, onSaved, onError }) => {
  const [formData, setFormData] = useState({
    slug: toText(eventData.slug),
    title: toText(eventData.title),
    season: toText(eventData.season),
    game: toText(eventData.game),
    mode: toText(eventData.mode),
    password: toText(eventData.password),
    registrationCount: Number(eventData.registrationCount || 0),
    maxSlots: Number(eventData.maxSlots || 0),
    streamStartTime: toText(eventData.streamStartTime),
    auctionWindowSeconds: Number(eventData.auctionWindowSeconds || 30),
    bannerUrl: toText(eventData.bannerUrl),
    sponsorImageUrl: toText(eventData.sponsorImageUrl),
    status: toText(eventData.status || 'UPCOMING'),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      slug: toText(eventData.slug),
      title: toText(eventData.title),
      season: toText(eventData.season),
      game: toText(eventData.game),
      mode: toText(eventData.mode),
      password: toText(eventData.password),
      registrationCount: Number(eventData.registrationCount || 0),
      maxSlots: Number(eventData.maxSlots || 0),
      streamStartTime: toText(eventData.streamStartTime),
      auctionWindowSeconds: Number(eventData.auctionWindowSeconds || 30),
      bannerUrl: toText(eventData.bannerUrl),
      sponsorImageUrl: toText(eventData.sponsorImageUrl),
      status: toText(eventData.status || 'UPCOMING'),
    });
  }, [eventData]);

  const handleSave = async (e) => {
    e.preventDefault();
    onError('');

    const validationMessage = validateEventForm(formData);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        season: toOptional(formData.season),
        game: formData.game.trim(),
        mode: toOptional(formData.mode),
        password: formData.password,
        registrationCount: Number(formData.registrationCount),
        maxSlots: Number(formData.maxSlots),
        streamStartTime: toOptional(formData.streamStartTime),
        auctionWindowSeconds: Number(formData.auctionWindowSeconds),
        bannerUrl: toOptional(formData.bannerUrl),
        sponsorImageUrl: toOptional(formData.sponsorImageUrl),
        status: formData.status,
      };

      const response = await fetch(`${API_URL}/events/${eventData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(result, 'Unable to update event'));
      }

      onSaved('Event updated successfully');
    } catch (saveError) {
      onError(saveError.message || 'Unable to update event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" value={formData.slug} onChange={(v) => setFormData({ ...formData, slug: v })} required />
        <Field label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Game" value={formData.game} onChange={(v) => setFormData({ ...formData, game: v })} required />
        <Field label="Mode" value={formData.mode} onChange={(v) => setFormData({ ...formData, mode: v })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Season" value={formData.season} onChange={(v) => setFormData({ ...formData, season: v })} />
        <Field label="Password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Registrations" value={formData.registrationCount} onChange={(v) => setFormData({ ...formData, registrationCount: v })} />
        <NumberField label="Max Slots" value={formData.maxSlots} onChange={(v) => setFormData({ ...formData, maxSlots: v })} />
        <NumberField label="Auction Window (s)" value={formData.auctionWindowSeconds} onChange={(v) => setFormData({ ...formData, auctionWindowSeconds: v })} />
        <label className="block text-xs font-bold uppercase text-white/70">
          Status
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-2 h-10 w-full rounded border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="UPCOMING">UPCOMING</option>
            <option value="LIVE">LIVE</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stream Start Time" value={formData.streamStartTime} onChange={(v) => setFormData({ ...formData, streamStartTime: v })} />
        <Field label="Banner URL" value={formData.bannerUrl} onChange={(v) => setFormData({ ...formData, bannerUrl: v })} />
      </div>

      <Field label="Sponsor Image URL" value={formData.sponsorImageUrl} onChange={(v) => setFormData({ ...formData, sponsorImageUrl: v })} />

      <button
        type="submit"
        disabled={saving}
        className="rounded border border-primary bg-primary px-4 py-2 text-sm font-bold uppercase text-black hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Event'}
      </button>
    </form>
  );
};

const OwnersTab = ({ owners, eventId, token, onError, onChanged }) => {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', avatarUrl: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', avatarUrl: '' });

  const handleCreate = async () => {
    onError('');

    const validationMessage = validateOwnerForm(createForm, true);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          avatarUrl: createForm.avatarUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to create owner'));
      }
      setCreateForm({ name: '', email: '', password: '', avatarUrl: '' });
      onChanged('Owner created successfully');
    } catch (err) {
      onError(err.message || 'Unable to create owner');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (owner) => {
    setEditingId(owner.id);
    setEditForm({ name: owner.name || '', email: owner.email || '', password: '', avatarUrl: owner.avatarUrl || '' });
  };

  const handleUpdate = async (ownerId) => {
    onError('');

    const validationMessage = validateOwnerForm(editForm, false);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/owner/${ownerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email.trim().toLowerCase(),
          ...(editForm.password.trim() ? { password: editForm.password } : {}),
          avatarUrl: editForm.avatarUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to update owner'));
      }
      setEditingId('');
      onChanged('Owner updated successfully');
    } catch (err) {
      onError(err.message || 'Unable to update owner');
    }
  };

  const handleDelete = async (ownerId) => {
    if (!confirm('Delete this owner?')) {
      return;
    }

    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/owner/${ownerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to delete owner'));
      }
      onChanged('Owner deleted successfully');
    } catch (err) {
      onError(err.message || 'Unable to delete owner');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-5">
        <input
          type="text"
          value={createForm.name}
          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          placeholder="Owner name"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <input
          type="email"
          value={createForm.email}
          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          placeholder="Owner email"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <input
          type="password"
          value={createForm.password}
          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          placeholder="Owner password"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <input
          type="text"
          value={createForm.avatarUrl}
          onChange={(e) => setCreateForm({ ...createForm, avatarUrl: e.target.value })}
          placeholder="Avatar URL (optional)"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={creating || !createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()}
          onClick={handleCreate}
          className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Add Owner'}
        </button>
      </div>

      <DataTable
        columns={['Owner ID', 'Name', 'Email', 'Owner Password', 'Avatar URL', 'Actions']}
        rows={owners.map((owner) => [
          owner.id,
          editingId === owner.id ? (
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary"
            />
          ) : owner.name,
          editingId === owner.id ? (
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary"
            />
          ) : (owner.email || '-'),
          editingId === owner.id ? (
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Leave blank to keep"
              className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary"
            />
          ) : '********',
          editingId === owner.id ? (
            <input
              value={editForm.avatarUrl}
              onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
              className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary"
            />
          ) : (owner.avatarUrl || '-'),
          editingId === owner.id ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleUpdate(owner.id)} className="rounded border border-primary/60 px-2 py-1 text-[10px] font-bold uppercase text-primary">Save</button>
              <button type="button" onClick={() => setEditingId('')} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(owner)} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Edit</button>
              <button type="button" onClick={() => handleDelete(owner.id)} className="rounded border border-red-500/50 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Delete</button>
            </div>
          ),
        ])}
        emptyText="No owners uploaded yet."
      />
    </div>
  );
};

const TeamsTab = ({ teams, owners, eventId, token, onError, onChanged }) => {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', ownerId: owners[0]?.id || '', coinsLeft: 0 });
  const [editForm, setEditForm] = useState({ name: '', ownerId: '', coinsLeft: 0 });

  useEffect(() => {
    if (!createForm.ownerId && owners[0]?.id) {
      setCreateForm((prev) => ({ ...prev, ownerId: owners[0].id }));
    }
  }, [owners, createForm.ownerId]);

  const handleCreate = async () => {
    onError('');

    const validationMessage = validateTeamForm(createForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          ownerId: createForm.ownerId,
          coinsLeft: Number(createForm.coinsLeft),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to create team'));
      }
      setCreateForm({ name: '', ownerId: owners[0]?.id || '', coinsLeft: 0 });
      onChanged('Team created successfully');
    } catch (err) {
      onError(err.message || 'Unable to create team');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (team) => {
    setEditingId(team.id);
    setEditForm({
      name: team.name || '',
      ownerId: team.ownerId || owners[0]?.id || '',
      coinsLeft: Number(team.coinsLeft || 0),
    });
  };

  const handleUpdate = async (teamId) => {
    onError('');

    const validationMessage = validateTeamForm(editForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/team/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          ownerId: editForm.ownerId,
          coinsLeft: Number(editForm.coinsLeft),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to update team'));
      }
      setEditingId('');
      onChanged('Team updated successfully');
    } catch (err) {
      onError(err.message || 'Unable to update team');
    }
  };

  const handleDelete = async (teamId) => {
    if (!confirm('Delete this team?')) {
      return;
    }
    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/team/${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to delete team'));
      }
      onChanged('Team deleted successfully');
    } catch (err) {
      onError(err.message || 'Unable to delete team');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-4">
        <input
          type="text"
          value={createForm.name}
          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          placeholder="Team name"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <select
          value={createForm.ownerId}
          onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        >
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={createForm.coinsLeft}
          onChange={(e) => setCreateForm({ ...createForm, coinsLeft: Number(e.target.value || 0) })}
          placeholder="Coins left"
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={creating || !createForm.name.trim() || !createForm.ownerId}
          onClick={handleCreate}
          className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Add Team'}
        </button>
      </div>

      <DataTable
        columns={['Team ID', 'Team', 'Owner', 'Coins Left', 'Sold Players', 'Actions']}
        rows={teams.map((team) => [
          team.id,
          editingId === team.id ? (
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" />
          ) : team.name,
          editingId === team.id ? (
            <select value={editForm.ownerId} onChange={(e) => setEditForm({ ...editForm, ownerId: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name}</option>
              ))}
            </select>
          ) : (team.owner?.name || '-'),
          editingId === team.id ? (
            <input type="number" value={editForm.coinsLeft} onChange={(e) => setEditForm({ ...editForm, coinsLeft: Number(e.target.value || 0) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" />
          ) : toText(team.coinsLeft),
          toText(team.players?.length || 0),
          editingId === team.id ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleUpdate(team.id)} className="rounded border border-primary/60 px-2 py-1 text-[10px] font-bold uppercase text-primary">Save</button>
              <button type="button" onClick={() => setEditingId('')} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(team)} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Edit</button>
              <button type="button" onClick={() => handleDelete(team.id)} className="rounded border border-red-500/50 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Delete</button>
            </div>
          ),
        ])}
        emptyText="No teams uploaded yet."
      />
    </div>
  );
};

const PlayersTab = ({ players, teams, eventId, token, onError, onChanged }) => {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: '',
    rankPoint: 0,
    basePrice: 0,
    imageUrl: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    rankPoint: 0,
    basePrice: 0,
    imageUrl: '',
    status: 'ACTIVE',
    soldToTeamId: '',
    finalPrice: '',
  });

  const handleCreate = async () => {
    onError('');

    const validationMessage = validatePlayerForm(createForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email.trim().toLowerCase(),
          role: createForm.role,
          rankPoint: Number(createForm.rankPoint),
          basePrice: Number(createForm.basePrice),
          imageUrl: createForm.imageUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to create player'));
      }
      setCreateForm({ name: '', email: '', role: '', rankPoint: 0, basePrice: 0, imageUrl: '' });
      onChanged('Player created successfully');
    } catch (err) {
      onError(err.message || 'Unable to create player');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditForm({
      name: player.name || '',
      email: player.email || '',
      role: player.role || '',
      rankPoint: Number(player.rankPoint || 0),
      basePrice: Number(player.basePrice || 0),
      imageUrl: player.imageUrl || '',
      status: player.status || 'ACTIVE',
      soldToTeamId: player.soldToTeamId || '',
      finalPrice: player.finalPrice == null ? '' : Number(player.finalPrice),
    });
  };

  const handleUpdate = async (playerId) => {
    onError('');

    const validationMessage = validatePlayerForm(editForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/player/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email.trim().toLowerCase(),
          role: editForm.role,
          rankPoint: Number(editForm.rankPoint),
          basePrice: Number(editForm.basePrice),
          imageUrl: editForm.imageUrl || undefined,
          status: editForm.status,
          soldToTeamId: editForm.soldToTeamId || null,
          finalPrice: editForm.finalPrice === '' ? null : Number(editForm.finalPrice),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to update player'));
      }
      setEditingId('');
      onChanged('Player updated successfully');
    } catch (err) {
      onError(err.message || 'Unable to update player');
    }
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Delete this player?')) {
      return;
    }
    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/player/${playerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to delete player'));
      }
      onChanged('Player deleted successfully');
    } catch (err) {
      onError(err.message || 'Unable to delete player');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-6">
        <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Player name" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="Player email" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="text" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} placeholder="Role" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="number" value={createForm.rankPoint} onChange={(e) => setCreateForm({ ...createForm, rankPoint: Number(e.target.value || 0) })} placeholder="Rank" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="number" value={createForm.basePrice} onChange={(e) => setCreateForm({ ...createForm, basePrice: Number(e.target.value || 0) })} placeholder="Base price" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <button type="button" disabled={creating || !createForm.name.trim() || !createForm.email.trim() || !createForm.role.trim()} onClick={handleCreate} className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50">
          {creating ? 'Creating...' : 'Add Player'}
        </button>
      </div>

      <DataTable
        columns={['Player ID', 'Name', 'Email', 'Role', 'Rank', 'Base Price', 'Status', 'Sold Team', 'Final Price', 'Actions']}
        rows={players.map((player) => [
          player.id,
          editingId === player.id ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : player.name,
          editingId === player.id ? <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : (player.email || '-'),
          editingId === player.id ? <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : player.role,
          editingId === player.id ? <input type="number" value={editForm.rankPoint} onChange={(e) => setEditForm({ ...editForm, rankPoint: Number(e.target.value || 0) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : toText(player.rankPoint),
          editingId === player.id ? <input type="number" value={editForm.basePrice} onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value || 0) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : toText(player.basePrice),
          editingId === player.id ? (
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="UNSOLD">UNSOLD</option>
            </select>
          ) : player.status,
          editingId === player.id ? (
            <select value={editForm.soldToTeamId} onChange={(e) => setEditForm({ ...editForm, soldToTeamId: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              <option value="">-</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          ) : (player.soldToTeam?.name || '-'),
          editingId === player.id ? <input type="number" value={editForm.finalPrice} onChange={(e) => setEditForm({ ...editForm, finalPrice: e.target.value === '' ? '' : Number(e.target.value) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : toText(player.finalPrice ?? '-'),
          editingId === player.id ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleUpdate(player.id)} className="rounded border border-primary/60 px-2 py-1 text-[10px] font-bold uppercase text-primary">Save</button>
              <button type="button" onClick={() => setEditingId('')} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(player)} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Edit</button>
              <button type="button" onClick={() => handleDelete(player.id)} className="rounded border border-red-500/50 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Delete</button>
            </div>
          ),
        ])}
        emptyText="No players uploaded yet."
      />
    </div>
  );
};

const LotsTab = ({ lots, runtime, players, owners, eventId, token, onError, onChanged }) => {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [auctionBusy, setAuctionBusy] = useState(false);
  const [autoProgress, setAutoProgress] = useState(Boolean(runtime?.autoProgress));
  const [extendSeconds, setExtendSeconds] = useState(15);
  const [controlLotId, setControlLotId] = useState('');
  const [controlOwnerId, setControlOwnerId] = useState('');
  const [controlAmount, setControlAmount] = useState(0);
  const [createForm, setCreateForm] = useState({
    playerId: players[0]?.id || '',
    status: 'PENDING',
    endsAt: '',
    lotOrder: 1,
  });
  const [editForm, setEditForm] = useState({
    playerId: '',
    status: 'PENDING',
    endsAt: '',
    lotOrder: 1,
  });

  useEffect(() => {
    if (!createForm.playerId && players[0]?.id) {
      setCreateForm((prev) => ({ ...prev, playerId: players[0].id }));
    }
  }, [players, createForm.playerId]);

  useEffect(() => {
    const preferredLot = lots.find((lot) => lot.status === 'ACTIVE') || lots[0];
    if (!controlLotId && preferredLot?.id) {
      setControlLotId(preferredLot.id);
      setControlAmount(Number(preferredLot.currentBid || 0));
      setControlOwnerId(preferredLot.currentOwnerId || owners[0]?.id || '');
    }
  }, [controlLotId, lots, owners]);

  useEffect(() => {
    const selected = lots.find((lot) => lot.id === controlLotId);
    if (!selected) {
      return;
    }

    setControlAmount(Number(selected.currentBid || 0));
    setControlOwnerId(selected.currentOwnerId || owners[0]?.id || '');
  }, [controlLotId, lots, owners]);

  const selectedLot = useMemo(
    () => lots.find((lot) => lot.id === controlLotId) || null,
    [lots, controlLotId]
  );

  const selectedLotStatus = selectedLot?.status || '';
  const isSelectedFinished = selectedLotStatus === 'SOLD' || selectedLotStatus === 'UNSOLD';
  const isSelectedPending = selectedLotStatus === 'PENDING';
  const isAuctionRunning = Boolean(runtime?.isRunning);

  const activeLot = useMemo(
    () => lots.find((lot) => lot.status === 'ACTIVE') || null,
    [lots]
  );

  useEffect(() => {
    setAutoProgress(Boolean(runtime?.autoProgress));
  }, [runtime?.autoProgress]);

  const lotSummary = useMemo(() => ({
    total: lots.length,
    pending: lots.filter((lot) => lot.status === 'PENDING').length,
    active: lots.filter((lot) => lot.status === 'ACTIVE').length,
    sold: lots.filter((lot) => lot.status === 'SOLD').length,
    unsold: lots.filter((lot) => lot.status === 'UNSOLD').length,
  }), [lots]);

  const handleCreate = async () => {
    onError('');

    const validationMessage = validateLotForm(createForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/lot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: createForm.playerId,
          status: createForm.status,
          endsAt: createForm.endsAt || undefined,
          lotOrder: Number(createForm.lotOrder),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to create auction lot'));
      }
      setCreateForm({
        playerId: players[0]?.id || '',
        status: 'PENDING',
        endsAt: '',
        lotOrder: 1,
      });
      onChanged('Auction lot created successfully');
    } catch (err) {
      onError(err.message || 'Unable to create auction lot');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (lot) => {
    setEditingId(lot.id);
    setEditForm({
      playerId: lot.playerId,
      status: lot.status || 'PENDING',
      endsAt: toLocalDateTimeInput(lot.endsAt),
      lotOrder: Number(lot.lotOrder || 1),
    });
  };

  const handleUpdate = async (lotId) => {
    onError('');

    const validationMessage = validateLotForm(editForm);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/lot/${lotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: editForm.playerId,
          status: editForm.status,
          endsAt: editForm.endsAt || null,
          lotOrder: Number(editForm.lotOrder),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to update auction lot'));
      }
      setEditingId('');
      onChanged('Auction lot updated successfully');
    } catch (err) {
      onError(err.message || 'Unable to update auction lot');
    }
  };

  const handleDelete = async (lotId) => {
    if (!confirm('Delete this auction lot?')) {
      return;
    }
    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/lot/${lotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to delete auction lot'));
      }
      onChanged('Auction lot deleted successfully');
    } catch (err) {
      onError(err.message || 'Unable to delete auction lot');
    }
  };

  const callAuctionControl = async (path, body, successMessage) => {
    onError('');
    setAuctionBusy(true);
    try {
      const response = await fetch(`${AUCTION_API_URL}/${eventId}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body || {}),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Auction action could not be completed'));
      }
      onChanged(successMessage);
    } catch (err) {
      onError(err.message || 'Auction action could not be completed');
    } finally {
      setAuctionBusy(false);
    }
  };

  const handleSetAutoProgress = async (nextValue) => {
    onError('');
    setAuctionBusy(true);

    try {
      const response = await fetch(`${AUCTION_API_URL}/${eventId}/runtime`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ autoProgress: nextValue }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to update runtime settings'));
      }

      setAutoProgress(nextValue);
      onChanged(`Auto progress ${nextValue ? 'enabled' : 'disabled'}`);
    } catch (err) {
      onError(err.message || 'Unable to update runtime settings');
    } finally {
      setAuctionBusy(false);
    }
  };

  const handleExtendTimer = async () => {
    onError('');
    setAuctionBusy(true);

    try {
      const response = await fetch(`${AUCTION_API_URL}/${eventId}/extend-timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seconds: Number(extendSeconds) }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to extend active lot timer'));
      }

      onChanged(`Active lot timer extended by ${Number(extendSeconds)}s`);
    } catch (err) {
      onError(err.message || 'Unable to extend active lot timer');
    } finally {
      setAuctionBusy(false);
    }
  };

  const handleFinalizeSold = async () => {
    if (!controlLotId) {
      onError('Please select a lot first');
      return;
    }

    if (!controlOwnerId) {
      onError('Please select the winning owner');
      return;
    }

    if (!controlAmount || Number(controlAmount) <= 0) {
      onError('Enter a valid sold amount');
      return;
    }

    const selectedOwner = owners.find((owner) => owner.id === controlOwnerId);
    const selectedLotName = selectedLot?.player?.name || selectedLot?.playerId || controlLotId;
    const confirmMessage = [
      'Emergency override will bypass normal bidding settlement.',
      `Lot: ${selectedLotName}`,
      `Owner: ${selectedOwner?.name || controlOwnerId}`,
      `Amount: ${Number(controlAmount)}`,
      '',
      'Proceed with emergency override?',
    ].join('\n');

    if (!confirm(confirmMessage)) {
      return;
    }

    onError('');
    setAuctionBusy(true);
    try {
      const response = await fetch(`${AUCTION_API_URL}/${eventId}/lots/${controlLotId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: controlOwnerId,
          amount: Number(controlAmount),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Finalize failed'));
      }

      onChanged('Emergency override applied successfully');
    } catch (err) {
      onError(err.message || 'Emergency override failed');
    } finally {
      setAuctionBusy(false);
    }
  };

  const handleSettleCurrentLot = async () => {
    if (!activeLot) {
      onError('No active lot to settle');
      return;
    }

    const previewOwner = activeLot.currentOwnerName || 'No bids';
    const previewAmount = Number(activeLot.currentBid || 0);
    const previewStatus = activeLot.currentOwnerId ? 'SOLD' : 'UNSOLD';
    const lotName = activeLot.player?.name || activeLot.playerId;

    const confirmMessage = [
      `Settle current lot #${activeLot.lotOrder} (${lotName})?`,
      `Expected Result: ${previewStatus}`,
      `Winning Owner: ${previewOwner}`,
      `Amount: ${previewAmount}`,
      '',
      'This will end bidding for this lot.',
    ].join('\n');

    if (!confirm(confirmMessage)) {
      return;
    }

    await callAuctionControl('/lots/settle-current', {}, 'Current lot settled successfully');
  };

  const handleActivateNextLot = async () => {
    await callAuctionControl('/next-lot', {}, 'Next pending lot activated');
  };

  const handleResetToPending = async () => {
    if (!selectedLot) {
      onError('Please select a lot first');
      return;
    }

    onError('');
    setAuctionBusy(true);
    try {
      const response = await fetch(`${AUCTION_API_URL}/${eventId}/lots/reset-pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lotId: selectedLot.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Unable to reset selected lot'));
      }

      onChanged('Selected lot reset to pending state for re-auction');
    } catch (err) {
      onError(err.message || 'Unable to reset selected lot');
    } finally {
      setAuctionBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded border border-primary/35 bg-[linear-gradient(135deg,rgba(255,87,34,0.14),rgba(0,0,0,0.2))] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-primary uppercase">Auction Command Center</p>
            <h4 className="mt-1 font-display text-lg font-black uppercase text-white">Live Runtime Controls</h4>
          </div>
          <span className={`rounded border px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${auctionBusy ? 'border-amber-300/60 bg-amber-300/15 text-amber-300' : 'border-green-400/40 bg-green-400/10 text-green-300'}`}>
            {auctionBusy ? 'Processing' : 'Ready'}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          <div className="rounded border border-white/20 bg-black/45 px-3 py-2">
            <p className="text-[9px] font-bold tracking-[0.14em] text-white/45 uppercase">Total Lots</p>
            <p className="mt-1 font-display text-base font-black text-white">{lotSummary.total}</p>
          </div>
          <div className="rounded border border-sky-300/30 bg-sky-300/10 px-3 py-2">
            <p className="text-[9px] font-bold tracking-[0.14em] text-sky-200/70 uppercase">Pending</p>
            <p className="mt-1 font-display text-base font-black text-sky-200">{lotSummary.pending}</p>
          </div>
          <div className="rounded border border-primary/40 bg-primary/12 px-3 py-2">
            <p className="text-[9px] font-bold tracking-[0.14em] text-primary/80 uppercase">Active</p>
            <p className="mt-1 font-display text-base font-black text-primary">{lotSummary.active}</p>
          </div>
          <div className="rounded border border-green-400/35 bg-green-400/10 px-3 py-2">
            <p className="text-[9px] font-bold tracking-[0.14em] text-green-300/80 uppercase">Sold</p>
            <p className="mt-1 font-display text-base font-black text-green-300">{lotSummary.sold}</p>
          </div>
          <div className="rounded border border-yellow-300/35 bg-yellow-300/10 px-3 py-2">
            <p className="text-[9px] font-bold tracking-[0.14em] text-yellow-300/85 uppercase">Unsold</p>
            <p className="mt-1 font-display text-base font-black text-yellow-300">{lotSummary.unsold}</p>
          </div>
        </div>

        <div className="mt-3 rounded border border-white/15 bg-black/35 p-2 text-[10px] text-white/70">
          Workflow guardrails: settle current lot first, then activate next lot. Reset to pending refunds sold coins and re-opens the lot for re-auction.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded border border-sky-400/30 bg-sky-500/10 p-3">
          <p className="text-[10px] font-bold tracking-[0.16em] text-sky-200/85 uppercase">Auction Control</p>
          <p className="mt-1 text-xs text-white/65">Start auction (first pending lot), stop auction, and monitor runtime.</p>
          <div className="mt-3 rounded border border-white/20 bg-black/50 p-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/55 uppercase">Current Active Lot</p>
            <p className="mt-1 text-sm font-bold text-white">
              {activeLot ? `#${activeLot.lotOrder} - ${activeLot.player?.name || activeLot.playerId}` : 'No active lot'}
            </p>
            <p className="mt-1 text-xs text-white/65">
              {activeLot ? `Bid: ${activeLot.currentBid || 0} | Time Left: ${activeLot.timeLeft || 0}s` : 'Start auction or activate next lot to begin.'}
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-white/45 uppercase">
              Runtime: {isAuctionRunning ? 'Running' : 'Stopped'}
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={auctionBusy || isAuctionRunning || lotSummary.pending === 0}
              onClick={() => callAuctionControl('/start', { autoProgress }, 'Auction started with first pending lot')}
              className="h-10 rounded border border-sky-300/70 bg-sky-300/20 px-3 text-xs font-bold uppercase text-sky-100 disabled:opacity-50"
            >
              Start Auction
            </button>
            <button
              type="button"
              disabled={auctionBusy || !isAuctionRunning}
              onClick={() => callAuctionControl('/stop', {}, 'Auction stopped')}
              className="h-10 rounded border border-white/30 bg-black/60 px-3 text-xs font-bold uppercase text-white disabled:opacity-50"
            >
              Stop Auction
            </button>
          </div>
        </div>

        <div className="rounded border border-amber-400/35 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold tracking-[0.16em] text-amber-200/90 uppercase">Manual Lot Control</p>
          <p className="mt-1 text-xs text-white/65">Settle the active lot first, then activate the next pending lot.</p>

          <label className="mt-3 block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
            Control Lot
            <select
              value={controlLotId}
              onChange={(e) => setControlLotId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded border border-white/30 bg-black/60 px-3 text-xs text-white outline-none focus:border-primary"
            >
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  #{lot.lotOrder} - {lot.player?.name || lot.playerId}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-2 rounded border border-white/20 bg-black/50 p-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/55 uppercase">Selected Lot</p>
            <p className="mt-1 text-sm font-bold text-white">
              {selectedLot ? `#${selectedLot.lotOrder} - ${selectedLot.player?.name || selectedLot.playerId}` : 'No lot selected'}
            </p>
            <p className="mt-1 text-xs text-white/65">
              {selectedLot
                ? `Status: ${selectedLot.status} | Highest: ${selectedLot.currentBid || 0} | Owner: ${selectedLot.currentOwnerName || 'None'}`
                : 'Choose a lot from the selector.'}
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={auctionBusy || !activeLot || !isAuctionRunning}
              onClick={handleSettleCurrentLot}
              className="h-10 rounded border border-amber-300/60 bg-amber-300/15 px-3 text-xs font-bold uppercase text-amber-200 disabled:opacity-50"
            >
              Settle Current Lot
            </button>
            <button
              type="button"
              disabled={auctionBusy || Boolean(activeLot) || lotSummary.pending === 0}
              onClick={handleActivateNextLot}
              className="h-10 rounded border border-amber-400/60 bg-amber-400/15 px-3 text-xs font-bold uppercase text-amber-200 disabled:opacity-50"
            >
              Activate Next Lot
            </button>
            <button
              type="button"
              disabled={auctionBusy || !controlLotId || isSelectedFinished || !isSelectedPending}
              onClick={() => callAuctionControl('/manual-lot-override', { lotId: controlLotId, status: 'ACTIVE' }, 'Selected pending lot activated')}
              className="h-10 rounded border border-primary/50 bg-primary/10 px-3 text-xs font-bold uppercase text-primary disabled:opacity-50"
            >
              Jump To Lot
            </button>
            <button
              type="button"
              disabled={auctionBusy || !selectedLot || selectedLot.status === 'ACTIVE' || selectedLot.status === 'PENDING'}
              onClick={handleResetToPending}
              className="h-10 rounded border border-sky-400/45 bg-sky-400/10 px-3 text-[11px] font-bold uppercase text-sky-300 disabled:opacity-50"
            >
              Reset To Pending
            </button>
          </div>
        </div>

        <div className="rounded border border-red-400/35 bg-red-500/10 p-3">
          <p className="text-[10px] font-bold tracking-[0.16em] text-red-200/90 uppercase">Advanced Controls</p>
          <p className="mt-1 text-xs text-white/65">Timer updates, auto progression, and emergency override.</p>

          <label className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-white/75 uppercase">
            <input
              type="checkbox"
              checked={autoProgress}
              onChange={(e) => handleSetAutoProgress(e.target.checked)}
              disabled={auctionBusy}
              className="h-4 w-4"
            />
            Auto Progress (settle + activate next on timeout)
          </label>

          <label className="mt-3 block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
            Extend Timer (sec)
            <div className="mt-1.5 flex gap-2">
              <input
                type="number"
                min={1}
                max={300}
                value={extendSeconds}
                onChange={(e) => setExtendSeconds(Number(e.target.value || 1))}
                className="h-10 w-full rounded border border-white/30 bg-black/60 px-3 text-xs text-white outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={auctionBusy || !activeLot || !isAuctionRunning || Number(extendSeconds) <= 0}
                onClick={handleExtendTimer}
                className="h-10 whitespace-nowrap rounded border border-indigo-400/55 bg-indigo-400/10 px-3 text-[11px] font-bold uppercase text-indigo-300 disabled:opacity-50"
              >
                Extend
              </button>
            </div>
          </label>

          <div className="mt-3 rounded border border-red-300/35 bg-black/45 p-3">
            <p className="text-[10px] font-bold tracking-[0.14em] text-red-200 uppercase">Emergency Override</p>
            <p className="mt-1 text-[10px] text-white/60">Use only when manual correction is required.</p>

            <label className="mt-2 block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
              Winning Owner
              <select
                value={controlOwnerId}
                onChange={(e) => setControlOwnerId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-white/30 bg-black/60 px-3 text-xs text-white outline-none focus:border-primary"
              >
                <option value="">Select owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
            </label>

            <label className="mt-2 block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
              Final Amount
              <input
                type="number"
                value={controlAmount}
                onChange={(e) => setControlAmount(Number(e.target.value || 0))}
                className="mt-1.5 h-10 w-full rounded border border-white/30 bg-black/60 px-3 text-xs text-white outline-none focus:border-primary"
              />
            </label>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={auctionBusy || !controlLotId || !controlOwnerId || Number(controlAmount || 0) <= 0 || isSelectedFinished}
                onClick={handleFinalizeSold}
                className="h-10 rounded border border-red-400/65 bg-red-400/15 px-3 text-[11px] font-bold uppercase text-red-200 disabled:opacity-50"
              >
                Emergency Override
              </button>
              <button
                type="button"
                disabled={auctionBusy || !controlLotId}
                onClick={() => {
                  setEditingId(controlLotId);
                  const selected = lots.find((lot) => lot.id === controlLotId);
                  if (selected) {
                    startEdit(selected);
                  }
                }}
                className="h-10 rounded border border-white/30 bg-black/60 px-3 text-[11px] font-bold uppercase text-white disabled:opacity-50"
              >
                Open Row Editor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-5">
        <select value={createForm.playerId} onChange={(e) => setCreateForm({ ...createForm, playerId: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary">
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary">
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SOLD">SOLD</option>
          <option value="UNSOLD">UNSOLD</option>
        </select>
        <input type="datetime-local" value={createForm.endsAt} onChange={(e) => setCreateForm({ ...createForm, endsAt: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="number" value={createForm.lotOrder} onChange={(e) => setCreateForm({ ...createForm, lotOrder: Number(e.target.value || 1) })} placeholder="Lot order" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <button type="button" disabled={creating || !createForm.playerId} onClick={handleCreate} className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50">
          {creating ? 'Creating...' : 'Add Lot'}
        </button>
      </div>

      <DataTable
        columns={['Lot ID', 'Order', 'Player', 'Current Bid', 'Owner', 'Status', 'Ends At', 'Time Left', 'Actions']}
        rows={lots.map((lot) => [
          lot.id,
          editingId === lot.id ? <input type="number" value={editForm.lotOrder} onChange={(e) => setEditForm({ ...editForm, lotOrder: Number(e.target.value || 1) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : toText(lot.lotOrder),
          editingId === lot.id ? (
            <select value={editForm.playerId} onChange={(e) => setEditForm({ ...editForm, playerId: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              {players.map((player) => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          ) : (lot.player?.name || lot.playerId),
          toText(lot.currentBid),
          editingId === lot.id ? (
            <span className="text-white/60">Managed by live bids</span>
          ) : (lot.currentOwnerName || '-'),
          editingId === lot.id ? (
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="UNSOLD">UNSOLD</option>
            </select>
          ) : lot.status,
          editingId === lot.id
            ? <input type="datetime-local" value={editForm.endsAt} onChange={(e) => setEditForm({ ...editForm, endsAt: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" />
            : (lot.endsAt ? new Date(lot.endsAt).toLocaleString() : '-'),
          `${toText(lot.timeLeft)}s`,
          editingId === lot.id ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => handleUpdate(lot.id)} className="rounded border border-primary/60 px-2 py-1 text-[10px] font-bold uppercase text-primary">Save</button>
              <button type="button" onClick={() => setEditingId('')} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(lot)} className="rounded border border-white/30 px-2 py-1 text-[10px] font-bold uppercase text-white/80">Edit</button>
              <button type="button" onClick={() => handleDelete(lot.id)} className="rounded border border-red-500/50 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Delete</button>
            </div>
          ),
        ])}
        emptyText="No auction lots found."
      />
    </div>
  );
};

const BulkUploadModal = ({ eventId, token, initialType, onClose, onSuccess, onError }) => {
  const [uploadType, setUploadType] = useState(initialType);
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);

  const exampleByType = {
    owners: `[
  { "name": "Owner One", "password": "ownerpass123", "avatarUrl": "https://example.com/owner1.png" }
]`,
    teams: `[
  { "name": "Team Alpha", "ownerId": "OWNER_UUID_HERE", "coinsLeft": 5000 }
]`,
    players: `[
  { "name": "Player One", "role": "IGL", "rankPoint": 92, "basePrice": 1200, "imageUrl": "https://example.com/player1.jpg" }
]`,
  };

  const schemaNoteByType = {
    owners: 'Schema requires: name + password. Optional: avatarUrl (must be valid URL).',
    teams: 'Schema requires: name + ownerId(UUID). Optional: coinsLeft.',
    players: 'Schema requires: name + role. Optional: rankPoint, basePrice, imageUrl(valid URL).',
  };

  const handleUpload = async () => {
    onError('');
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonData);
      const response = await fetch(`${API_URL}/events/${eventId}/${uploadType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, 'Bulk upload failed'));
      }

      onSuccess(`Bulk ${uploadType} upload completed`);
    } catch (uploadError) {
      onError(uploadError.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <CyberCard className="p-6">
          <h3 className="font-display text-2xl font-black uppercase text-white">Bulk Upload</h3>
          <p className="mt-2 text-xs text-white/60">Event ID: {eventId}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {['owners', 'teams', 'players'].map((type) => (
              <button
                key={type}
                onClick={() => setUploadType(type)}
                className={`rounded border px-3 py-1.5 text-xs font-bold uppercase ${
                  uploadType === type
                    ? 'border-primary bg-primary text-black'
                    : 'border-white/20 bg-black/50 text-white/80 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/70">{schemaNoteByType[uploadType]}</p>

          <pre className="mt-3 overflow-x-auto rounded border border-white/20 bg-black/50 p-3 text-xs text-white/80">
            {exampleByType[uploadType]}
          </pre>

          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            rows={10}
            className="mt-3 w-full rounded border border-white/30 bg-black/50 p-3 font-mono text-sm text-white outline-none focus:border-primary"
            placeholder={`Paste ${uploadType} JSON array...`}
          />

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-white/30 px-4 py-2 text-sm font-bold uppercase text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !jsonData.trim()}
              onClick={handleUpload}
              className="flex-1 rounded border border-primary bg-primary px-4 py-2 text-sm font-bold uppercase text-black hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </CyberCard>
      </div>
    </div>
  );
};

const CreateEventModal = ({ token, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    season: '',
    game: '',
    mode: '',
    password: '',
    registrationCount: 0,
    maxSlots: 0,
    streamStartTime: '',
    auctionWindowSeconds: 30,
    bannerUrl: '',
    sponsorImageUrl: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    onError('');

    const validationMessage = validateEventForm(formData);
    if (validationMessage) {
      onError(validationMessage);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        season: toOptional(formData.season),
        game: formData.game.trim(),
        mode: toOptional(formData.mode),
        password: formData.password,
        registrationCount: Number(formData.registrationCount),
        maxSlots: Number(formData.maxSlots),
        streamStartTime: toOptional(formData.streamStartTime),
        auctionWindowSeconds: Number(formData.auctionWindowSeconds),
        bannerUrl: toOptional(formData.bannerUrl),
        sponsorImageUrl: toOptional(formData.sponsorImageUrl),
      };

      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(apiErrorMessage(result, 'Unable to create event'));
      }

      onSuccess(result.data?.id);
    } catch (createError) {
      onError(createError.message || 'Unable to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CyberCard className="max-h-[90vh] overflow-y-auto p-8">
          <h2 className="mb-6 font-display text-3xl font-black uppercase text-white">Create Event</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" value={formData.slug} onChange={(v) => setFormData({ ...formData, slug: v })} required />
              <Field label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Game" value={formData.game} onChange={(v) => setFormData({ ...formData, game: v })} required />
              <Field label="Mode" value={formData.mode} onChange={(v) => setFormData({ ...formData, mode: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Season" value={formData.season} onChange={(v) => setFormData({ ...formData, season: v })} />
              <Field label="Password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Registrations" value={formData.registrationCount} onChange={(v) => setFormData({ ...formData, registrationCount: v })} />
              <NumberField label="Max Slots" value={formData.maxSlots} onChange={(v) => setFormData({ ...formData, maxSlots: v })} />
              <NumberField label="Auction Window" value={formData.auctionWindowSeconds} onChange={(v) => setFormData({ ...formData, auctionWindowSeconds: v })} />
              <Field label="Stream Start" value={formData.streamStartTime} onChange={(v) => setFormData({ ...formData, streamStartTime: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Banner URL" value={formData.bannerUrl} onChange={(v) => setFormData({ ...formData, bannerUrl: v })} />
              <Field label="Sponsor Image URL" value={formData.sponsorImageUrl} onChange={(v) => setFormData({ ...formData, sponsorImageUrl: v })} />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded border border-white/30 py-2.5 text-sm font-bold uppercase text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded border border-primary bg-primary py-2.5 text-sm font-bold uppercase text-black hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </CyberCard>
      </div>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded border border-white/15 bg-black/40 p-3">
    <p className="text-[10px] font-bold tracking-[0.24em] text-white/45 uppercase">{label}</p>
    <p className="mt-2 text-sm font-bold text-white">{value}</p>
  </div>
);

const DataTable = ({ columns, rows, emptyText }) => (
  <div className="overflow-x-auto rounded border border-white/15">
    {rows.length === 0 ? (
      <p className="p-4 text-sm text-white/60">{emptyText}</p>
    ) : (
      <table className="w-full min-w-180 border-collapse text-sm">
        <thead className="bg-white/5">
          <tr>
            {columns.map((col) => (
              <th key={col} className="border-b border-white/10 px-3 py-2 text-left text-xs font-bold tracking-[0.12em] text-white/60 uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row[0] || 'row'}`} className="border-b border-white/5">
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-3 py-2 text-white/85">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const Field = ({ label, value, onChange, required = false }) => (
  <label className="block text-xs font-bold uppercase text-white/70">
    {label}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="mt-2 h-10 w-full rounded border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary"
    />
  </label>
);

const NumberField = ({ label, value, onChange }) => (
  <label className="block text-xs font-bold uppercase text-white/70">
    {label}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      className="mt-2 h-10 w-full rounded border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary"
    />
  </label>
);

export default AdminDashboard;
