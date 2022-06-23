import React from 'react';
import SecondLayout from 'layout/SecondLayout';

//Components
import NuevoCombo from '@assets/admin/NuevoCombo';

//CSS
import styles from '@styles/admin/crearProducto.module.css';

export default function crearProducto() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nuevo combo</h2>
                    <div className={styles.contenedor}>
                        <NuevoCombo />
                    </div>
                </div>
            </SecondLayout>
        </div>
    );
}