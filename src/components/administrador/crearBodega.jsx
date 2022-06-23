import React from 'react';
import styles from '@styles/crearUsuario.module.css';

//Components
import NuevaBodega from '@assets/admin/NuevaBodega';

//CSS


export default function crearBodega() {
    return (
        <div>
            <div className={styles.superContenedor}>
                <h2>+ Nuevo almacén</h2>
                <div className={styles.contenedor}>
                    <NuevaBodega />
                </div>
            </div>
        </div>
    );
}