import React, { useContext, useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import AppContext from "@context/AppContext";
//Services
import endPoints from "@services/api/index"
//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";
import { actualizarNotificaciones } from "@services/api/notificaciones";
import { actualizarPedido } from "@services/api/pedidos";

export default function Alerta({ data, setChange, change }) {
    const { user } = useAuth()
    const [color, setColor] = useState(null);

    const onVer = () => {
        window.open(endPoints.document.pedido + "/" + data.cons_movimiento)
        if (user?.id_rol == "Super administrador") actualizarNotificaciones(data.id, { visto: true })
    }

    const onCerrar = () => {
        actualizarNotificaciones(data.id, { visto: true, aprobado: true, descripcion: "completado"  })
        actualizarPedido(data.cons_movimiento, { pendiente: false })
        setChange(true)
        setTimeout(() => {
            setChange(false)
        }, 500);
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
                <div className={styles.cajaBoton2}>
                    <button onClick={onCerrar} type="button" className="btn btn-danger btn-sm">Cerrar Pedido</button>
                    <button onClick={onVer} type="button" className="btn btn-success btn-sm">Ver pedido</button>
                </div>
            </Alert>
        </>
    )
}