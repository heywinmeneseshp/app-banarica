import React from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Transporte from '@containers/Transporte';
import Conductor from '@containers/Conductor';

//CSS


export default function Home() {
    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <div className={styles.botonesTrans}>
                        <button type="button" class="btn btn-primary btn-sm disabled">Tranportadoras</button>
                        <button type="button" class="btn btn-primary btn-sm ">Conductores</button>
                    </div>
                    <Transporte></Transporte>
                    <Conductor></Conductor>
                </div>
            </SecondLayout>
        </div>
    )
}