import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import AppContext from "@context/AppContext";
//Services";
import RealizarTraslado from "@components/almacen/RealizarTraslado";
import Alerta from "@assets/almacen/Alerta";

//CSS
import styles from "@styles/almacen/almacen.module.css";
import { Container } from "react-bootstrap";

export default function Traslado() {
    const router = useRouter()
    const { gestionNotificacion } = useContext(AppContext);
    const [notificaciones, setNotificaciones] = useState([]);

    useEffect(() => {
        const result = gestionNotificacion.notificaciones.filter(noti => noti.tipo_movimiento === "Traslado")
        setNotificaciones(result);
    }, [])

    const nextPage = () => {
        router.push("/noti/traslado");
    }

    return (
        <>
            <div className={styles.contenedorPadre}>
                <Container>
                    {notificaciones.map((data, index) => (
                        <Alerta key={index} data={data} funcion={nextPage} />
                    ))}
                </Container>
                <RealizarTraslado />
            </div>
        </>
    );
}