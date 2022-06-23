import React from 'react';
import SecondLayout from 'layout/SecondLayout';

import styles from '@styles/crearUsuario.module.css';

//Components
import NuevoProveedor from '@assets/admin/NuevoProveedor';


//CSS


export default function crearTransporte() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nueva Proveedor</h2>
                    <div className={styles.contenedor}>
                        <NuevoProveedor />
                    </div>
                </div>
            </SecondLayout>
        </div>
    );
}