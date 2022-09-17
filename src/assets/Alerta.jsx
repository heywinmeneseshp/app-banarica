import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useRouter } from "next/router";
import endPoints from "@services/api";
import AppContext from "@context/AppContext";

//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";
import { actualizarNotificaciones } from "@services/api/notificaciones";

export default function Alerta({ data }) {
    const { user } = useAuth()
    const router = useRouter();
    const { gestionNotificacion } = useContext(AppContext);
    const [color, setColor] = useState(null);

    const onButton = () => {
        gestionNotificacion.ingresarNotificacion(data)
        if (data.tipo_movimiento == "Pedido") {
            window.open(endPoints.document.pedido + "/" + data.cons_movimiento)
        } else {
            router.push(`/Movimiento/${data.tipo_movimiento}/${data.cons_movimiento}`)
        }
    }

    useEffect(() => {
        setColor("warning")
        if (data.tipo_movimiento == "Pedido") setColor("success")
        if (data.tipo_movimiento == "Liquidacion") setColor("danger")
    })

    return (
        <>
            <Alert className={styles.alert} key={color} variant={color}>
                <div >
                    <b>| {data.almacen_receptor} |</b> {data.tipo_movimiento} <b>{data.cons_movimiento}</b> {data.descripcion}
                </div>
                <div className={styles.cajaBoton}>
                    <button onClick={onButton} type="button" className="btn btn-success btn-sm">Ver</button>
                </div>
            </Alert>
        </>
    )
}