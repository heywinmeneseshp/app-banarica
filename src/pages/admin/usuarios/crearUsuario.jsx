import React from 'react';
import SecondLayout from 'layout/SecondLayout';

import styles from '@styles/crearUsuario.module.css';

//Components
import NuevoUsuario from "@assets/admin/NuevoUsuario";

//CSS


export default function crearUsuario() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nuevo usuario</h2>
                    <div className={styles.contenedor}>
                        <NuevoUsuario />
                    </div>
                </div>
            </SecondLayout>
        </div>
    )
}