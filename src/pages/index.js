import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppContext from '@context/AppContext';
//Hooks
import { useAuth } from '@hooks/useAuth';
//Components
import Inicio from '@containers/inicio/Inicio';
import SecondLayout from '@layout/SecondLayout';
import Adminsitrador from '@containers/administrador';
import Almacen from '@containers/almacen';
import Informes from '@containers/informes';
//CSS
import styles from '@styles/Layout.module.css';

export default function Home() {
    const { user } = useAuth();
    const { initialMenu } = useContext(AppContext);
    const router = useRouter();
    useEffect(() => {
        if (!user) router.push('/login');
    }, [user]);
    if (user) {
        return (
            <div>

                <SecondLayout>
                    <div className={styles.alto} >
                        {initialMenu.menu.inicio && <Inicio />}
                        {initialMenu.menu.administrador && <Adminsitrador />}
                        {initialMenu.menu.almacen && <Almacen />}
                        {initialMenu.menu.informes && <Informes />}
                    </div>
                </SecondLayout>

            </div>
        );
    }
}