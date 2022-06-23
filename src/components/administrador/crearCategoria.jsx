import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/crearUsuario.module.css';

//Components
import NuevaCategoria from '@assets/admin/NuevaCategoria';

//CSS


export default function crearCategoria() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                    <h2>+ Nueva categoría</h2>
                    <div className={styles.contenedor}>
                        <NuevaCategoria />
                    </div>
                </div>
            </SecondLayout>
        </div>
    );
}