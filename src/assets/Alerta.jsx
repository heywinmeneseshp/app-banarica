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
    const { gestionNotificacion, initialMenu } = useContext(AppContext);
    const [color, setColor] = useState(null);

    const onButton = () => {
        gestionNotificacion.ingresarNotificacion(data)
        initialMenu.toggleNavBar(false)
        if (data.tipo_movimiento == "Pedido") {
            window.open(endPoints.document.pedido + "/" + data.cons_movimiento)
        } else {
            router.push(`/movimiento/${data.tipo_movimiento}`)
        }
        if (user?.id_rol == "Super administrador") actualizarNotificaciones(data.id, { visto: true })
    }

    useEffect(() => {
        if (data.aprobado == true) {
            setColor("success")
        } else {
            setColor("warning")
        }
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