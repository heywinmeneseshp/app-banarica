import React from 'react';
import styles from '../styles/Tablero.module.css';
import Link from 'next/link';

const Tablero = () => {

    return (
        <>
            <div className={styles.superTablero}>
                <div className={styles.tablero}>

                    <div className={styles.containerCrear}>
                        <h5 className={styles.plus}>+ Crear</h5>
                        <div>
                            <ul>
                                <li>Categoria</li>
                                <li>Producto</li>
                                <li>Proveedor</li>
                                <li>Bodega</li>
                                <li>Transportador</li>
                            </ul>
                            <div>
                        </div>
                        </div>
                    </div>

                    <div className={styles.containerCrear}>
                        <h5 className={styles.plus}>+ Movimientos</h5>
                        <div>
                            <ul>
                                <li>Ajuste</li>
                                <li>Devolución</li>
                                <li>Liquidación</li>
                                <li>Traslado</li>
                                <li>Recepción</li>
                            </ul>
                            <div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tablero;