import React from 'react';
import SecondLayout from 'layout/SecondLayout';

//Components
import NuevoProducto from "@assets/admin/NuevoProducto";

//CSS
import styles from '@styles/admin/crearProducto.module.css';

export default function crearProducto() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.superContenedor}>
                <h2>+ Nuevo producto</h2>
                    <div className={styles.contenedor}>
                        <NuevoProducto />
                    </div>
                </div>
            </SecondLayout>
        </div>
    )
}