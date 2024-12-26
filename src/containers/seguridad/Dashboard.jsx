import React, { useEffect, useRef, useState } from "react";
import { DownloadTableExcel } from 'react-export-table-to-excel';

import Paginacion from "@components/shared/Tablas/Paginacion";
import { paginarListado } from "@services/api/listado";
import { encontrarModulo } from "@services/api/configuracion";
import Image from "next/image";
import config from '@public/images/configuracion.png';
import styles from '@styles/header.module.css';
import InsumoConfig from "@assets/InsumoConfig";
import { filtrarProductos } from "@services/api/productos";

export default function Dashboard() {
    const formRef = useRef();
    const tableRef = useRef(null);

    // Fecha inicial y final por defecto
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0); // Establecer a primera hora del día (00:00:00)

    // Formatear la fecha en formato 'YYYY-MM-DD'
    const formattedDate = yesterday.toISOString().split('T')[0];
    console.log(formattedDate);
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(11); // Diciembre
    defaultEndDate.setDate(31); // 31 de diciembre
    defaultEndDate.setHours(23, 59, 59, 999); // Último milisegundo del día

    const [offset, setOffset] = useState(1);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [configuracion, setConfig] = useState([]);
    const [openConfig, setOpenConfig] = useState(false);
    const [startDate, setStartDate] = useState(formattedDate); // Fecha actual por defecto
    const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split('T')[0]);

    useEffect(() => {
        const fetchConfiguracion = async () => {
            try {
                const modulo = await encontrarModulo("Relación_seguridad");
                const consecutivos = JSON.parse(modulo[0]?.detalles || "[]");

                if (consecutivos.length > 0) {
                    const productos = await filtrarProductos({ producto: { consecutivo: consecutivos } });
                    const result = consecutivos.map(consecutivo => productos.find(producto => producto.consecutivo === consecutivo));
                    setConfig(result);
                }
            } catch (error) {
                console.error("Error fetching configuración:", error);
            }
        };

        const fetchData = async () => {
            try {
                const { data, total } = await paginarListado(offset, 25, {
                    fecha_inicial: startDate, fecha_final: endDate, habilitado: true,
                });
                setData(data);
                setTotal(total);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchConfiguracion();
        fetchData();
    }, [offset, startDate, endDate, openConfig]);

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const handleConfig = () => {
        setOpenConfig(!openConfig);
    };



    return (
        <div className="container">
            <h2>Resumen diario</h2>

            <form ref={formRef} className="row mt-3 align-items-center">
                <div className="col-12 col-md-3 d-flex align-items-center">
                    <div className="input-group me-2">
                        <span className="input-group-text" id="start-date-addon">Fecha Inicio:</span>
                        <input
                            onChange={handleStartDateChange}
                            type="date"
                            id="fecha-inicio"
                            name="fecha-inicio"
                            className="form-control"
                            aria-label="Fecha inicio"
                            aria-describedby="start-date-addon"
                            value={startDate}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-3 d-flex align-items-center">
                    <div className="input-group me-2">
                        <span className="input-group-text" id="end-date-addon">Fecha Fin:</span>
                        <input
                            onChange={handleEndDateChange}
                            type="date"
                            id="fecha-fin"
                            name="fecha-fin"
                            className="form-control"
                            aria-label="Fecha fin"
                            aria-describedby="end-date-addon"
                            value={endDate}
                        />
                    </div>
                </div>

                <div className="col-12 col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                    <div className="d-flex flex-column flex-md-row">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: "auto 5px",
                            padding: "2px",
                            width: '25px', // Puedes ajustar el ancho según tus necesidades
                            height: '25px', // Puedes ajustar la altura según tus necesidades
                            overflow: 'hidden',
                            cursor: "pointer"
                        }}>
                            <Image
                                className={styles.imgConfig}
                                onClick={() => handleConfig()}
                                src={config}
                                alt="configuración"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain' // Asegura que la imagen se ajuste dentro del contenedor sin distorsionarse
                                }} />
                        </div>
                        <button type="button" className="btn btn-primary mb-2 mb-md-0 me-md-2">Descargar Carrusel</button>

                        <DownloadTableExcel
                            filename={`Contenedores Inspecc_Banarica ${new Date().toISOString().split('T')[0]}`}
                            sheet={`Del ${startDate} al ${endDate}`}
                            currentTableRef={tableRef.current}
                        >
                            <button type="button" className="btn btn-secondary mb-2 mb-md-0">Descargar Relación</button>
                        </DownloadTableExcel>
                    </div>
                </div>
            </form>

            <table ref={tableRef} className="mt-3 table table-striped table-bordered table-sm">
                <thead>
                    <tr>
                        <th scope="col">Fecha</th>
                        <th>Contenedor</th>
                        {configuracion.map((item, key) => {
                            let title = item.name.charAt(0).toUpperCase() + item.name.toLowerCase().slice(1);
                            return (<th key={key}>{title}</th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, key) => {
                        const date = new Date(item.fecha);
                        const day = String(date.getUTCDate()).padStart(2, '0');
                        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses son base 0
                        const year = date.getUTCFullYear();
                        const fecha = `${year}-${month}-${day}`;
                        const seriales = item?.serial_de_articulos;
                        return (
                            <tr key={key}>
                                <th>{fecha}</th>
                                <td className="text-center">{item?.Contenedor?.contenedor}</td>
                                {configuracion.map((itemConfig, key) => {
                                    const serial = seriales.find(item2 => itemConfig.consecutivo === item2.cons_producto);
                                    return (<td className="text-center" key={key}>{serial?.serial}</td>);
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <Paginacion setPagination={setOffset} pagination={offset} total={total} limit={25} />
            {openConfig && <InsumoConfig handleConfig={handleConfig} modulo_confi={"Relación_seguridad"} />}
        </div>
    );
}
