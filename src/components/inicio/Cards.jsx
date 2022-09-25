import React from 'react';


//Assets
import CardLiquidacion from '@components/inicio/CardLiquidacion';
import CardExportacion from '@components/inicio/CardExportacion';
import CardDevoluciones from '@components/inicio/CardDevoluciones';
import CardAjustes from '@components/inicio/CardAjuste';

//CSS
import styles from '@styles/Card.module.css';
import { useAuth } from '@hooks/useAuth';




const Cards = () => {
    const { almacenByUser } = useAuth();
    return (
        <>
            <div className={styles.superPadre}>
                <div className={styles.padre}>
                    <CardAjustes almacenes={almacenByUser.map(item => item.consecutivo)}/>
                    <CardDevoluciones almacenes={almacenByUser.map(item => item.consecutivo)}/>
                    <CardLiquidacion />
                    <CardExportacion />
                </div>
            </div>
        </>
    );
};

export default Cards; 