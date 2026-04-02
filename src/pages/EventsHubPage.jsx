import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { eventsService } from '../data/eventsService.js';
import { eventAuthService } from '../data/eventAuthService.js';

const EventsHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const payload = await eventsService.getEventSummary();
        setSummary(payload);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load event details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleOpenAuction = () => {
    if (!summary?.id) {
      return;
    }

    if (eventAuthService.isAuthenticated(summary.id)) {
      navigate(`/events/${summary.id}/auction`);
      return;
    }

    navigate(`/events/login/${summary.id}`);
  };

  return (
    <PageShell
      title="Events"
      subtitle="Select an event to join the live selection."
      accent="Event Management"
    >
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl space-y-5">
          {loading && (
            <CyberCard className="p-8">
              <p className="font-display text-2xl font-black uppercase text-white">Loading Events...</p>
            </CyberCard>
          )}

          {!loading && error && (
            <CyberCard className="border border-red-500/50 bg-red-500/10 p-6">
              <p className="text-sm text-red-200">{error}</p>
            </CyberCard>
          )}

          {!loading && summary && (
            <CyberCard accent className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black tracking-[0.26em] text-primary uppercase">
                <Calendar className="h-3.5 w-3.5" />
                Live Tournament
              </div>
              <h2 className="mt-5 font-display text-3xl leading-tight font-black uppercase sm:text-4xl lg:text-5xl">
                {summary.title}
                <span className="block text-primary">{summary.season}</span>
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
                Join the live event to participate in player acquisitions. Authenticate to gain full access to bidding and selection features.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <StatBox label="Game" value={summary.game} />
                <StatBox label="Mode" value={summary.mode} />
                <StatBox label="Stream" value={summary.streamStart} />
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleOpenAuction}
                  className="border border-primary/60 bg-primary/20 px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-primary uppercase transition-colors hover:bg-primary/30"
                >
                  Join Event
                </button>
              </div>
            </CyberCard>
          )}
        </div>
      </section>
    </PageShell>
  );
};

const StatBox = ({ label, value }) => (
  <div className="border border-white/10 bg-black/70 p-4">
    <p className="text-[10px] font-bold tracking-[0.24em] text-white/40 uppercase">{label}</p>
    <p className="mt-2 text-lg font-bold text-white">{value}</p>
  </div>
);

export default EventsHubPage;
