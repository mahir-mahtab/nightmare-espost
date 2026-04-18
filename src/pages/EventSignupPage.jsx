import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { eventsService } from '../data/eventsService.js';

const toTrimmed = (value) => String(value || '').trim();

const EVENT_PASSWORD_MIN = 4;
const OWNER_PASSWORD_MIN = 6;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,99}$/;
const TEAM_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s&.'-]{1,99}$/;
const ROLE_REGEX = /^[A-Za-z][A-Za-z0-9\s/-]{1,39}$/;

const validateOwnerForm = (values) => {
  const ownerName = toTrimmed(values.ownerName);
  const teamName = toTrimmed(values.teamName);
  const eventPassword = toTrimmed(values.eventPassword);
  const ownerPassword = toTrimmed(values.ownerPassword);
  const avatarUrl = toTrimmed(values.avatarUrl);
  const coinsLeft = Number(values.coinsLeft);

  if (eventPassword.length < EVENT_PASSWORD_MIN) {
    return 'Event password must be at least 4 characters.';
  }
  if (!NAME_REGEX.test(ownerName)) {
    return 'Owner name format is invalid.';
  }
  if (ownerPassword.length < OWNER_PASSWORD_MIN) {
    return 'Owner password must be at least 6 characters.';
  }
  if (!TEAM_REGEX.test(teamName)) {
    return 'Team name format is invalid.';
  }
  if (!Number.isInteger(coinsLeft) || coinsLeft < 0 || coinsLeft > 100000) {
    return 'Coins must be a whole number between 0 and 100000.';
  }
  if (avatarUrl) {
    try {
      new URL(avatarUrl);
    } catch {
      return 'Avatar URL must be a valid URL.';
    }
  }

  return '';
};

const validatePlayerForm = (values) => {
  const eventPassword = toTrimmed(values.eventPassword);
  const playerName = toTrimmed(values.playerName);
  const playerRole = toTrimmed(values.playerRole);
  const rankPoint = Number(values.rankPoint);
  const basePrice = Number(values.basePrice);
  const imageUrl = toTrimmed(values.imageUrl);

  if (eventPassword.length < EVENT_PASSWORD_MIN) {
    return 'Event password must be at least 4 characters.';
  }
  if (!NAME_REGEX.test(playerName)) {
    return 'Player name format is invalid.';
  }
  if (!ROLE_REGEX.test(playerRole)) {
    return 'Player role format is invalid.';
  }
  if (!Number.isInteger(rankPoint) || rankPoint < 0 || rankPoint > 100) {
    return 'Rank point must be a whole number between 0 and 100.';
  }
  if (!Number.isInteger(basePrice) || basePrice < 0 || basePrice > 100000) {
    return 'Base price must be a whole number between 0 and 100000.';
  }
  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch {
      return 'Image URL must be a valid URL.';
    }
  }

  return '';
};

