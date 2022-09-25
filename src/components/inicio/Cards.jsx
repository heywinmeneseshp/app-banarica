import React from 'react';
import { useEffect } from 'react';
//Hooks
import { useAuth } from '@hooks/useAuth';
//Assets
import CardLiquidacion from '@components/inicio/CardLiquidacion';
import CardExportacion from '@components/inicio/CardExportacion';
import CardDevoluciones from '@components/inicio/CardDevoluciones';
import CardAjustes from '@components/inicio/CardAjuste';
//CSS
import styles from '@styles/Card.module.css';

const Cards = () => {
    const { almacenByUser } = useAuth();
    const cons_almacen =  almacenByUser.map(item => item.consecutivo);

    useEffect(() => {
    }, []);

    return (
        <>
            <div className={styles.superPadre}>
                <div className={styles.padre}>
                    <CardAjustes almacenes={cons_almacen} />
                    <CardDevoluciones almacenes={cons_almacen} />
                    <CardLiquidacion almacenes={cons_almacen} />
                    <CardExportacion almacenes={cons_almacen} />
                </div>
            </div>
        </>
    );
};

export default Cards; 