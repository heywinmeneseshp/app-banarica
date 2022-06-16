import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Users from '@containers/Admin/Users';


//CSS


export default function usuarios() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <Users></Users>
                </div>
            </SecondLayout>
        </div>
    )
}