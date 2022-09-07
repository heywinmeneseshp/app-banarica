import React, { useContext, useEffect, useState } from 'react';
import AppContext from '@context/AppContext';
//Hooks
import { filtrarNotificacionesPorAlmacen } from '@services/api/notificaciones';
import { useAuth } from '@hooks/useAuth';
//Components
import Alerta from '@assets/Alerta';
//Bootstrap
import styles from '@styles/Tablero.module.css';


const TableroA = () => {
    const { gestionNotificacion } = useContext(AppContext);
    const { almacenByUser, user } = useAuth();
    const [notificaciones, setNotificaciones] = useState([]);

    useEffect(() => {
        const consAlmacen = almacenByUser.map(item => item.consecutivo);
        let data;
        if (user.id_rol == "Super administrador") {
            data = {
                "almacen_receptor": consAlmacen,
                "aprobado": false,
                "visto": false
            }
        } else {
            data = {
                "almacen_receptor": consAlmacen,
                "aprobado": false
            };
        }
        filtrarNotificacionesPorAlmacen(data).then(res => {
            gestionNotificacion.ingresarNotificaciones(res);
            setNotificaciones(res);
        });
    }, []);

    return (
        <>
            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className={styles.miniTablero}>
                        <h5 className={styles.plus}>+ Notificaciones</h5>


                        {notificaciones.map((noti, index) => (
                            <Alerta key={index} data={noti} />
                        ))}
                    </div>
                </div>
            </div>

        </>
    );
};

export default TableroA;