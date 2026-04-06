import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import apiService from '../../../services/api.js';

const EventForm = ({ event, onClose, onSuccess }) => {
  const isEditMode = !!event;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 8,
    maxPlayersPerTeam: 11,
    registrationDeadline: '',
    pursePerTeam: 1000000,
    isPublished: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        location: event.location || '',
        maxTeams: event.maxTeams || 8,
        maxPlayersPerTeam: event.maxPlayersPerTeam || 11,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
        pursePerTeam: event.pursePerTeam || 1000000,
        isPublished: event.isPublished || false,
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await apiService.updateEvent(event._id, formData);
      } else {
        await apiService.createEvent(formData);
      }
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-border bg-black/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-white">
          {isEditMode ? 'EDIT EVENT' : 'CREATE NEW EVENT'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 text-white transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-white/90 mb-2">
            EVENT NAME *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors"
            placeholder="e.g., NIGHTMARE CUP 2026"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-bold text-white/90 mb-2">
            DESCRIPTION
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors resize-none"
            placeholder="Describe your event..."
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-bold text-white/90 mb-2">
              START DATE *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-bold text-white/90 mb-2">
              END DATE *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Location & Registration Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-bold text-white/90 mb-2">
              LOCATION
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white placeholder-white/40 focus:border-primary focus:outline-none transition-colors"
              placeholder="Event location"
            />
          </div>

          <div>
            <label htmlFor="registrationDeadline" className="block text-sm font-bold text-white/90 mb-2">
              REGISTRATION DEADLINE
            </label>
            <input
              type="date"
              id="registrationDeadline"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Team & Player Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="maxTeams" className="block text-sm font-bold text-white/90 mb-2">
              MAX TEAMS *
            </label>
            <input
              type="number"
              id="maxTeams"
              name="maxTeams"
              value={formData.maxTeams}
              onChange={handleChange}
              min="2"
              max="32"
              required
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="maxPlayersPerTeam" className="block text-sm font-bold text-white/90 mb-2">
              PLAYERS/TEAM *
            </label>
            <input
              type="number"
              id="maxPlayersPerTeam"
              name="maxPlayersPerTeam"
              value={formData.maxPlayersPerTeam}
              onChange={handleChange}
              min="5"
              max="25"
              required
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="pursePerTeam" className="block text-sm font-bold text-white/90 mb-2">
              PURSE/TEAM *
            </label>
            <input
              type="number"
              id="pursePerTeam"
              name="pursePerTeam"
              value={formData.pursePerTeam}
              onChange={handleChange}
              min="100000"
              step="100000"
              required
              className="w-full px-4 py-3 bg-black/50 border-2 border-white/10 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Published Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="w-5 h-5 bg-black/50 border-2 border-white/10 text-primary focus:ring-primary focus:ring-2"
          />
          <label htmlFor="isPublished" className="text-sm font-bold text-white/90">
            PUBLISH EVENT (Make visible to users)
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-black font-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEditMode ? 'UPDATE EVENT' : 'CREATE EVENT'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
