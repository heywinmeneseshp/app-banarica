import React from 'react';
import SecondLayout from 'layout/SecondLayout';

import styles from '@styles/crearUsuario.module.css';

//Components
import NuevoTransporte from "@assets/admin/NuevoTransporte";


//CSS


export default function crearTransporte() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nueva Transportadora</h2>
                    <div className={styles.contenedor}>
                        <NuevoTransporte />
                    </div>
                </div>
            </SecondLayout>
        </div>
    )
}