import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Proveedor from '@containers/Admin/Proveedor';

//CSS


export default function proveedores() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Proveedor/>
                </div>
            </SecondLayout>
        </div>
    );
}