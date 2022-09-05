import React from 'react';


//Assets
import CardLiquidacion from '@components/inicio/CardLiquidacion';
import CardExportacion from '@components/inicio/CardExportacion';
import CardDevoluciones from '@components/inicio/CardDevoluciones';
import CardAjustes from '@components/inicio/CardAjuste';

//CSS
import styles from '@styles/Card.module.css';


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