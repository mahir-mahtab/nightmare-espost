import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
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

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin-token');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch events');
      }

      const payload = await response.json();
      const list = payload.data || [];
      setEvents(list);

      if (!selectedEventId && list.length > 0) {
        setSelectedEventId(list[0].id);
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to fetch events');
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

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('admin-token');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to load event workspace');
      }

      const payload = await response.json();
      setEventData(payload.data);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load event workspace');
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

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    navigate('/admin/login');
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      setMessage('');

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setMessage('Event deleted successfully');
      if (selectedEventId === eventId) {
        setSelectedEventId('');
        setEventData(null);
      }
      fetchEvents();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete event');
    }
  };

  return (
    <PageShell accent="Admin Dashboard" showNavbar={false}>
      <section className="px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black uppercase text-white md:text-5xl">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-white/60">Per-event workspace with dedicated controls</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                <p className="text-sm text-white/60">No events created yet.</p>
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
                <p className="text-sm text-white/60">Select an event to open its admin workspace.</p>
              ) : loadingEventData || !eventData ? (
                <p className="text-sm text-white/60">Loading event workspace...</p>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-3xl font-black uppercase text-white">{eventData.title}</h2>
                      <p className="mt-1 text-xs text-white/60">/{eventData.slug} • {eventData.status}</p>
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
      status: toText(eventData.status || 'UPCOMING'),
    });
  }, [eventData]);

  const handleSave = async (e) => {
    e.preventDefault();
    onError('');
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
        throw new Error(result.message || 'Failed to update event');
      }

      onSaved('Event updated successfully');
    } catch (saveError) {
      onError(saveError.message || 'Failed to update event');
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
  const [createForm, setCreateForm] = useState({ name: '', avatarUrl: '' });
  const [editForm, setEditForm] = useState({ name: '', avatarUrl: '' });

  const handleCreate = async () => {
    onError('');
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
          avatarUrl: createForm.avatarUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to create owner');
      }
      setCreateForm({ name: '', avatarUrl: '' });
      onChanged('Owner created successfully');
    } catch (err) {
      onError(err.message || 'Failed to create owner');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (owner) => {
    setEditingId(owner.id);
    setEditForm({ name: owner.name || '', avatarUrl: owner.avatarUrl || '' });
  };

  const handleUpdate = async (ownerId) => {
    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/owner/${ownerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          avatarUrl: editForm.avatarUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update owner');
      }
      setEditingId('');
      onChanged('Owner updated successfully');
    } catch (err) {
      onError(err.message || 'Failed to update owner');
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
        throw new Error(payload.message || 'Failed to delete owner');
      }
      onChanged('Owner deleted successfully');
    } catch (err) {
      onError(err.message || 'Failed to delete owner');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-3">
        <input
          type="text"
          value={createForm.name}
          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          placeholder="Owner name"
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
          disabled={creating || !createForm.name.trim()}
          onClick={handleCreate}
          className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Add Owner'}
        </button>
      </div>

      <DataTable
        columns={['Owner ID', 'Name', 'Avatar URL', 'Actions']}
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
        throw new Error(payload.message || 'Failed to create team');
      }
      setCreateForm({ name: '', ownerId: owners[0]?.id || '', coinsLeft: 0 });
      onChanged('Team created successfully');
    } catch (err) {
      onError(err.message || 'Failed to create team');
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
        throw new Error(payload.message || 'Failed to update team');
      }
      setEditingId('');
      onChanged('Team updated successfully');
    } catch (err) {
      onError(err.message || 'Failed to update team');
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
        throw new Error(payload.message || 'Failed to delete team');
      }
      onChanged('Team deleted successfully');
    } catch (err) {
      onError(err.message || 'Failed to delete team');
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
    role: '',
    rankPoint: 0,
    basePrice: 0,
    imageUrl: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
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
          role: createForm.role,
          rankPoint: Number(createForm.rankPoint),
          basePrice: Number(createForm.basePrice),
          imageUrl: createForm.imageUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to create player');
      }
      setCreateForm({ name: '', role: '', rankPoint: 0, basePrice: 0, imageUrl: '' });
      onChanged('Player created successfully');
    } catch (err) {
      onError(err.message || 'Failed to create player');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditForm({
      name: player.name || '',
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
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/player/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
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
        throw new Error(payload.message || 'Failed to update player');
      }
      setEditingId('');
      onChanged('Player updated successfully');
    } catch (err) {
      onError(err.message || 'Failed to update player');
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
        throw new Error(payload.message || 'Failed to delete player');
      }
      onChanged('Player deleted successfully');
    } catch (err) {
      onError(err.message || 'Failed to delete player');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-5">
        <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Player name" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="text" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} placeholder="Role" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="number" value={createForm.rankPoint} onChange={(e) => setCreateForm({ ...createForm, rankPoint: Number(e.target.value || 0) })} placeholder="Rank" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <input type="number" value={createForm.basePrice} onChange={(e) => setCreateForm({ ...createForm, basePrice: Number(e.target.value || 0) })} placeholder="Base price" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <button type="button" disabled={creating || !createForm.name.trim() || !createForm.role.trim()} onClick={handleCreate} className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50">
          {creating ? 'Creating...' : 'Add Player'}
        </button>
      </div>

      <DataTable
        columns={['Player ID', 'Name', 'Role', 'Rank', 'Base Price', 'Status', 'Sold Team', 'Final Price', 'Actions']}
        rows={players.map((player) => [
          player.id,
          editingId === player.id ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : player.name,
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

const LotsTab = ({ lots, players, owners, eventId, token, onError, onChanged }) => {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [auctionBusy, setAuctionBusy] = useState(false);
  const [autoProgress, setAutoProgress] = useState(true);
  const [controlLotId, setControlLotId] = useState('');
  const [controlOwnerId, setControlOwnerId] = useState('');
  const [controlAmount, setControlAmount] = useState(0);
  const [createForm, setCreateForm] = useState({
    playerId: players[0]?.id || '',
    currentBid: 0,
    currentOwnerId: '',
    status: 'PENDING',
    timeLeft: 30,
    lotOrder: 1,
  });
  const [editForm, setEditForm] = useState({
    playerId: '',
    currentBid: 0,
    currentOwnerId: '',
    status: 'PENDING',
    timeLeft: 30,
    lotOrder: 1,
  });

  useEffect(() => {
    if (!createForm.playerId && players[0]?.id) {
      setCreateForm((prev) => ({ ...prev, playerId: players[0].id }));
    }
  }, [players, createForm.playerId]);

  useEffect(() => {
    if (!controlLotId && lots[0]?.id) {
      setControlLotId(lots[0].id);
      setControlAmount(Number(lots[0].currentBid || 0));
      setControlOwnerId(lots[0].currentOwnerId || owners[0]?.id || '');
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

  const handleCreate = async () => {
    onError('');
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
          currentBid: Number(createForm.currentBid),
          currentOwnerId: createForm.currentOwnerId || undefined,
          status: createForm.status,
          timeLeft: Number(createForm.timeLeft),
          lotOrder: Number(createForm.lotOrder),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to create auction lot');
      }
      setCreateForm({
        playerId: players[0]?.id || '',
        currentBid: 0,
        currentOwnerId: '',
        status: 'PENDING',
        timeLeft: 30,
        lotOrder: 1,
      });
      onChanged('Auction lot created successfully');
    } catch (err) {
      onError(err.message || 'Failed to create auction lot');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (lot) => {
    setEditingId(lot.id);
    setEditForm({
      playerId: lot.playerId,
      currentBid: Number(lot.currentBid || 0),
      currentOwnerId: lot.currentOwnerId || '',
      status: lot.status || 'PENDING',
      timeLeft: Number(lot.timeLeft || 0),
      lotOrder: Number(lot.lotOrder || 1),
    });
  };

  const handleUpdate = async (lotId) => {
    onError('');
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/lot/${lotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: editForm.playerId,
          currentBid: Number(editForm.currentBid),
          currentOwnerId: editForm.currentOwnerId || undefined,
          status: editForm.status,
          timeLeft: Number(editForm.timeLeft),
          lotOrder: Number(editForm.lotOrder),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update auction lot');
      }
      setEditingId('');
      onChanged('Auction lot updated successfully');
    } catch (err) {
      onError(err.message || 'Failed to update auction lot');
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
        throw new Error(payload.message || 'Failed to delete auction lot');
      }
      onChanged('Auction lot deleted successfully');
    } catch (err) {
      onError(err.message || 'Failed to delete auction lot');
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
        throw new Error(payload.message || 'Auction action failed');
      }
      onChanged(successMessage);
    } catch (err) {
      onError(err.message || 'Auction action failed');
    } finally {
      setAuctionBusy(false);
    }
  };

  const handleFinalizeSold = async () => {
    if (!controlLotId) {
      onError('Select a lot first');
      return;
    }

    if (!controlOwnerId) {
      onError('Select winning owner');
      return;
    }

    if (!controlAmount || Number(controlAmount) <= 0) {
      onError('Enter a valid sold amount');
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
          lotId: controlLotId,
          ownerId: controlOwnerId,
          amount: Number(controlAmount),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Finalize failed');
      }

      onChanged('Lot finalized and sold successfully');
    } catch (err) {
      onError(err.message || 'Finalize failed');
    } finally {
      setAuctionBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded border border-primary/30 bg-primary/5 p-4">
        <p className="mb-3 text-xs font-bold tracking-[0.16em] text-primary uppercase">Auction Control Center</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
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

          <label className="block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
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

          <label className="block text-[10px] font-bold tracking-[0.14em] text-white/65 uppercase">
            Sold Amount
            <input
              type="number"
              value={controlAmount}
              onChange={(e) => setControlAmount(Number(e.target.value || 0))}
              className="mt-1.5 h-10 w-full rounded border border-white/30 bg-black/60 px-3 text-xs text-white outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-center gap-2 pt-6 text-xs font-bold uppercase text-white/80">
            <input
              type="checkbox"
              checked={autoProgress}
              onChange={(e) => setAutoProgress(e.target.checked)}
              className="h-4 w-4"
            />
            Auto Progress
          </label>

          <button
            type="button"
            disabled={auctionBusy}
            onClick={handleFinalizeSold}
            className="h-10 self-end rounded border border-green-500/50 bg-green-500/10 px-3 text-xs font-bold uppercase text-green-300 disabled:opacity-50"
          >
            Finalize Sold
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-4">
        <button
          type="button"
          disabled={auctionBusy}
          onClick={() => callAuctionControl('/start', { autoProgress }, 'Auction started')}
          className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50"
        >
          Start Auction
        </button>
        <button
          type="button"
          disabled={auctionBusy}
          onClick={() => callAuctionControl('/stop', {}, 'Auction stopped')}
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          Stop Auction
        </button>
        <button
          type="button"
          disabled={auctionBusy}
          onClick={() => callAuctionControl('/next-lot', {}, 'Moved to next lot')}
          className="h-10 rounded border border-amber-300/50 bg-amber-300/10 px-3 text-xs font-bold uppercase text-amber-300 disabled:opacity-50"
        >
          Next Lot
        </button>
        <button
          type="button"
          disabled={auctionBusy || !controlLotId}
          onClick={() => {
            callAuctionControl('/manual-lot-override', { lotId: controlLotId, status: 'ACTIVE' }, 'Selected lot activated');
          }}
          className="h-10 rounded border border-primary/50 bg-primary/10 px-3 text-xs font-bold uppercase text-primary disabled:opacity-50"
        >
          Activate Selected
        </button>
      </div>

      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={auctionBusy || !controlLotId}
          onClick={() => callAuctionControl('/manual-lot-override', { lotId: controlLotId, status: 'UNSOLD' }, 'Selected lot marked unsold')}
          className="h-10 rounded border border-yellow-500/50 bg-yellow-500/10 px-3 text-xs font-bold uppercase text-yellow-300 disabled:opacity-50"
        >
          Mark Unsold
        </button>
        <button
          type="button"
          disabled={auctionBusy || !controlLotId || !controlOwnerId}
          onClick={() => callAuctionControl('/manual-lot-override', { lotId: controlLotId, status: 'SOLD' }, 'Selected lot set sold')}
          className="h-10 rounded border border-green-500/50 bg-green-500/10 px-3 text-xs font-bold uppercase text-green-300 disabled:opacity-50"
        >
          Mark Sold
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
          className="h-10 rounded border border-white/30 bg-black/60 px-3 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          Open in Row Editor
        </button>
      </div>

      <div className="grid gap-3 rounded border border-white/15 bg-black/40 p-3 sm:grid-cols-6">
        <select value={createForm.playerId} onChange={(e) => setCreateForm({ ...createForm, playerId: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary">
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <input type="number" value={createForm.currentBid} onChange={(e) => setCreateForm({ ...createForm, currentBid: Number(e.target.value || 0) })} placeholder="Current bid" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <select value={createForm.currentOwnerId} onChange={(e) => setCreateForm({ ...createForm, currentOwnerId: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary">
          <option value="">No owner</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.name}</option>
          ))}
        </select>
        <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary">
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SOLD">SOLD</option>
          <option value="UNSOLD">UNSOLD</option>
        </select>
        <input type="number" value={createForm.lotOrder} onChange={(e) => setCreateForm({ ...createForm, lotOrder: Number(e.target.value || 1) })} placeholder="Lot order" className="h-10 rounded border border-white/30 bg-black/60 px-3 text-sm text-white outline-none focus:border-primary" />
        <button type="button" disabled={creating || !createForm.playerId} onClick={handleCreate} className="h-10 rounded border border-primary bg-primary px-3 text-xs font-bold uppercase text-black disabled:opacity-50">
          {creating ? 'Creating...' : 'Add Lot'}
        </button>
      </div>

      <DataTable
        columns={['Lot ID', 'Order', 'Player', 'Current Bid', 'Owner', 'Status', 'Time Left', 'Actions']}
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
          editingId === lot.id ? <input type="number" value={editForm.currentBid} onChange={(e) => setEditForm({ ...editForm, currentBid: Number(e.target.value || 0) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : toText(lot.currentBid),
          editingId === lot.id ? (
            <select value={editForm.currentOwnerId} onChange={(e) => setEditForm({ ...editForm, currentOwnerId: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              <option value="">No owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name}</option>
              ))}
            </select>
          ) : (lot.currentOwner?.name || '-'),
          editingId === lot.id ? (
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary">
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="UNSOLD">UNSOLD</option>
            </select>
          ) : lot.status,
          editingId === lot.id ? <input type="number" value={editForm.timeLeft} onChange={(e) => setEditForm({ ...editForm, timeLeft: Number(e.target.value || 0) })} className="h-9 w-full rounded border border-white/30 bg-black/60 px-2 text-xs text-white outline-none focus:border-primary" /> : `${toText(lot.timeLeft)}s`,
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
  { "name": "Owner One", "avatarUrl": "https://example.com/owner1.png" }
]`,
    teams: `[
  { "name": "Team Alpha", "ownerId": "OWNER_UUID_HERE", "coinsLeft": 5000 }
]`,
    players: `[
  { "name": "Player One", "role": "IGL", "rankPoint": 92, "basePrice": 1200, "imageUrl": "https://example.com/player1.jpg" }
]`,
  };

  const schemaNoteByType = {
    owners: 'Schema requires: name. Optional: avatarUrl (must be valid URL).',
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
        throw new Error(payload.message || 'Bulk upload failed');
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
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    onError('');
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
        throw new Error(result.message || 'Failed to create event');
      }

      onSuccess(result.data?.id);
    } catch (createError) {
      onError(createError.message || 'Failed to create event');
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
            <Field label="Banner URL" value={formData.bannerUrl} onChange={(v) => setFormData({ ...formData, bannerUrl: v })} />

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
      <table className="w-full min-w-[720px] border-collapse text-sm">
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
