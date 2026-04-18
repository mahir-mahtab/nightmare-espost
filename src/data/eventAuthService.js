import { config } from '../config.js';

const STORAGE_PREFIX = 'nm-event-auth:';

const parseSession = (value) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      role: parsed.role === 'viewer' ? 'guest' : parsed.role,
    };
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

const decodeJwtExp = (token) => {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));

    if (!payload?.exp) {
      return null;
    }

    return Number(payload.exp) * 1000;
  } catch {
    return null;
  }
};

const formatApiError = (payload, fallbackMessage) => {
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

  async login({ eventId, password, role, ownerId = '', ownerPassword = '' }) {
    if (!eventId) {
      throw new Error('Event identifier is required');
    }

    if (!password?.trim()) {
      throw new Error('Please enter the event password');
    }

    if (!['owner', 'guest'].includes(role)) {
      throw new Error('Invalid account type');
    }

    if (role === 'owner' && !ownerId) {
      throw new Error('Please select an owner account');
    }

    if (role === 'owner' && !ownerPassword?.trim()) {
      throw new Error('Please enter the owner password');
    }

    const response = await fetch(`${config.apiUrl}/events/${eventId}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: password.trim(),
        role,
        ownerId: role === 'owner' ? ownerId : undefined,
        ownerPassword: role === 'owner' ? ownerPassword.trim() : undefined,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(formatApiError(payload, 'Login unsuccessful'));
    }

    const sessionToken = payload?.data?.sessionToken;
    if (!sessionToken) {
      throw new Error('Session could not be established. Please try again.');
    }

    const expiresAt = decodeJwtExp(sessionToken) || Date.now() + (1000 * 60 * 60 * 8);
    const session = {
      eventId: payload?.data?.eventId || eventId,
      eventSlug: payload?.data?.eventSlug || eventId,
      displayName: payload?.data?.displayName || (role === 'owner' ? 'Owner' : 'Guest'),
      role: payload?.data?.role || role,
      ownerId: payload?.data?.ownerId || (role === 'owner' ? ownerId : ''),
      sessionToken,
      createdAt: Date.now(),
      expiresAt,
    };

    localStorage.setItem(buildStorageKey(eventId), JSON.stringify(session));
    return session;
  },

  async validate(eventId) {
    const session = this.getSession(eventId);
    if (!session?.sessionToken) {
      return null;
    }

    const response = await fetch(`${config.apiUrl}/events/${eventId}/auth/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
      },
    });

    if (!response.ok) {
      this.logout(eventId);
      return null;
    }

    return this.getSession(eventId);
  },

  async logout(eventId) {
    if (!eventId) {
      return;
    }

    const session = this.getSession(eventId);
    if (session?.sessionToken) {
      await fetch(`${config.apiUrl}/events/${eventId}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.sessionToken}`,
        },
      }).catch(() => {});
    }

    localStorage.removeItem(buildStorageKey(eventId));
  },
};
