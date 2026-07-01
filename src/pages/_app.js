import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppContext from '@context/AppContext';
import { ProviderAuth, useAuth } from '@hooks/useAuth';
import useNotificacion from '@hooks/useNotificacion';
import useMenu from '@hooks/useMenu';
import usePedido from '@hooks/usePedido';
import MainLayout from '@layout/MainLayout';
import RootLayout from '@layout/RootLayout';
import FeedbackProvider from '@components/shared/feedback/FeedbackProvider';
import '@styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { encontrarEmpresa } from '@services/api/configuracion';

const appShellRoutes = ['/', '/Seguridad/[item]', '/Transporte/[item]', '/Almacen/[item]', '/Informes/[item]', '/Maestros/[item]'];

function AppShell({ Component, pageProps, useAppShell }) {
    const { user } = useAuth();
    const showShell = useAppShell && !!user;

    return showShell ? (
        <RootLayout showChrome>
            <Component {...pageProps} />
        </RootLayout>
    ) : (
        <Component {...pageProps} />
    );
}

function MyApp({ Component, pageProps }) {
    const [nombreApp, setNombreApp] = useState("");
    const router = useRouter();
    const useAppShell = appShellRoutes.includes(router.pathname);

    const initialMenu = useMenu();
    const gestionNotificacion = useNotificacion();
    const gestionPedido = usePedido();

    useEffect(() => {
        encontrarEmpresa().then((res) => setNombreApp(res.nombreComercial));
    }, []);

    return (
        <ProviderAuth>
            <FeedbackProvider>
                <AppContext.Provider value={{
                    gestionNotificacion,
                    initialMenu,
                    gestionPedido,
                    nombreApp,
                }}>
                    <Head>
                        <title>{nombreApp}</title>
                        <meta name="description" content="LogiCrack - Aplicación de gestión logística, desarrollada por Craken.com.co" />
                        <meta name="author" content="Craken.com.co" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>

                    <MainLayout>
                        <AppShell
                            Component={Component}
                            pageProps={pageProps}
                            useAppShell={useAppShell}
                        />
                    </MainLayout>
                </AppContext.Provider>
            </FeedbackProvider>
        </ProviderAuth>
    );
}

export default MyApp;