const EventSignupPage = () => {
  const { eventId = '', type = '' } = useParams();
  const signupType = useMemo(() => (type === 'owner' ? 'owner' : type === 'player' ? 'player' : ''), [type]);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [ownerForm, setOwnerForm] = useState({
    eventPassword: '',
    ownerName: '',
    ownerPassword: '',
    avatarUrl: '',
    teamName: '',
    coinsLeft: 0,
  });

  const [playerForm, setPlayerForm] = useState({
    eventPassword: '',
    playerName: '',
    playerRole: '',
    rankPoint: 0,
    basePrice: 0,
    imageUrl: '',
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!eventId) {
        setError('This signup link is invalid.');
        setLoading(false);
        return;
      }

      if (!signupType) {
        setError('This signup link supports owner or player registration only.');
        setLoading(false);
        return;
      }

      try {
        const context = await eventsService.getSignupContext(eventId);
        if (!mounted) {
          return;
        }
        setSummary(context?.event || null);
        setError('');
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Unable to load signup page');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [eventId, signupType]);

  const handleOwnerSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validateOwnerForm(ownerForm);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await eventsService.signupOwner(eventId, {
        eventPassword: toTrimmed(ownerForm.eventPassword),
        ownerName: toTrimmed(ownerForm.ownerName),
        ownerPassword: toTrimmed(ownerForm.ownerPassword),
        avatarUrl: toTrimmed(ownerForm.avatarUrl) || undefined,
        teamName: toTrimmed(ownerForm.teamName),
        coinsLeft: Number(ownerForm.coinsLeft),
      });

      setSuccess('Owner and team registration completed. You can now sign in as owner.');
      setOwnerForm({
        eventPassword: '',
        ownerName: '',
        ownerPassword: '',
        avatarUrl: '',
        teamName: '',
        coinsLeft: 0,
      });
    } catch (submitError) {
      setError(submitError.message || 'Owner signup could not be completed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayerSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validatePlayerForm(playerForm);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await eventsService.signupPlayer(eventId, {
        eventPassword: toTrimmed(playerForm.eventPassword),
        playerName: toTrimmed(playerForm.playerName),
        playerRole: toTrimmed(playerForm.playerRole),
        rankPoint: Number(playerForm.rankPoint),
        basePrice: Number(playerForm.basePrice),
        imageUrl: toTrimmed(playerForm.imageUrl) || undefined,
      });

      setSuccess('Player registration completed successfully.');
      setPlayerForm({
        eventPassword: '',
        playerName: '',
        playerRole: '',
        rankPoint: 0,
        basePrice: 0,
        imageUrl: '',
      });
    } catch (submitError) {
      setError(submitError.message || 'Player signup could not be completed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Event Signup"
      subtitle="Private signup links only. Fill details carefully before submitting."
      accent="Invite Only"
    >
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {loading ? (
          <CyberCard className="border border-white/15 bg-black/60 p-6 text-sm text-white/70">Preparing signup form...</CyberCard>
        ) : error && !summary ? (
          <CyberCard className="border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">{error}</CyberCard>
        ) : (
          <CyberCard className="border border-white/15 bg-black/60 p-6">
            <div className="mb-6 border-b border-white/10 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">Restricted Link</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">{summary?.title || 'Event'}</h2>
              <p className="mt-1 text-xs text-white/60">{signupType === 'owner' ? 'Owner Signup' : 'Player Signup'} | {summary?.game || 'Game'}{summary?.season ? ` | ${summary.season}` : ''}</p>
            </div>

            {error && (
              <div className="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>
            )}

            {success && (
              <div className="mb-4 border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{success}</div>
            )}

            {signupType === 'owner' ? (
              <form onSubmit={handleOwnerSubmit} className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Event Password</span>
                  <input
                    type="password"
                    value={ownerForm.eventPassword}
                    onChange={(e) => setOwnerForm({ ...ownerForm, eventPassword: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="Required"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Owner Name</span>
                  <input
                    type="text"
                    value={ownerForm.ownerName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="e.g. John Doe"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Owner Password</span>
                  <input
                    type="password"
                    value={ownerForm.ownerPassword}
                    onChange={(e) => setOwnerForm({ ...ownerForm, ownerPassword: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="At least 6 chars"
                    autoComplete="new-password"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Team Name</span>
                  <input
                    type="text"
                    value={ownerForm.teamName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, teamName: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="e.g. Falcon Warriors"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Team Coins</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={ownerForm.coinsLeft}
                    onChange={(e) => setOwnerForm({ ...ownerForm, coinsLeft: Number(e.target.value || 0) })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Avatar URL (optional)</span>
                  <input
                    type="url"
                    value={ownerForm.avatarUrl}
                    onChange={(e) => setOwnerForm({ ...ownerForm, avatarUrl: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="https://..."
                    autoComplete="off"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 h-11 border border-primary/60 bg-primary/20 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Complete Owner Signup'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePlayerSubmit} className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Event Password</span>
                  <input
                    type="password"
                    value={playerForm.eventPassword}
                    onChange={(e) => setPlayerForm({ ...playerForm, eventPassword: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="Required"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Player Name</span>
                  <input
                    type="text"
                    value={playerForm.playerName}
                    onChange={(e) => setPlayerForm({ ...playerForm, playerName: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="e.g. Shadow Ace"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Role</span>
                  <input
                    type="text"
                    value={playerForm.playerRole}
                    onChange={(e) => setPlayerForm({ ...playerForm, playerRole: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="e.g. IGL"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Rank Point</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={playerForm.rankPoint}
                    onChange={(e) => setPlayerForm({ ...playerForm, rankPoint: Number(e.target.value || 0) })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Base Price</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={playerForm.basePrice}
                    onChange={(e) => setPlayerForm({ ...playerForm, basePrice: Number(e.target.value || 0) })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Image URL (optional)</span>
                  <input
                    type="url"
                    value={playerForm.imageUrl}
                    onChange={(e) => setPlayerForm({ ...playerForm, imageUrl: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="https://..."
                    autoComplete="off"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 h-11 border border-primary/60 bg-primary/20 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Complete Player Signup'}
                </button>
              </form>
            )}
          </CyberCard>
        )}
      </section>
    </PageShell>
  );
};

export default EventSignupPage;
