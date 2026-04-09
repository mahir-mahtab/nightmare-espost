import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  LogOut,
  Upload,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { config } from '../config.js';

const API_URL = `${config.apiUrl}/admin`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const token = localStorage.getItem('admin-token');

  const fetchEvents = useCallback(async () => {
    try {
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

      const data = await response.json();
      setEvents(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchEvents();
  }, [token, navigate, fetchEvents]);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    navigate('/admin/login');
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete event');

      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <PageShell accent="Admin Dashboard">
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <CyberCard className="p-8">
              <p className="font-display text-xl font-black uppercase text-white">Loading...</p>
            </CyberCard>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell accent="Admin Dashboard">
      <section className="px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black uppercase text-white md:text-5xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-white/60">Manage events and auction data</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-bold uppercase text-black transition-all hover:bg-primary/90 rounded"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 border border-white/30 bg-black/50 px-4 py-2.5 text-sm font-bold uppercase text-white transition-all hover:bg-white/10 rounded"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </Motion.div>
          )}

          {/* Events Grid */}
          {events.length === 0 ? (
            <CyberCard className="p-12 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-white/30" />
              <h3 className="font-display text-2xl font-black uppercase text-white">No Events Yet</h3>
              <p className="mt-2 text-sm text-white/60">Create your first event to get started</p>
            </CyberCard>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={handleDeleteEvent}
                  onManageData={(evt) => {
                    setSelectedEvent(evt);
                    setShowBulkUploadModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchEvents();
            }}
            token={token}
          />
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUploadModal && selectedEvent && (
          <BulkUploadModal
            event={selectedEvent}
            onClose={() => {
              setShowBulkUploadModal(false);
              setSelectedEvent(null);
            }}
            token={token}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
};

// Event Card Component
const EventCard = ({ event, onDelete, onManageData }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
        return 'text-green-400 border-green-500/50 bg-green-500/10';
      case 'COMPLETED':
        return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
      default:
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <CyberCard hover className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-display text-xl font-black uppercase text-white">{event.title}</h3>
            <p className="mt-1 text-xs text-white/50">/{event.slug}</p>
          </div>
          <span className={`rounded border px-2 py-1 text-xs font-bold uppercase ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        <div className="mb-4 space-y-2 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <span>Game:</span>
            <span className="font-bold text-white">{event.game}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Teams:</span>
            <span className="font-bold text-white">{event._count?.teams || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Players:</span>
            <span className="font-bold text-white">{event._count?.players || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Owners:</span>
            <span className="font-bold text-white">{event._count?.owners || 0}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onManageData(event)}
            className="flex-1 border border-primary/50 bg-primary/10 py-2 text-xs font-bold uppercase text-primary transition-all hover:bg-primary/20 rounded"
          >
            <Upload className="mx-auto h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="flex-1 border border-red-500/50 bg-red-500/10 py-2 text-xs font-bold uppercase text-red-400 transition-all hover:bg-red-500/20 rounded"
          >
            <Trash2 className="mx-auto h-4 w-4" />
          </button>
        </div>
      </CyberCard>
    </Motion.div>
  );
};

// Create Event Modal Component
const CreateEventModal = ({ onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    game: '',
    password: '',
    season: '',
    mode: '',
    maxSlots: 64,
    registrationCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <CyberCard className="max-h-[90vh] overflow-y-auto p-8">
          <h2 className="mb-6 font-display text-3xl font-black uppercase text-white">Create Event</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="event-slug"
                  required
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Password *</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Event password"
                  required
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-white/70">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event Title"
                required
                className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Game *</label>
                <input
                  type="text"
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  placeholder="PUBG Mobile"
                  required
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Mode</label>
                <input
                  type="text"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  placeholder="Squad TPP"
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-white/70">Season</label>
              <input
                type="text"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="Season 3"
                className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Max Slots</label>
                <input
                  type="number"
                  value={formData.maxSlots}
                  onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-white/70">Registrations</label>
                <input
                  type="number"
                  value={formData.registrationCount}
                  onChange={(e) => setFormData({ ...formData, registrationCount: parseInt(e.target.value) })}
                  className="h-10 w-full border border-white/30 bg-black/50 px-3 text-sm text-white outline-none focus:border-primary rounded"
                />
              </div>
            </div>

            {error && (
              <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-white/30 py-2.5 text-sm font-bold uppercase text-white hover:bg-white/10 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 border border-primary bg-primary py-2.5 text-sm font-bold uppercase text-black hover:bg-primary/90 disabled:opacity-50 rounded"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </CyberCard>
      </Motion.div>
    </Motion.div>
  );
};

// Bulk Upload Modal Component
const BulkUploadModal = ({ event, onClose, token }) => {
  const [activeTab, setActiveTab] = useState('owners');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const exampleData = {
    owners: `[
  { "name": "John Doe", "avatarUrl": "https://example.com/avatar1.jpg" },
  { "name": "Jane Smith", "avatarUrl": "https://example.com/avatar2.jpg" }
]`,
    teams: `[
  { "name": "Team Alpha", "ownerId": "OWNER_UUID_HERE", "coinsLeft": 5000 },
  { "name": "Team Beta", "ownerId": "OWNER_UUID_HERE", "coinsLeft": 5000 }
]`,
    players: `[
  { "name": "Player1", "role": "IGL", "rankPoint": 95, "basePrice": 1000, "imageUrl": "https://example.com/player1.jpg" },
  { "name": "Player2", "role": "Assaulter", "rankPoint": 88, "basePrice": 850, "imageUrl": "https://example.com/player2.jpg" }
]`,
  };

  const handleUpload = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = JSON.parse(jsonData);

      const response = await fetch(`${API_URL}/events/${event.id}/${activeTab}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setSuccess(`Successfully uploaded ${data.length} ${activeTab}!`);
      setJsonData('');
    } catch (err) {
      setError(err.message || 'Invalid JSON format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl"
      >
        <CyberCard className="max-h-[90vh] overflow-y-auto p-8">
          <h2 className="mb-2 font-display text-3xl font-black uppercase text-white">
            Bulk Upload Data
          </h2>
          <p className="mb-6 text-sm text-white/60">{event.title}</p>

          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            {['owners', 'teams', 'players'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-bold uppercase transition-all rounded ${
                  activeTab === tab
                    ? 'border border-primary bg-primary text-black'
                    : 'border border-white/30 bg-black/50 text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Example */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase text-white/70">Example Format:</p>
            <pre className="overflow-x-auto rounded border border-white/20 bg-black/50 p-3 text-xs text-white/80">
              {exampleData[activeTab]}
            </pre>
          </div>

          {/* JSON Input */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase text-white/70">JSON Data:</label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder={`Paste your ${activeTab} JSON array here...`}
              rows={10}
              className="w-full border border-white/30 bg-black/50 p-3 font-mono text-sm text-white outline-none focus:border-primary rounded"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/30 py-2.5 text-sm font-bold uppercase text-white hover:bg-white/10 rounded"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !jsonData}
              className="flex-1 border border-primary bg-primary py-2.5 text-sm font-bold uppercase text-black hover:bg-primary/90 disabled:opacity-50 rounded"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </CyberCard>
      </Motion.div>
    </Motion.div>
  );
};

export default AdminDashboard;
