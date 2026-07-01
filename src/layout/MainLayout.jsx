import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router';
import { useAuth } from '@hooks/useAuth';
import {
  clearSession,
  getLastActivityAt,
  getToken,
  setLastActivityAt,
  setSessionNotice,
} from 'utils/session';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_WINDOW_MS = 2 * 60 * 1000;
const PUBLIC_ROUTES = new Set(['/login', '/recovery']);
const ACTIVITY_THROTTLE_MS = 1000;

export default function MainLayout({ children }) {
  const router = useRouter();
  const { setUser, setAlmacenByUser } = useAuth();
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const logoutDeadlineRef = useRef(null);
  const lastHandledActivityRef = useRef(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(WARNING_WINDOW_MS / 1000);

  const isPublicRoute = PUBLIC_ROUTES.has(router.pathname);

  const clearInactivityTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const formatRemainingTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.max(seconds % 60, 0);
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }, []);

  const redirectToLogin = useCallback((message) => {
    clearInactivityTimers();
    setShowInactivityWarning(false);
    setRemainingSeconds(WARNING_WINDOW_MS / 1000);
    clearSession();
    setUser(null);
    setAlmacenByUser([]);

    if (message) {
      setSessionNotice(message);
    }

    if (router.pathname !== '/login') {
      router.replace('/login');
    }
  }, [clearInactivityTimers, router, setAlmacenByUser, setUser]);

  const startWarningCountdown = useCallback(() => {
    setShowInactivityWarning(true);

    const updateCountdown = () => {
      const remainingMs = Math.max((logoutDeadlineRef.current || Date.now()) - Date.now(), 0);
      setRemainingSeconds(Math.ceil(remainingMs / 1000));
    };

    updateCountdown();

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  }, []);

  const scheduleInactivityTimers = useCallback((lastActivityAt) => {
    const token = getToken();

    if (!token) {
      redirectToLogin('Tu sesion ha finalizado. Inicia sesion nuevamente para continuar.');
      return;
    }

    const now = Date.now();
    const safeLastActivityAt = Number.isFinite(lastActivityAt) && lastActivityAt > 0
      ? lastActivityAt
      : now;
    const logoutDeadline = safeLastActivityAt + SESSION_TIMEOUT_MS;
    const remainingMs = logoutDeadline - now;

    clearInactivityTimers();

    if (remainingMs <= 0) {
      redirectToLogin('La sesion se cerro por 30 minutos de inactividad. Inicia sesion nuevamente para continuar.');
      return;
    }

    setLastActivityAt(safeLastActivityAt);
    logoutDeadlineRef.current = logoutDeadline;
    setRemainingSeconds(Math.ceil(Math.min(remainingMs, WARNING_WINDOW_MS) / 1000));

    if (remainingMs <= WARNING_WINDOW_MS) {
      startWarningCountdown();
    } else {
      setShowInactivityWarning(false);
      warningTimeoutRef.current = setTimeout(
        startWarningCountdown,
        remainingMs - WARNING_WINDOW_MS,
      );
    }

    logoutTimeoutRef.current = setTimeout(() => {
      redirectToLogin('La sesion se cerro por 30 minutos de inactividad. Inicia sesion nuevamente para continuar.');
    }, remainingMs);
  }, [clearInactivityTimers, redirectToLogin, startWarningCountdown]);

  useEffect(() => {
    if (isPublicRoute) {
      clearInactivityTimers();
      setShowInactivityWarning(false);
      return undefined;
    }

    const token = getToken();

    if (!token) {
      router.replace('/login');
      return undefined;
    }

    const initializeLastActivity = getLastActivityAt() || Date.now();
    scheduleInactivityTimers(initializeLastActivity);

    const handleActivity = () => {
      if (document.hidden) {
        return;
      }

      const now = Date.now();
      if (now - lastHandledActivityRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastHandledActivityRef.current = now;
      scheduleInactivityTimers(now);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        return;
      }

      const storedLastActivity = getLastActivityAt() || Date.now();
      scheduleInactivityTimers(storedLastActivity);
    };

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearInactivityTimers, isPublicRoute, router, scheduleInactivityTimers]);

  useEffect(() => (
    () => {
      clearInactivityTimers();
    }
  ), [clearInactivityTimers]);

  return (
    <>
      {showInactivityWarning && !isPublicRoute && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3 px-3" style={{ zIndex: 1080 }}>
          <div className="alert alert-warning shadow-sm border-0 d-flex flex-column flex-md-row align-items-md-center gap-2 mb-0">
            <div>
              <strong>Tu sesion se cerrara en {formatRemainingTime(remainingSeconds)}</strong>
              <div className="small">
                Haz clic en &quot;Seguir activo&quot; o realiza una accion en la app para continuar.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-dark ms-md-3"
              onClick={() => scheduleInactivityTimers(Date.now())}
            >
              Seguir activo
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
