import React from 'react';
import Head from 'next/head';
import AppContext from '@context/AppContext';
import { ProviderAuth } from '@hooks/useAuth';

//Hooks
import useAdminMenu from '@hooks/useAdminMenu';
import useAlmacenMenu from "@hooks/useAlmacenMenu";
import useNotificacion from '@hooks/useNotificacion';
import useInfoMenu from "@hooks/useInfoMenu";
import useMenu from '@hooks/useMenu';
import usePedido from '@hooks/usePedido';

//Componentes
import MainLayout from '@layout/MainLayout';


//CSS
import '@styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';




function MyApp({ Component, pageProps }) {


    const initialMenu = useMenu();
    const initialAdminMenu = useAdminMenu();
    const initialAlmacenMenu = useAlmacenMenu();
    const initialInfoMenu = useInfoMenu();
    const gestionNotificacion = useNotificacion();
    const gestionPedido = usePedido();

    return (
        <>
            <ProviderAuth>
                <AppContext.Provider value={{
                    gestionNotificacion,
                    initialMenu,
                    initialAdminMenu,
                    initialAlmacenMenu,
                    initialInfoMenu,
                    gestionPedido
                }}>

                    <Head>
                        <title>Transmonsa</title>
                        <meta name="Transmonsa - App de gestion logisitca" content="Creado por Craken.com.co" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>

                    <MainLayout>
                        <Component {...pageProps} />
                    </MainLayout>

                </AppContext.Provider>
            </ProviderAuth>
        </>
    );
}

export default MyApp;
