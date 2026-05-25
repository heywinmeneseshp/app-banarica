import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@hooks/useAuth';
import { fetchAuthenticatedProfile, syncSessionFromProfile } from '@services/api/auth';
import { getStoredWarehouses, getToken } from 'utils/session';
import Footer from "@components/Footer";
import Header from '@components/shared/Header/Header';

export default function ThirdLayout({ children }) {
    const router = useRouter();
    const { user, setUser, setAlmacenByUser } = useAuth();

    const listar = useCallback(async () => {
        const token = getToken();

        if (!token) {
            router.replace('/login');
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
            router.replace('/login');
        }
    }, [router, setAlmacenByUser, setUser]);

    useEffect(() => {
        if (!user) {
            listar();
        }
    }, [listar, user]);

    if (!user) {
        return null;
    }

    return (
        <>
            <Header />
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
