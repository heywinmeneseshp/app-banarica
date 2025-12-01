import React, { useEffect, useRef, useState } from "react";
import { DownloadTableExcel } from 'react-export-table-to-excel';


import Paginacion from "@components/shared/Tablas/Paginacion";
import { paginarListado } from "@services/api/listado";
import { encontrarModulo } from "@services/api/configuracion";
import InsumoConfig from "@assets/InsumoConfig";
import { filtrarProductos } from "@services/api/productos";
import { FaCog, FaEye, FaPlus } from 'react-icons/fa';
import VistaContenedor from "@assets/Seguridad/VistaContenedor";
import AsignarSeriales from "@components/seguridad/AsignarSeriales";
import { useAuth } from "@hooks/useAuth";
import GenerarCarruselExcel from "@assets/Seguridad/GenerarCarruselExcel";

export default function Dashboard() {
    const formRef = useRef();
    const tableRef = useRef(null);
    const { getUser } = useAuth();

    // Fecha inicial y final por defecto
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0); // Establecer a primera hora del día (00:00:00)

    // Formatear la fecha en formato 'YYYY-MM-DD'
    const formattedDate = yesterday.toISOString().split('T')[0];
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
    const [vistaCont, setVistaCont] = useState(null);
    const [contenedor, setContenedor] = useState(null);
    const [botones, setBotones] = useState([]);
    const [bloqueo, setBloqueo] = useState({});
    const user = getUser();
    const [openCarrusel, setOpenCarrusel] = useState(false);

    useEffect(() => {
        const fetchConfiguracion = async () => {
            try {
                const username = user?.username;
                const [moduloRes, configBotonsRes] = await Promise.all([
                    encontrarModulo("Relación_seguridad"),
                    encontrarModulo(username),
                ]);
                const botonesList = JSON.parse(configBotonsRes[0].detalles).botones;
                const detallesModulo = JSON.parse(moduloRes?.[0]?.detalles);
                setBotones(botonesList);
                setBloqueo(detallesModulo);
                const consecutivos = detallesModulo.tags;
                if (consecutivos.length === 0) return setConfig([]);

                const producto = await filtrarProductos({ producto: { consecutivo: consecutivos, isBlock: false } });
                const resultado = consecutivos.map(c => producto.find(p => p.consecutivo === c)).filter(Boolean);
                setConfig(resultado);
            } catch (error) {
                console.error("Error al obtener configuración:", error);
            }
        };

        const fetchData = async () => {
            try {
                const filtros = {
                    fecha_inicial: startDate,
                    fecha_final: endDate,
                    habilitado: true,
                };
                const { data, total } = await paginarListado(offset, 25, filtros);
                setData(data);
                setTotal(total);
            } catch (error) {
                console.error("Error al obtener datos:", error);
            }
        };

        fetchConfiguracion();
        fetchData();
    }, [offset, startDate, endDate, openConfig, contenedor]);

    const handleStartDateChange = (e) => {
        const value = e.target.value;
        if ((value < bloqueo.fecha_inicio) && (user.id_rol != "Super administrador")) {
            alert("La fecha inicial no puede ser anterior a la fecha de bloqueo");
            return;
        }
        setStartDate(value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const handleConfig = () => {
        setOpenConfig(!openConfig);
    };

    const asignarArticulo = (contenedor) => {
        setContenedor(contenedor);
    };


    return (
        <>
            <div className="container">
                <h2>Resumen diario</h2>

                <form ref={formRef} className="row mt-3 g-2 align-items-center">
                    {/* Columna 1: Fecha de Inicio */}
                    <div className="col-12 col-md-3">
                        <div className="input-group">
                            <span className="input-group-text" id="start-date-addon">Fecha Inicio:</span>
                            <input
                                onChange={handleStartDateChange}
                                type="date"
                                id="fecha-inicio"
                                min={user.id_rol == "Super administrador" ? "2024-01-01" : bloqueo.fecha_inicio}
                                name="fecha-inicio"
                                className="form-control"
                                aria-label="Fecha inicio"
                                aria-describedby="start-date-addon"
                                value={startDate}
                            />
                        </div>
                    </div>

                    {/* Columna 2: Fecha de Fin */}
                    <div className="col-12 col-md-3">
                        <div className="input-group">
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

                    {/* Columna 3: Icono de Configuración */}
                    {(user.id_rol == "Super administrador" || botones.includes("dashboard_configuracion")) && <div className="col-12 col-md-2 d-flex justify-content-center d-none d-md-table-cell">
                        <button
                            onClick={() => handleConfig()}
                            type="button"
                            className="btn btn-link"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '25px',
                                width: "auto",
                                margin: "auto",
                                padding: "0px"
                            }}
                        >
                            <FaCog style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '25px',
                                width: "auto",
                                margin: "auto",
                                padding: "0px",
                                color: "rgb(0 0 0 / 30%)"
                            }} />
                        </button>
                    </div>}

                    {/* Columna 4: Botón Descargar Carrusel */}
                    {(botones.includes("dashboard_descargar_carrusel") || user.id_rol == "Super administrador") && <div className="col-12 col-md-2 d-flex justify-content-md-end">
                        <button type="button" onClick={() => setOpenCarrusel(true)} className="btn btn-primary w-100">Carrusel</button>
                    </div>}

                    {/* Columna 5: Botón Descargar Relación */}
                    {(botones.includes("dashboard_descargar_relacion") || user.id_rol == "Super administrador") && <div className="col-12 col-md-2">
                        <DownloadTableExcel
                            filename={`Contenedores Inspecc_Banarica ${new Date().toISOString().split('T')[0]}`}
                            sheet={`Del ${startDate} al ${endDate}`}
                            currentTableRef={tableRef.current}
                        >
                            <button type="button" className="btn btn-secondary w-100">
                                Descargar Relación
                            </button>
                        </DownloadTableExcel>
                    </div>}

                </form>


                <table ref={tableRef} className="mt-3 table table-striped table-bordered table-sm">
                    <thead>
                        <tr>
                            <th scope="col">Fecha</th>
                            <th>Contenedor</th>
                            {configuracion.map((item, key) => {
                                let title = item.name.charAt(0).toUpperCase() + item.name.toLowerCase().slice(1);
                                return (<th className="d-none d-md-table-cell" key={key}>{title}</th>);
                            })}
                            {(botones.includes("dashboard_agregar") || user.id_rol == "Super administrador") && <th></th>}
                            {(botones.includes('dashboard_seriales') || user.id_rol == "Super administrador") && <th></th>}
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
                                        return (<td className="text-center d-none d-md-table-cell" key={key}>{serial?.revisado == false ? serial?.serial : ""}</td>);
                                    })}
                                    {(botones.includes("dashboard_agregar") || user.id_rol == "Super administrador") && <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                        <button

                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => asignarArticulo(item?.Contenedor)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '25px',
                                                width: "auto",
                                                margin: "auto"
                                            }}
                                        >
                                            <FaPlus />
                                        </button>
                                    </td>}
                                    {(botones.includes('dashboard_seriales') || user.id_rol == "Super administrador") && <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                        <button
                                            onClick={() => setVistaCont(item)}
                                            type="button"
                                            className="btn btn-warning btn-sm"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '25px',
                                                width: "auto",
                                                margin: "auto"
                                            }}
                                        >
                                            <FaEye />
                                        </button>
                                    </td>}
                                </tr>
                            );

                        })}
                    </tbody>
                </table>

                <Paginacion setPagination={setOffset} pagination={offset} total={total} limit={25} />
                {openConfig && <InsumoConfig handleConfig={handleConfig} modulo_confi={"Relación_seguridad"} />}
                {vistaCont && <VistaContenedor configProducts={bloqueo.tags} vistaCont={vistaCont} setVistaCont={setVistaCont} correos={bloqueo?.correos_alerta} />}
            </div>
            {openCarrusel && <GenerarCarruselExcel data={data} setOpen={setOpenCarrusel} />}
            {contenedor && <AsignarSeriales contenedor={contenedor} setContenedor={setContenedor} />}
        </>
    );
}
