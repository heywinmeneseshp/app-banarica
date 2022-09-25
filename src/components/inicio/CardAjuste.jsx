import React, { useEffect } from 'react';
import styles from '@styles/Card.module.css';
import { useState } from 'react';
import { filtrarHistorialenGeneral } from '@services/api/historialMovimientos';


const CardAjustes = ({ almacenes }) => {

    const [items, setItems] = useState([]);

    const calendario = {
        "01": "Enero",
        "02": "Febrero",
        "03": "Marzo",
        "04": "Abril",
        "05": "Mayo",
        "06": "Junio",
        "07": "Julio",
        "08": "Agosto",
        "09": "Septiembre",
        "10": "Octubre",
        "11": "Noviembre",
        "12": "Diciembre"
    };

    useEffect(() => {
        ultimos3Meses();
    }, []);

    const ultimos3Meses = async () => {
        let mes = (new Date().getMonth() + 2).toString();
        let anho = new Date().getFullYear();
        let data = {
            "movimiento": {
                "fecha": ""
            },
            "historial": {
                "cons_almacen_gestor": almacenes,
                "cons_lista_movimientos": "AJ"
            }
        };

        let lista = [];
        for (let i = 0; i < 3; i++) {
            if (mes.substring(0, 1) == 0) {
                mes = (parseInt(mes) - 1).toString();
                if (mes.length == 1) mes = "0" + mes;
                data.movimiento.fecha = `${anho}-${mes}`;
                const res = await filtrarHistorialenGeneral(data);
                let total = 0;
                res.map((item) => {
                    if (item.tipo_movimiento == "Salida") {
                        total = total - item.cantidad;
                    }
                    if (item.tipo_movimiento == "Entrada") {
                        total = total + item.cantidad;
                    }
                });
                lista.push({ [calendario[mes]]: total });
            } else {
                mes = (parseInt(mes) - 1).toString();
                if (mes.length == 1) mes = "0" + mes;
                data.movimiento.fecha = `${anho}-${mes}`;
                const res = await filtrarHistorialenGeneral(data);
                let total = 0;
                res.map((item) => {
                    if (item?.tipo_movimiento == "Salida") {
                        total = total - item?.cantidad;
                    }
                    if (item?.tipo_movimiento == "Entrada") {
                        total = total + item?.cantidad;
                    }
                });
                lista.push({ [calendario[mes]]: total });
            }
            if (mes == "01") mes = "13";
            if (mes == "02") mes = "14";
        }
        setItems(lista);
    };
    return (
        <>
            <div className={styles.hijo}>
                <div className={styles.headerAjustes}>
                    Ajustes
                </div>
                <div className="card" style={{ width: "16rem" }}>
                    <ul className="list-group list-group-flush">
                        {items.map((item, index) => {
                            return (<li key={index} className="list-group-item d-flex justify-content-between">
                                <div>{Object.keys(item)[0]}</div>
                                <div>{item[Object.keys(item)[0]]}</div>
                            </li>);
                        })}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default CardAjustes;