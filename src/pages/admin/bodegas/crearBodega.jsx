import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/crearUsuario.module.css';

//Components
import NuevaBodega from '@assets/admin/NuevaBodega'

//CSS


export default function crearBodega() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                    <h2>+ Nuevo almacén</h2>
                    <div className={styles.contenedor}>
                        <NuevaBodega />
                    </div>
                </div>
            </SecondLayout>
        </div>
    )
}