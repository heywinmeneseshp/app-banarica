import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Combo from '@containers/Admin/Combo';


//CSS


export default function productos() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Combo />
                </div>
            </SecondLayout>
        </div>
    );
}