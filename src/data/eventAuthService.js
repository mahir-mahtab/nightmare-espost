import { config } from '../config.js';

const STORAGE_PREFIX = 'nm-event-auth:';

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

  async login({ eventId, password, displayName, role, ownerId = '' }) {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    if (!password?.trim()) {
      throw new Error('Event password is required');
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

    const response = await fetch(`${config.apiUrl}/events/${eventId}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: password.trim(),
        displayName: displayName.trim(),
        role,
        ownerId: role === 'owner' ? ownerId : undefined,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Login failed');
    }

    const sessionToken = payload?.data?.sessionToken;
    if (!sessionToken) {
      throw new Error('Session token missing from login response');
    }

    const expiresAt = decodeJwtExp(sessionToken) || Date.now() + (1000 * 60 * 60 * 8);
    const session = {
      eventId,
      displayName: payload?.data?.displayName || displayName.trim(),
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
