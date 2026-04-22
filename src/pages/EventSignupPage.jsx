import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import { CyberCard } from '../components/ui/index.jsx';
import { eventsService } from '../data/eventsService.js';

const toTrimmed = (value) => String(value || '').trim();

const EVENT_PASSWORD_MIN = 4;
const OWNER_PASSWORD_MIN = 6;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const NAME_REGEX = /^.{1,100}$/;
const TEAM_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s&.'-]{1,99}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PLAYER_ROLES = ['IGL', 'Support', 'Assaulter', 'Rusher'];

const getSignupUploadFolder = (eventId, role) => `${toTrimmed(eventId)}/signup/${role}`;

const validateImageFile = (file) => {
  if (!file) {
    return 'Please choose an image file to upload.';
  }

  if (!file.type.startsWith('image/')) {
    return 'Please upload a valid image file.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image size must be 8 MB or less.';
  }

  return '';
};

const validateOwnerForm = (values) => {
  const ownerName = toTrimmed(values.ownerName);
  const teamName = toTrimmed(values.teamName);
  const eventPassword = toTrimmed(values.eventPassword);
  const ownerEmail = toTrimmed(values.ownerEmail).toLowerCase();
  const ownerPassword = toTrimmed(values.ownerPassword);
  const avatarUrl = toTrimmed(values.avatarUrl);

  if (eventPassword.length < EVENT_PASSWORD_MIN) {
    return 'Event password must be at least 4 characters.';
  }
  if (!NAME_REGEX.test(ownerName)) {
    return 'Owner name format is invalid.';
  }
  if (!EMAIL_REGEX.test(ownerEmail)) {
    return 'Owner email format is invalid.';
  }
  if (ownerPassword.length < OWNER_PASSWORD_MIN) {
    return 'Owner password must be at least 6 characters.';
  }
  if (!TEAM_REGEX.test(teamName)) {
    return 'Team name format is invalid.';
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
  const rank = toTrimmed(values.rank);
  const imageUrl = toTrimmed(values.imageUrl);

  if (eventPassword.length < EVENT_PASSWORD_MIN) {
    return 'Event password must be at least 4 characters.';
  }
  if (!NAME_REGEX.test(playerName)) {
    return 'Player name format is invalid.';
  }
  if (!VALID_PLAYER_ROLES.includes(playerRole)) {
    return 'Player role must be selected from available options.';
  }
  if (!rank) {
    return 'Rank is required.';
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
  const [ownerUploadingImage, setOwnerUploadingImage] = useState(false);
  const [playerUploadingImage, setPlayerUploadingImage] = useState(false);

  const [ownerForm, setOwnerForm] = useState({
    eventPassword: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    avatarUrl: '',
    teamName: '',
  });

  const [playerForm, setPlayerForm] = useState({
    eventPassword: '',
    playerName: '',
    playerRole: '',
    rank: '',
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

  const handleOwnerImageUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    setError('');
    setSuccess('');

    const validationMessage = validateImageFile(selectedFile);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setOwnerUploadingImage(true);
    try {
      const uploaded = await eventsService.uploadPublicImage(selectedFile, {
        folder: getSignupUploadFolder(eventId, 'owner'),
      });

      setOwnerForm((prev) => ({
        ...prev,
        avatarUrl: uploaded.imageUrl || uploaded.originalUrl || '',
      }));
      setSuccess('Avatar uploaded to Cloudinary successfully.');
    } catch (uploadError) {
      setError(uploadError.message || 'Avatar upload failed');
    } finally {
      setOwnerUploadingImage(false);
      event.target.value = '';
    }
  };

  const handlePlayerImageUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    setError('');
    setSuccess('');

    const validationMessage = validateImageFile(selectedFile);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setPlayerUploadingImage(true);
    try {
      const uploaded = await eventsService.uploadPublicImage(selectedFile, {
        folder: getSignupUploadFolder(eventId, 'player'),
      });

      setPlayerForm((prev) => ({
        ...prev,
        imageUrl: uploaded.imageUrl || uploaded.originalUrl || '',
      }));
      setSuccess('Player image uploaded to Cloudinary successfully.');
    } catch (uploadError) {
      setError(uploadError.message || 'Player image upload failed');
    } finally {
      setPlayerUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleOwnerSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validateOwnerForm(ownerForm);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (ownerUploadingImage) {
      setError('Please wait until avatar upload finishes.');
      return;
    }

    setSubmitting(true);
    try {
      await eventsService.signupOwner(eventId, {
        eventPassword: toTrimmed(ownerForm.eventPassword),
        ownerName: toTrimmed(ownerForm.ownerName),
        ownerEmail: toTrimmed(ownerForm.ownerEmail).toLowerCase(),
        ownerPassword: toTrimmed(ownerForm.ownerPassword),
        avatarUrl: toTrimmed(ownerForm.avatarUrl) || undefined,
        teamName: toTrimmed(ownerForm.teamName),
      });

      setSuccess('Owner and team registration completed. You can now sign in as owner.');
      setOwnerForm({
        eventPassword: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        avatarUrl: '',
        teamName: '',
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

    if (playerUploadingImage) {
      setError('Please wait until player image upload finishes.');
      return;
    }

    setSubmitting(true);
    try {
      await eventsService.signupPlayer(eventId, {
        eventPassword: toTrimmed(playerForm.eventPassword),
        playerName: toTrimmed(playerForm.playerName),
        playerRole: toTrimmed(playerForm.playerRole),
        rank: toTrimmed(playerForm.rank),
        imageUrl: toTrimmed(playerForm.imageUrl) || undefined,
      });

      setSuccess('Player registration completed successfully.');
      setPlayerForm({
        eventPassword: '',
        playerName: '',
        playerRole: '',
        rank: '',
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
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Owner Email</span>
                  <input
                    type="email"
                    value={ownerForm.ownerEmail}
                    onChange={(e) => setOwnerForm({ ...ownerForm, ownerEmail: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="owner@example.com"
                    autoComplete="off"
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

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Avatar Image Upload (optional)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleOwnerImageUpload}
                    disabled={ownerUploadingImage || submitting}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 py-2 text-xs text-white/80 file:mr-3 file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.18em] file:text-primary disabled:opacity-60"
                  />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {ownerUploadingImage ? 'Uploading avatar...' : 'Cloudinary will crop to square and optimize format.'}
                  </p>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Avatar URL (auto-filled after upload)</span>
                  <input
                    type="url"
                    value={ownerForm.avatarUrl}
                    onChange={(e) => setOwnerForm({ ...ownerForm, avatarUrl: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="https://..."
                    autoComplete="off"
                  />
                </label>

                {ownerForm.avatarUrl && (
                  <div className="sm:col-span-2 overflow-hidden border border-white/15 bg-black/50 p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/45">Avatar Preview</p>
                    <img
                      src={ownerForm.avatarUrl}
                      alt="Owner avatar preview"
                      className="h-24 w-24 object-cover"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || ownerUploadingImage}
                  className="sm:col-span-2 h-11 border border-primary/60 bg-primary/20 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : ownerUploadingImage ? 'Uploading Image...' : 'Complete Owner Signup'}
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
                  <select
                    value={playerForm.playerRole}
                    onChange={(e) => setPlayerForm({ ...playerForm, playerRole: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                  >
                    <option value="">-- Select Role --</option>
                    {VALID_PLAYER_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Rank</span>
                  <input
                    type="text"
                    value={playerForm.rank}
                    onChange={(e) => setPlayerForm({ ...playerForm, rank: e.target.value })}
                    placeholder="e.g. 92 or Elite"
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Player Image Upload (optional)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handlePlayerImageUpload}
                    disabled={playerUploadingImage || submitting}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 py-2 text-xs text-white/80 file:mr-3 file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.18em] file:text-primary disabled:opacity-60"
                  />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {playerUploadingImage ? 'Uploading player image...' : 'Cloudinary will crop to square and optimize format.'}
                  </p>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">Image URL (auto-filled after upload)</span>
                  <input
                    type="url"
                    value={playerForm.imageUrl}
                    onChange={(e) => setPlayerForm({ ...playerForm, imageUrl: e.target.value })}
                    className="h-11 w-full border border-white/20 bg-black/65 px-3 text-sm text-white outline-none focus:border-primary/70"
                    placeholder="https://..."
                    autoComplete="off"
                  />
                </label>

                {playerForm.imageUrl && (
                  <div className="sm:col-span-2 overflow-hidden border border-white/15 bg-black/50 p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/45">Player Preview</p>
                    <img
                      src={playerForm.imageUrl}
                      alt="Player preview"
                      className="h-24 w-24 object-cover"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || playerUploadingImage}
                  className="sm:col-span-2 h-11 border border-primary/60 bg-primary/20 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : playerUploadingImage ? 'Uploading Image...' : 'Complete Player Signup'}
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
