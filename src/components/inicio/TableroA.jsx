import React, { useContext, useEffect, useState } from 'react';
import AppContext from '@context/AppContext';
//Hooks
import { filtrarNotificaciones } from '@services/api/notificaciones';
import { useAuth } from '@hooks/useAuth';
//Components
import Alerta from '@assets/Alerta';
import BotonDespliegue from '@assets/BotonDespliegue';
//Bootstrap
import styles from '@styles/Tablero.module.css';



const TableroA = () => {
    const { gestionNotificacion } = useContext(AppContext);
    const { almacenByUser, user } = useAuth();
    const [notificaciones, setNotificaciones] = useState([]);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const consAlmacen = almacenByUser.map(item => item.consecutivo);
        let data;
        if (user.id_rol == "Super administrador") {
            data = {
                "almacen_receptor": consAlmacen,
                "aprobado": false
            };
        } else {
            data = {
                "almacen_receptor": consAlmacen,
                "aprobado": false
            };
        }
        filtrarNotificaciones(data).then(res => {
            gestionNotificacion.ingresarNotificaciones(res);
            setNotificaciones(res);
            let listaItems = [];
            res.forEach(item => {
                const existe = listaItems.find(item2 => item2 == item.tipo_movimiento);
                if (!existe) listaItems.push(item.tipo_movimiento);
            });
            setItems(listaItems);
        });

    }, []);

    const handleSelect = (item) => {
        if (item == null) {
            setNotificaciones(gestionNotificacion.notificaciones);
        } else {
            const res = gestionNotificacion.notificaciones.filter(noti => noti.tipo_movimiento == item);
            setNotificaciones(res);
        }
    };

    return (
        <>
            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className='d-flex justify-content-between'>
                        <h5 className={styles.plus}>+ Pendientes</h5>
                        <BotonDespliegue funcion={handleSelect} nombreBoton={"Filtrar"} items={items} />
                    </div>
                    <div className={styles.miniTablero}>
                        {notificaciones.map((noti, index) => {
                            return (<Alerta key={index} data={noti} />);
                        })}
                    </div>
                </div>
            </div>

        </>
    );
};

export default TableroA;