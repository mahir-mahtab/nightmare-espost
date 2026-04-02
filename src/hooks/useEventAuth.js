import { useCallback, useEffect, useMemo, useState } from 'react';
import { eventAuthService } from '../data/eventAuthService.js';

const useEventAuth = (eventId) => {
  const [session, setSession] = useState(() => eventAuthService.getSession(eventId));

  useEffect(() => {
    setSession(eventAuthService.getSession(eventId));
  }, [eventId]);

  const login = useCallback((payload) => {
    const nextSession = eventAuthService.login(payload);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    eventAuthService.logout(eventId);
    setSession(null);
  }, [eventId]);

  const refresh = useCallback(() => {
    setSession(eventAuthService.getSession(eventId));
  }, [eventId]);

  return useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
      refresh,
    }),
    [session, login, logout, refresh],
  );
};

export default useEventAuth;
