import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Bodegas from '@containers/Bodegas'


//CSS


export default function Home() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Bodegas></Bodegas>
                </div>
            </SecondLayout>
        </div>
    )
}