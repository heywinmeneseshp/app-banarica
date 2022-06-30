import React from 'react';

//Bootstrap


import styles from '@styles/Tablero.module.css';
import Alerta from '@assets/almacen/Alerta';


const TableroA = () => {

    const datosAlerta = {
        consecutivo: "20843",
        almacen: "302",
        movimiento: "Liquidacion",
        mensaje: "pendiente por aprobar"
    };

    return (
        <>
            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className={styles.containerCrear}>
                        <h5 className={styles.plus}>+ Notificaciones</h5>
                        
                        <Alerta data={datosAlerta}></Alerta>
                        <Alerta data={datosAlerta}></Alerta>
                        <Alerta data={datosAlerta}></Alerta>
                        <Alerta data={datosAlerta}></Alerta>

                    </div>
                </div>
            </div>
        </>
    );
};

export default TableroA;