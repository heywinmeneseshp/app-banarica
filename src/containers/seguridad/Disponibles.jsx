import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import endPoints from "@services/api";

// Componentes
import ConsultaResumen from "@components/seguridad/ConsultaResumen";
import ConsultaDetallada from "@components/seguridad/ConsultaDetallada";

// Hooks
import { useAuth } from "@hooks/useAuth";
import excel from "@hooks/useExcel";

// Servicios
import { listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { filtrarCategorias } from "@services/api/categorias";
import { buscarProducto } from "@services/api/productos";
import { encontrarModulo } from "@services/api/configuracion";


export default function Disponibles() {
    const { almacenByUser, getUser } = useAuth();
    const formRef = useRef();

    // Estados
    const [tablaConsulta, setTablaConsulta] = useState(true);
    const [productos, setProductos] = useState([]);
    const [data, setData] = useState({});
    const [pagination, setPagination] = useState(1);
    const [limit, setLimit] = useState(10);
    const [results, setResults] = useState(0);
    const [configBotons, setConfigBotons] = useState([]);
    const user = getUser();

    // Carga productos y realiza búsqueda cuando cambia el tipo de tabla
    useEffect(() => {
        listarProductosSeguridad().then((res) => {
            setProductos(
                tablaConsulta ? res : res.filter((item) => item.serial === true)
            );
        });
        encontrarModulo(user.username).then(res => {
            const config = JSON.parse(res[0].detalles);
            setConfigBotons(config?.botones || []);
        });
        buscarArticulos(); // Buscar productos según formulario
    }, [tablaConsulta]);

    // Cambiar entre tabla resumen y detallada
    const handleTableConsulta = (isResumen) => {
        setTablaConsulta(isResumen);
        setLimit(10);
        setPagination(1);
        setResults(0);
    };

    // Búsqueda de artículos según datos del formulario
    const buscarArticulos = () => {
        const formData = new FormData(formRef.current);
        let estado = formData.get("estado");
        estado = estado === "All" ? [true, false] : [estado === "1"];

        const dataBusqueda = {
            cons_producto: formData.get("producto"),
            serial: formData.get("serial"),
            bag_pack: formData.get("bag_pack"),
            s_pack: formData.get("s_pack"),
            m_pack: formData.get("m_pack"),
            l_pack: formData.get("l_pack"),
            cons_almacen:
                formData.get("almacen") == 0
                    ? almacenByUser.map((item) => item.consecutivo)
                    : formData.get("almacen"),
            available: estado,
        };
        setData(dataBusqueda);
    };

    // Cambiar límite de resultados por página
    const onChangeLimit = (e) => {
        setLimit(Number(e.target.value));
        setPagination(1);
    };

    // Descarga de resultados en Excel
    const descargarExcel = async () => {
        const formData = new FormData(formRef.current);

        if (!tablaConsulta) {
            const response = await listarSeriales(false, false, data);
            excel(response, "seriales", "Artículos de seguridad");
        } else {
            const cons_almacen = formData.get("almacen");
            const categoria = await filtrarCategorias(1, 1, "Seguridad");
            const productoSeleccionado = formData.get("producto");
            const producto = productoSeleccionado
                ? await buscarProducto(productoSeleccionado)
                : null;

            const body = {
                producto: {
                    name: producto?.name || "",
                    cons_categoria: categoria?.data[0]?.consecutivo,
                },
                almacen: {
                    consecutivo:
                        cons_almacen == 0
                            ? almacenByUser.map((item) => item.consecutivo)
                            : cons_almacen,
                },
            };

            const { data: response } = await axios.post(endPoints.stock.filter, body);
            const newData = response.map((item) => ({
                "Cod almacen": item.cons_almacen,
                "Almacen": item.almacen?.nombre,
                "Cod categoría": item.producto.cons_categoria,
                "Cod artículo": item.cons_producto,
                "Artículo": item.producto.name,
                "Cantidad": item.cantidad,
            }));

            excel(newData, "Seguridad", "Stock seguridad");
        }
    };

    return (
        <>
            <section>
                <h2>Consulta de disponibles</h2>
                <form ref={formRef} className="row g-3 mb-4 mt-3">
                    {/* Filtro Almacén */}
                    <div className="col-md-3">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Almacén</span>
                            <select
                                className="form-select form-select-sm"
                                name="almacen"
                                onChange={buscarArticulos}
                            >
                                <option value={0}>Todos</option>
                                {almacenByUser.map((item, idx) => (
                                    <option key={idx} value={item.consecutivo}>
                                        {item.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filtro Artículo */}
                    <div className="col-md-3">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Artículo</span>
                            <select
                                className="form-select form-select-sm"
                                name="producto"
                                onChange={buscarArticulos}
                            >
                                <option value="">Todos</option>
                                {productos.map((item, idx) => (
                                    <option key={idx} value={item.consecutivo}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filtros adicionales solo para tabla detallada */}
                    {!tablaConsulta && (
                        <>
                            {[
                                ["estado", "Estado", ["Disponible", "No disponible", "All"]],
                                ["serial", "Serial Interno"],
                                ["bag_pack", "Serial Externo"],
                                ["s_pack", "S Pack"],
                                ["m_pack", "M Pack"],
                                ["l_pack", "L Pack"],
                            ].map(([name, label, options]) => {

                                const mostrar = name == "serial" ? configBotons.includes("disponibles_serial") : true;
                                if (mostrar) {
                                    return (
                                        <div className="col-md-3" key={name}>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">{label}</span>
                                                {options ? (
                                                    <select
                                                        className="form-select form-select-sm"
                                                        name={name}
                                                        onChange={buscarArticulos}
                                                    >
                                                        {options.map((opt, idx) => (
                                                            <option
                                                                key={idx}
                                                                value={
                                                                    opt === "All"
                                                                        ? "All"
                                                                        : opt === "Disponible"
                                                                            ? 1
                                                                            : 0
                                                                }
                                                            >
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name={name}
                                                        onChange={buscarArticulos}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return null;
                                }
                            })}
                        </>
                    )}

                    {/* Botón de descarga */}
                    <div className="col-md-3">
                        <button
                            type="button"
                            onClick={descargarExcel}
                            className="btn btn-success btn-sm w-100"
                        >
                            Descargar Excel
                        </button>
                    </div>
                </form>

                <div className="line" />

                {/* Controles de vista y paginación */}
                <div className="row">
                    <div className="col-md-3 mb-3">
                        <button
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => handleTableConsulta(true)}
                        >
                            Resumen
                        </button>
                    </div>
                    {configBotons.includes("disponibles_detallado") && <div className="col-md-3 mb-3">
                        <button
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => handleTableConsulta(false)}
                        >
                            Detallado
                        </button>
                    </div>}
                    <div className="col-md-3 mb-3" />
                    <div className="col-md-3 mb-3 row d-flex justify-content-end">
                        <div className="col-6 d-flex align-items-center">
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={limit}
                                min={1}
                                onChange={onChangeLimit}
                            />
                        </div>
                        <div className="col-6 d-flex align-items-center">
                            <span>Resultados de {results}</span>
                        </div>
                    </div>
                </div>

                {/* Render de tabla */}
                {tablaConsulta ? (
                    <ConsultaResumen
                        limit={limit}
                        pagination={pagination}
                        setPagination={setPagination}
                        setLimit={setLimit}
                        data={data}
                        setResults={setResults}
                    />
                ) : (
                    <ConsultaDetallada
                        limit={limit}
                        pagination={pagination}
                        setPagination={setPagination}
                        setLimit={setLimit}
                        data={data}
                        setResults={setResults}
                    />
                )}
            </section>
        </>
    );
}
