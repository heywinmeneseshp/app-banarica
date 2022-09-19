import React, { useEffect, useContext } from 'react';
import AppContext from '@context/AppContext';
import Image from 'next/image';
import { useRouter } from "next/router";
//Components
//Imagenes
import ojo from '@public/images/ojo.png';
//Bootstrap
import styles from '@styles/header.module.css';
import styles2 from "@styles/almacen/almacen.module.css";
import styles3 from '@styles/Tablero.module.css';
import endPoints from '@services/api';
import { actualizarNotificaciones } from '@services/api/notificaciones';

const AsideNotificaciones = ({ notificaciones }) => {
    const router = useRouter()
    const { gestionNotificacion } = useContext(AppContext);

    const abrirNoti = (data) => {
        gestionNotificacion.ingresarNotificacion(data)
        if (data.tipo_movimiento == "Pedido") {
            window.open(endPoints.document.pedido + "/" + data.cons_movimiento)
        } else {
            router.push(`/Movimiento/${data.tipo_movimiento}/${data.cons_movimiento}`)
        }
        actualizarNotificaciones(data.id, { visto: true })
    }


    useEffect(() => {

    })
    return (
        <>
            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className={styles3.miniTablero}>
                        <h5 className={styles3.plus}>+ Notificaciones</h5>
                        {notificaciones.map((noti, index) => {
                            let newData = noti
                            newData.almacen_receptor = noti.almacen_emisor
                            return (
                                <div key={index}>
                                    <div className={styles2.alert} variant="success">
                                        <div >
                                            <b>{noti.almacen_emisor} -</b> {noti.tipo_movimiento} <b>{noti.cons_movimiento}</b> {noti.descripcion}
                                        </div>
                                        <div className={styles2.cajaBoton}>
                                            <Image onClick={() => abrirNoti(noti)} className={styles3.imagenEditar} width="15" height="15" src={ojo} alt="ver" />
                                        </div>
                                    </div>
                                </ div>

                            )
                        })}
                    </div>
                </div>
            </div>

        </>
    );
};

export default AsideNotificaciones;