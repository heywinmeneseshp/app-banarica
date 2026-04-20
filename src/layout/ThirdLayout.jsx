import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
//Hooks
import { useAuth } from '@hooks/useAuth';
import { fetchAuthenticatedProfile, syncSessionFromProfile } from '@services/api/auth';
import { clearSession, getStoredWarehouses, getToken } from 'utils/session';
//Component
import Footer from "@components/Footer";
import Header from '@components/shared/Header/Header';
//CSS
import styles from '@styles/Layout.module.css';

export default function ThirdLayout({ children }) {
    const router = useRouter();
    const { user, setUser, setAlmacenByUser } = useAuth();

    const listar = useCallback(async () => {
        const token = getToken();
        if (!token) {
            clearSession();
            setUser(null);
            router.push('/login');
            window.alert("Tu sesion ha caducado. Por favor, inicia sesion nuevamente para continuar utilizando la aplicacion.");
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
        } catch (error) {
            console.error("Error al obtener el perfil del usuario:", error);
        }
    }, [router, setAlmacenByUser, setUser]);

    useEffect(() => {
        listar();
    }, [listar]);

    if (user) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className='container'>{children}</div>
                </main>
                <Footer />
            </>
        );
    }
}
