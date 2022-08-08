import React from 'react';
import { useState } from 'react';
import styles from '@styles/Listar.module.css';
import { useContext } from 'react';
import AppContext from '@context/AppContext';

//Components
import Transportadora from '@containers/administrador/transporte/Transportadora';
import Conductor from '@containers/administrador/transporte/Conductor';

//CSS


export default function Transporte() {

    const [toggleTransportador, setToggleTransportador] = useState(true);
    const [toggleConductor, setToggleConductor] = useState(false);

    const handleToggleTransportador = () => {
        setToggleTransportador(true);
        setToggleConductor(false);
    };

    const handleToggleConductor = () => {
        setToggleConductor(true);
        setToggleTransportador(false);
    };

    return (
        <div className={styles.contenedorTransporte}>

            <div className={styles.botonesTrans}>
                <button onClick={handleToggleTransportador} type="button" className="btn btn-primary btn-sm">Tranportadoras</button>
                <button onClick={handleToggleConductor} type="button" className="btn btn-primary btn-sm ">Conductores</button>
            </div>
            {toggleTransportador && <Transportadora />}
            {toggleConductor && <Conductor />}


        </div>
    );
}