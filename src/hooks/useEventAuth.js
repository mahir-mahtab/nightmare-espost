import { useCallback, useEffect, useMemo, useState } from 'react';
import { eventAuthService } from '../data/eventAuthService.js';

const useEventAuth = (eventId) => {
  const [session, setSession] = useState(() => eventAuthService.getSession(eventId));

  useEffect(() => {
    setSession(eventAuthService.getSession(eventId));
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const validated = await eventAuthService.validate(eventId);
      if (isMounted) {
        setSession(validated);
      }
    };

    if (eventId) {
      validateSession();
    }

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const login = useCallback((payload) => {
    return eventAuthService.login(payload).then((nextSession) => {
      setSession(nextSession);
      return nextSession;
    });
  }, []);

  const logout = useCallback(() => {
    eventAuthService.logout(eventId).finally(() => {
      setSession(null);
    });
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
