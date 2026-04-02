import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { eventsService } from '../data/eventsService.js';
import useEventAuth from '../hooks/useEventAuth.js';

const EventLoginPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { isAuthenticated, login } = useEventAuth(eventId);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [owners, setOwners] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('viewer');
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/events/${eventId}/auction`, { replace: true });
    }
  }, [eventId, isAuthenticated, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [summaryPayload, ownerPayload] = await Promise.all([
          eventsService.getEventSummary(),
          eventsService.getOwners(),
        ]);

        setSummary(summaryPayload);
        setOwners(ownerPayload);
        setOwnerId(ownerPayload[0]?.id || '');
      } catch (loadError) {
        setError(loadError.message || 'Failed to prepare event login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    try {
      login({ eventId, displayName, role, ownerId });
      navigate(`/events/${eventId}/auction`, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Login failed');
    }
  };

  return (
    <PageShell
      title="Event Login"
      subtitle="Login is event-specific. Owner login can bid; viewer login is read-only."
      accent="Secure Access"
    >
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <CyberCard className="p-6 sm:p-8">
            {loading && <p className="text-sm text-white/70">Preparing login...</p>}

            {!loading && (
              <>
                <h2 className="font-display text-3xl font-black uppercase text-white">
                  {summary?.title || 'Event'}
                </h2>
                <p className="mt-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">Event ID: {eventId}</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Display Name</span>
                    <input
                      value={displayName}
                      onChange={(inputEvent) => setDisplayName(inputEvent.target.value)}
                      type="text"
                      placeholder="Enter your name"
                      className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Role</span>
                    <select
                      value={role}
                      onChange={(inputEvent) => setRole(inputEvent.target.value)}
                      className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    >
                      <option value="viewer" className="bg-zinc-900">Viewer (read only)</option>
                      <option value="owner" className="bg-zinc-900">Owner (can bid)</option>
                    </select>
                  </label>

                  {role === 'owner' && (
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Owner Account</span>
                      <select
                        value={ownerId}
                        onChange={(inputEvent) => setOwnerId(inputEvent.target.value)}
                        className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                      >
                        {owners.map((owner) => (
                          <option key={owner.id} value={owner.id} className="bg-zinc-900">{owner.name}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {error && (
                    <p className="border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/events')}
                      className="border border-white/25 bg-black/60 px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-white/75 uppercase"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="border border-primary/60 bg-primary/20 px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-primary uppercase"
                    >
                      Login To Event
                    </button>
                  </div>
                </form>
              </>
            )}
          </CyberCard>
        </div>
      </section>
    </PageShell>
  );
};

export default EventLoginPage;
