import React from 'react';
import { useState } from 'react';
import SecondLayout from 'layout/SecondLayout';
import styles from '@styles/Listar.module.css';

//Components
import Transporte from '@containers/Transporte';
import Conductor from '@containers/Conductor';

//CSS


export default function Home() {

    const [  toggleTransportador, setToggleTransportador ] = useState(true);
    const [ toggleConductor, setToggleConductor ] = useState(false);

    const handleToggleTransportador = () => {
        setToggleTransportador(true);
        setToggleConductor(false);
    };

    const handleToggleConductor = () => {
        setToggleConductor(true);
        setToggleTransportador(false);
    };

    return (
        <div>
            <SecondLayout>
                <div className={styles.contenedor}>
                    <div className={styles.botonesTrans}>
                        <button onClick={handleToggleTransportador} type="button" className="btn btn-primary btn-sm">Tranportadoras</button>
                        <button onClick={handleToggleConductor} type="button" className="btn btn-primary btn-sm ">Conductores</button>
                    </div>
                    {toggleTransportador && <Transporte />}
                    {toggleConductor && <Conductor />}
                </div>
            </SecondLayout>
        </div>
    );
}