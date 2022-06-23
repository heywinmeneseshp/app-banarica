import React from "react";
import { useState } from "react";
import Button from 'react-bootstrap/Button';


//Components
import SecondLayout from "layout/SecondLayout";
import Ajuste from "@containers/almacen/Ajuste";
import Liquidacion from "@containers/almacen/Liquidacion";
import Exportacion from "@containers/almacen/Exportacion";
import Devolucion from "@containers/almacen/Devolucion";

//CSS
import styles from "@styles/almacen/almacen.module.css";
import { Container } from "react-bootstrap";


export default function Movimientos() {

    const [toggleAjuste, setToggleAjuste] = useState(true);
    const [toggleLiquidacion, setToggleLiquidacion] = useState(false);
    const [toggleExportacion, setToggleExportacion] = useState(false);
    const [toggleDevolucion, setToggleDevolucion] = useState(false);

    const handleClickAjuste = () => {
        setToggleAjuste(true);
        setToggleLiquidacion(false);
        setToggleExportacion(false);
        setToggleDevolucion(false);
    };

    const handleClickLiquidacion = () => {
        setToggleAjuste(false);
        setToggleLiquidacion(true);
        setToggleExportacion(false);
        setToggleDevolucion(false);
    };

    const handleClickExportacion = () => {
        setToggleAjuste(false);
        setToggleLiquidacion(false);
        setToggleExportacion(true);
        setToggleDevolucion(false);
    };

    const handleClickDevolucion = () => {
        setToggleAjuste(false);
        setToggleLiquidacion(false);
        setToggleExportacion(false);
        setToggleDevolucion(true);
    };
    
    return (
        <>
            <SecondLayout>
                <Container>
                    <div className={styles.contenedorBotones}>
                        <Button onClick={handleClickAjuste} variant="danger">Ajustes</Button>
                        <Button onClick={handleClickDevolucion} variant="success">Devoluciones</Button>
                        <Button onClick={handleClickLiquidacion} variant="warning">Liquidación</Button>
                        <Button onClick={handleClickExportacion} variant="info">Exportación</Button>
                    </div>
                </Container>


                { toggleAjuste && <Ajuste /> }
                { toggleDevolucion && <Devolucion /> }
                { toggleLiquidacion && <Liquidacion />}
                { toggleExportacion && <Exportacion />}

            </SecondLayout>
        </>
    );
}