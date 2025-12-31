import React, { useEffect, useRef, useState } from "react";
import Paginacion from "@components/shared/Tablas/Paginacion";
import { encontrarModulo } from "@services/api/configuracion";
import InsumoConfig from "@assets/InsumoConfig";
import { FaCog } from 'react-icons/fa';
import { useAuth } from "@hooks/useAuth";
import { listarSeriales } from "@services/api/seguridad";


export default function Inspeccionados() {
    const formRef = useRef();
    const tableRef = useRef(null);
    const { getUser, almacenByUser } = useAuth();

    const defaultEndDate = new Date();


    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [openConfig, setOpenConfig] = useState(false);
    const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split('T')[0]);
    const [pagination, setPagination] = useState(1);
    const user = getUser();
    const limit = 30;

    useEffect(() => {
        const fetchSeriales = async () => {
            try {
                const alamcenes = almacenByUser?.map(item => item.consecutivo) || [];
                console.log(alamcenes);
                let config = await encontrarModulo("InspeccionesConfig");
                config = JSON.parse(config[0].detalles);
                config = config.tags;
                const dataBusqueda = {
                    cons_producto: config,
                    cons_almacen: alamcenes,
                    available: [false],
                };



                const res = await listarSeriales(pagination, limit, dataBusqueda);
                setData(res.data);
                setTotal(res.total || res.data.length);
                console.log("Datos de seriales:", res.data);
            } catch (error) {
                console.error("Error al obtener seriales:", error);
            }
        };

        fetchSeriales();
    }, [pagination, limit, almacenByUser, openConfig,  endDate]); // Agregué startDate y endDate


    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const handleConfig = () => {
        setOpenConfig(!openConfig);
    };

    // Función para formatear fecha a DD-MM-YYYY
    const formatDateToDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
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
                                type="date"
                                id="fecha-inicio"
                                name="fecha-inicio"
                                className="form-control"
                                aria-label="Fecha inicio"
                                aria-describedby="start-date-addon"
                                  value={endDate}
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
                    {user.id_rol === "Super administrador"  &&
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
                            <th scope="col">Fecha Movimiento</th>
                            <th className="text-center" >Contenedor</th>
                            <th className="text-center" >Artículo</th>
                            <th className="text-center" >Serial</th>
                               <th className="text-center" >Movimiento</th>
                            <th className="text-center" >Username</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, key) => (
                            <tr key={key}>
                                <td className="text-center">{formatDateToDDMMYYYY(item.fecha_de_uso)}</td>
                                <td className="text-center">{item.contenedor.contenedor}</td>
                                <td className="text-center">{item.producto.name.toLowerCase()
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ')}</td>
                                <td className="text-center">{item.serial}</td>
                                <td className="text-center">{item.MotivoDeUso.motivo_de_uso}</td>
                                <td className="text-center">{item.usuario.username}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                {openConfig && <InsumoConfig handleConfig={handleConfig} modulo_confi={"InspeccionesConfig"} />}
            </div>

        </>
    );
}