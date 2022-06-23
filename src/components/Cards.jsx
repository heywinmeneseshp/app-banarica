import React from 'react';


//Assets
import CardLiquidacion from '../assets/CardLiquidacion';
import CardExportacion from '../assets/CardExportacion';
import CardDevoluciones from '../assets/CardDevoluciones';
import CardAjustes from '../assets/CardAjuste';

//CSS
import styles from '../styles/Card.module.css';


const Cards = () => {

    return (
        <>
            <div className={styles.superPadre}>
                <div className={styles.padre}>
                    <CardAjustes />
                    <CardDevoluciones />
                    <CardLiquidacion />
                    <CardExportacion />
                </div>
            </div>
        </>
    );
};

export default Cards; 