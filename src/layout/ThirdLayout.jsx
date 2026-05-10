import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
//Hooks
import { useAuth } from '@hooks/useAuth';
import { fetchAuthenticatedProfile, syncSessionFromProfile } from '@services/api/auth';
import { clearSession, getStoredWarehouses, getToken, persistToken, setSessionNotice } from 'utils/session';
//Component
import Footer from "@components/Footer";
import Header from '@components/shared/Header/Header';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_WINDOW_MS = 2 * 60 * 1000;
const TOKEN_REFRESH_THROTTLE_MS = 60 * 1000;

export default function ThirdLayout({ children }) {
    const router = useRouter();
    const { user, setUser, setAlmacenByUser } = useAuth();
    const warningTimeoutRef = useRef(null);
    const logoutTimeoutRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const logoutDeadlineRef = useRef(null);
    const lastRefreshRef = useRef(0);
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(WARNING_WINDOW_MS / 1000);

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

    const closeSession = useCallback((message) => {
        clearInactivityTimers();
        setShowInactivityWarning(false);
        clearSession();
        setUser(null);
        setAlmacenByUser([]);

        if (message) {
            setSessionNotice(message);
        }

        router.push('/login');
    }, [clearInactivityTimers, router, setAlmacenByUser, setUser]);

    const startWarningCountdown = useCallback(() => {
        setShowInactivityWarning(true);

        const updateCountdown = () => {
            const remainingMs = Math.max(logoutDeadlineRef.current - Date.now(), 0);
            setRemainingSeconds(Math.ceil(remainingMs / 1000));
        };

        updateCountdown();

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    }, []);

    const resetInactivityTimer = useCallback((refreshToken = true) => {
        const token = getToken();

        if (!token) {
            closeSession("Tu sesion ha caducado. Por favor, inicia sesion nuevamente para continuar utilizando la aplicacion.");
            return;
        }

        const now = Date.now();

        if (refreshToken && now - lastRefreshRef.current >= TOKEN_REFRESH_THROTTLE_MS) {
            persistToken(token);
            lastRefreshRef.current = now;
        }

        clearInactivityTimers();
        setShowInactivityWarning(false);
        setRemainingSeconds(WARNING_WINDOW_MS / 1000);
        logoutDeadlineRef.current = now + SESSION_TIMEOUT_MS;

        warningTimeoutRef.current = setTimeout(
            startWarningCountdown,
            SESSION_TIMEOUT_MS - WARNING_WINDOW_MS,
        );

        logoutTimeoutRef.current = setTimeout(() => {
            closeSession("La sesion se cerro por inactividad. Haz clic o presiona una tecla cuando aparezca el aviso para seguir trabajando.");
        }, SESSION_TIMEOUT_MS);
    }, [clearInactivityTimers, closeSession, startWarningCountdown]);

    const formatRemainingTime = useCallback((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.max(seconds % 60, 0);
        return `${minutes}:${remaining.toString().padStart(2, '0')}`;
    }, []);

    const listar = useCallback(async () => {
        const token = getToken();
        if (!token) {
            closeSession("Tu sesion ha caducado. Por favor, inicia sesion nuevamente para continuar utilizando la aplicacion.");
            return;
        }

        try {
            const profile = await fetchAuthenticatedProfile(token);
            if (profile.usuario.isBlock) {
                return window.alert("El usuario esta deshabilitado, por favor comuniquese con el administrador");
            }

            const { usuario } = syncSessionFromProfile(profile);
            setUser(usuario);
            setAlmacenByUser(getStoredWarehouses());
            lastRefreshRef.current = Date.now();
            resetInactivityTimer(false);
        } catch (error) {
            console.error("Error al obtener el perfil del usuario:", error);
        }
    }, [closeSession, resetInactivityTimer, setAlmacenByUser, setUser]);

    useEffect(() => {
        listar();
    }, [listar]);

    useEffect(() => {
        if (!user) {
            return undefined;
        }

        const handleActivity = () => {
            resetInactivityTimer(true);
        };

        const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

        events.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });

        return () => {
            events.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
        };
    }, [resetInactivityTimer, user]);

    useEffect(() => (
        () => {
            clearInactivityTimers();
        }
    ), [clearInactivityTimers]);

    if (user) {
        return (
            <>
                <Header />
                {showInactivityWarning && (
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
                                onClick={() => resetInactivityTimer(true)}
                            >
                                Seguir activo
                            </button>
                        </div>
                    </div>
                )}
                <main className="app-shell-main py-3 py-md-4">
                    <div className="container-fluid px-3 px-md-4 px-xl-5">
                        <div className="app-content-shell mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return null;
}
