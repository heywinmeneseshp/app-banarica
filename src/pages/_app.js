import React from 'react';
import Head from 'next/head';
import AppContext from '@context/AppContext';

//Hooks
import useAdminMenu from '@hooks/useAdminMenu';
import useAlmacenMenu from "@hooks/useAlmacenMenu";
import useInitialState from '@hooks/useInitialState';
import useInfoMenu from "@hooks/useInfoMenu";
import useMenu from '@hooks/useMenu';

//Componentes
import MainLayout from '@layout/MainLayout';


//CSS
import '@styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';



function MyApp({ Component, pageProps }) {

 ;
  const initialMenu = useMenu();
  const initialAdminMenu = useAdminMenu();
  const initialAlmacenMenu = useAlmacenMenu();
  const initialInfoMenu = useInfoMenu();
  const initialState = useInitialState();

  return (
    <>
      <AppContext.Provider value={{
        initialState, 
        initialMenu, 
        initialAdminMenu,
        initialAlmacenMenu,
        initialInfoMenu
        }}>

        <Head>
          <title>Banarica</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>

      </AppContext.Provider>
    </>
  );
}

export default MyApp;
