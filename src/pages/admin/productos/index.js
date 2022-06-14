import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Producto from '@containers/Admin/Producto';


//CSS


export default function productos() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Producto></Producto>
                </div>
            </SecondLayout>
        </div>
    )
}