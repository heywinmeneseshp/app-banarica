import React from 'react';
import styles from '../styles/Card.module.css';


const CardLiquidacion = (color) => {

    return (
        <>
            <div className={styles.hijo}>
                <div className={styles.header}>
                    Liquidación
                </div>
                <div className="card" style={{ width: "16rem" }}>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">Junio</li>
                        <li className="list-group-item">Mayo</li>
                        <li className="list-group-item">Abril</li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default CardLiquidacion;