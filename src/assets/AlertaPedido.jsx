import React, { useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { actualizarNotificaciones } from "@services/api/notificaciones";
import { actualizarPedido } from "@services/api/pedidos";
import Alert from 'react-bootstrap/Alert';
import styles from "@styles/almacen/almacen.module.css";

export default function Alerta({ data, setChange }) {
    const { user } = useAuth();
    const [color, setColor] = useState(null);

    const onVer = () => {
        window.open(`${process.env.NEXT_PUBLIC_OWN_URL}/Documento/Pedido/${data.cons_movimiento}`);
        if (user?.id_rol === "Super administrador") {
            actualizarNotificaciones(data.id, { visto: true });
        }
    };

    const onCerrar = () => {
        actualizarNotificaciones(data.id, { visto: true, aprobado: true, descripcion: "completado" });
        actualizarPedido(data.cons_movimiento, { pendiente: false });
        setChange(true);
        setTimeout(() => {
            setChange(false);
        }, 500);
    };

    useEffect(() => {
        setColor(data.aprobado ? "success" : "warning");
    }, [data.aprobado]);

    return (
        <Alert className={styles.alert} key={color} variant={color}>
            <div >
                <b>| {data.almacen_receptor} |</b> {data.tipo_movimiento} <b>{data.cons_movimiento}</b> {data.descripcion}
            </div>
            <div className={styles.cajaBoton2}>
                <button onClick={onCerrar} type="button" className="btn btn-danger btn-sm">
                    Cerrar
                </button>
                <button onClick={onVer} type="button" className="btn btn-success btn-sm">
                    Ver
                </button>
            </div>
        </Alert>
    );
}
