import React, { useEffect, useRef, useState } from "react";
import Paginacion from "@components/shared/Tablas/Paginacion";
import { encontrarModulo } from "@services/api/configuracion";
import InsumoConfig from "@assets/InsumoConfig";
import { FaCog } from 'react-icons/fa';
import { useAuth } from "@hooks/useAuth";

import { GrCircleInformation } from "react-icons/gr";
import { paginarInspecciones } from "@services/api/inpecciones";



export default function Inspeccionados() {
    const formRef = useRef();
    const tableRef = useRef(null);
    const { getUser, almacenByUser } = useAuth();

    const ultimoDiaDelAnio = () => {
        const hoy = new Date();
        return `${hoy.getFullYear() + 1}-01-01`;
    };




    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [openConfig, setOpenConfig] = useState(false);
    const [pagination, setPagination] = useState(1);
    const user = getUser();
    const limit = 30;

    const fetchSeriales = async () => {
        try {
            const formData = new FormData(formRef.current);
            const alamcenes = almacenByUser?.map(item => item.consecutivo) || [];
            let config = await encontrarModulo("InspeccionesConfig");
            config = JSON.parse(config[0].detalles);
            config = config.tags;
            const dataBusqueda = {
                cons_producto: config,
                cons_almacen: alamcenes,
                available: [false],
                motivo_de_uso: "INSP02",
                contenedor: formData.get("contenedor"),
                fecha_inspeccion_inicio: formData.get("fecha-inicio"),
                fecha_inspeccion_fin: formData.get("fecha-fin"),
            };

            console.log(dataBusqueda);

        
       
           // const res = await listarSeriales(pagination, limit, dataBusqueda);
            //setData(res.data);
            //setTotal(res.total || res.data.length);
            console.log("Datos de seriales:", res.data);
        } catch (error) {
            console.error("Error al obtener seriales:", error);
        }
    };

    useEffect(() => {
        fetchSeriales();
    }, [pagination, limit, almacenByUser, openConfig]); // Agregué startDate y endDate


    const handleFilter = () => {
        fetchSeriales();
    };


    const handleConfig = () => {
        setOpenConfig(!openConfig);
    };

    // Función para formatear fecha a DD-MM-YYYY
    const formatDateToDDMMYYYY = (dateString) => {
        const d = new Date(dateString);
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const anio = d.getUTCFullYear();
        return `${dia}-${mes}-${anio}`;
    };

    return (
        <>
            <div className="container">
                <h2>Unidades Inspeccionadas</h2>

                <form ref={formRef} className="row mt-3 g-2 align-items-center">
                    {/* Columna 1: Fecha de Inicio */}
                    <div className="col-12 col-md-3">
                        <div className="input-group">
                            <span className="input-group-text" id="start-date-addon">Fecha Inicio:</span>
                            <input
                                onChange={handleFilter}
                                type="date"
                                id="fecha-inicio"
                                name="fecha-inicio"
                                className="form-control"
                                aria-label="Fecha inicio"
                                aria-describedby="start-date-addon"
                            />
                        </div>
                    </div>

                    {/* Columna 2: Fecha de Fin */}
                    <div className="col-12 col-md-3">
                        <div className="input-group">
                            <span className="input-group-text" id="end-date-addon">Fecha Fin:</span>
                            <input
                                defaultValue={ultimoDiaDelAnio()}
                                onChange={handleFilter}
                                type="date"
                                id="fecha-fin"
                                name="fecha-fin"
                                className="form-control"
                                aria-label="Fecha fin"
                                aria-describedby="end-date-addon"
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-3">
                        <div className="input-group">
                            <span className="input-group-text" id="end-contendor-addon">Contenedor:</span>
                            <input
                                onChange={handleFilter}
                                type="text"
                                id="contenedor"
                                name="contenedor"
                                className="form-control"
                                aria-label="Fecha fin"
                                aria-describedby="end-date-addon"
                            />
                        </div>
                    </div>

                    {/* Columna 3: Icono de Configuración */}
                    {user.id_rol === "Super administrador" &&
                        <div className="col-12 col-md-2 d-flex justify-content-center d-none d-md-table-cell">
                            <button
                                onClick={handleConfig}
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
                        </div>
                    }


                </form>

                <table ref={tableRef} className="mt-3 table table-striped table-bordered table-sm">
                    <thead>
                        <tr>
                            <th scope="col">Fecha Inspcción</th>
                            <th className="text-center" >Contenedor</th>
                            <th className="text-center" >Serial</th>
                            <th className="text-center" >Movimiento</th>
                            <th className="text-center" >Agente</th>
                            <th className="text-center" >Inicio</th>
                            <th className="text-center" >Fin</th>
                            <th className="text-center" >Usuario</th>
                            {user.id_rol === "Super administrador" && <th>Info</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, key) => {

                            const datos = {
                                id: item.contenedor.id,
                                timestamp: Date.now(),
                                contenedor: item.contenedor.contenedor
                            };


                            const token = btoa(JSON.stringify(datos));
                            const baseUrl = window.location.origin;
                            const traceUrl = `${baseUrl}/tracecode?token=${token}`; // ❌ QUITÉ el } extra
                            return (
                                <tr key={key}>
                                    <td className="text-center">{formatDateToDDMMYYYY(item?.Inspeccion?.fecha_inspeccion)}</td>
                                    <td className="text-center">{item.contenedor.contenedor}</td>
                                    <td className="text-center">{item.serial}</td>
                                    <td className="text-center">{item.MotivoDeUso.motivo_de_uso}</td>
                                    <td className="text-center">{item?.Inspeccion?.agente}</td>
                                    <td className="text-center">{item?.Inspeccion?.hora_inicio}</td>
                                    <td className="text-center">{item?.Inspeccion?.hora_fin}</td>
                                    <td className="text-center">{item.usuario.nombre + " " + item.usuario.apellido}</td>
                                    {user.id_rol === "Super administrador" && <td
                                        className="text-center"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => window.open(traceUrl)}
                                    >
                                        <GrCircleInformation />
                                    </td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                {openConfig && <InsumoConfig handleConfig={handleConfig} modulo_confi={"InspeccionesConfig"} />}
            </div>

        </>
    );
}