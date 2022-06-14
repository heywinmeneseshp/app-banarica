import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Categoria from '@containers/Admin/Categoria'


//CSS


export default function categorias() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Categoria></Categoria>
                </div>
            </SecondLayout>
        </div>
    )
}