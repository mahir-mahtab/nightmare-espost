const STORAGE_PREFIX = 'nm-event-auth:';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const parseSession = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const buildStorageKey = (eventId) => `${STORAGE_PREFIX}${eventId}`;

const isExpired = (session) => {
  if (!session?.expiresAt) {
    return true;
  }

  return Date.now() > session.expiresAt;
};

export const eventAuthService = {
  getSession(eventId) {
    if (!eventId) {
      return null;
    }

    const parsed = parseSession(localStorage.getItem(buildStorageKey(eventId)));

    if (!parsed || isExpired(parsed)) {
      localStorage.removeItem(buildStorageKey(eventId));
      return null;
    }

    return parsed;
  },

  isAuthenticated(eventId) {
    return Boolean(this.getSession(eventId));
  },

  login({ eventId, displayName, role, ownerId = '' }) {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    if (!displayName?.trim()) {
      throw new Error('Display name is required');
    }

    if (!['owner', 'viewer'].includes(role)) {
      throw new Error('Invalid role');
    }

    if (role === 'owner' && !ownerId) {
      throw new Error('Owner selection is required');
    }

    const now = Date.now();
    const session = {
      eventId,
      displayName: displayName.trim(),
      role,
      ownerId: role === 'owner' ? ownerId : '',
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    localStorage.setItem(buildStorageKey(eventId), JSON.stringify(session));
    return session;
  },

  logout(eventId) {
    if (!eventId) {
      return;
    }

    localStorage.removeItem(buildStorageKey(eventId));
  },
};
