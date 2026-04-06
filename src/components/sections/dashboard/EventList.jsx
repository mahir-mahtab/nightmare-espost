import { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, Edit, Trash2, Play, Square, Eye, EyeOff, Loader2 } from 'lucide-react';
import apiService from '../../../services/api.js';

const EventList = ({ onEdit, onManageAuction, onUpdate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEvents();
      setEvents(data.events || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(eventId);
      await apiService.deleteEvent(eventId);
      setEvents(events.filter(e => e._id !== eventId));
      onUpdate && onUpdate();
    } catch (err) {
      alert(`Failed to delete event: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (event) => {
    try {
      setPublishingId(event._id);
      if (event.isPublished) {
        await apiService.unpublishEvent(event._id);
      } else {
        await apiService.publishEvent(event._id);
      }
      await loadEvents();
      onUpdate && onUpdate();
    } catch (err) {
      alert(`Failed to update event: ${err.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border-2 border-red-500/50 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadEvents}
          className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition-colors"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="brutal-border bg-black/30 p-12 text-center">
        <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 font-bold mb-2">NO EVENTS YET</p>
        <p className="text-white/40 text-sm">Create your first event to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event._id}
          className="brutal-border bg-black/30 p-6 hover:bg-black/50 transition-colors"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Event Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-black text-white">{event.name}</h3>
                {event.isPublished ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold">
                    PUBLISHED
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs font-bold">
                    DRAFT
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-white/60 mb-3 line-clamp-2">{event.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4" />
                  <span>{event.playerCount || 0} Players</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Trophy className="w-4 h-4" />
                  <span>{event.teamCount || 0} Teams</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(event)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                title="Edit Event"
              >
                <Edit className="w-4 h-4" />
                <span>EDIT</span>
              </button>

              <button
                onClick={() => handleTogglePublish(event)}
                disabled={publishingId === event._id}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-bold transition-colors disabled:opacity-50"
                title={event.isPublished ? 'Unpublish' : 'Publish'}
              >
                {publishingId === event._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : event.isPublished ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {event.isPublished ? 'UNPUBLISH' : 'PUBLISH'}
                </span>
              </button>

              <button
                onClick={() => onManageAuction(event)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold transition-colors"
                title="Manage Auction"
              >
                <Play className="w-4 h-4" />
                <span>AUCTION</span>
              </button>

              <button
                onClick={() => handleDelete(event._id)}
                disabled={deletingId === event._id}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition-colors disabled:opacity-50"
                title="Delete Event"
              >
                {deletingId === event._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">DELETE</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
