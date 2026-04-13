import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AdminPayload {
  role: 'admin';
  timestamp: number;
}

export interface EventSessionPayload {
  eventId: string;
  displayName: string;
  role: 'owner' | 'guest';
  ownerId?: string;
}

export const authService = {
  // Admin authentication
  verifyAdminPassword(password: string): boolean {
    return password === env.ADMIN_PASSWORD;
  },

  generateAdminToken(): string {
    const payload: AdminPayload = {
      role: 'admin',
      timestamp: Date.now(),
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  },

  verifyAdminToken(token: string): AdminPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AdminPayload;
      return decoded.role === 'admin' ? decoded : null;
    } catch {
      return null;
    }
  },

  // Event session authentication
  generateEventSessionToken(payload: EventSessionPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  },

  verifyEventSessionToken(token: string): EventSessionPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as EventSessionPayload;
    } catch {
      return null;
    }
  },
};
