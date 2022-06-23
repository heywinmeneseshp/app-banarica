import React from 'react';
import SecondLayout from 'layout/SecondLayout';

import styles from '@styles/crearUsuario.module.css';

//Components
import NuevoConductor from '@assets/admin/NuevoConductor';

//CSS


export default function crearTransporte() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nuevo conductor</h2>
                    <div className={styles.contenedor}>
                        <NuevoConductor />
                    </div>
                </div>
            </SecondLayout>
        </div>
    );
}