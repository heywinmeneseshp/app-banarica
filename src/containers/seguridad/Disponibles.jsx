import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import endPoints from "@services/api";

import ConsultaResumen from "@components/seguridad/ConsultaResumen";
import ConsultaDetallada from "@components/seguridad/ConsultaDetallada";

import { useAuth } from "@hooks/useAuth";
import excel from "@hooks/useExcel";

import { listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { filtrarCategorias } from "@services/api/categorias";
import { buscarProducto } from "@services/api/productos";
import { encontrarModulo } from "@services/api/configuracion";

function getDefaultFilters(almacenByUser = []) {
    return {
        cons_producto: "",
        serial: "",
        bag_pack: "",
        s_pack: "",
        m_pack: "",
        l_pack: "",
        cons_almacen: almacenByUser.map((item) => item.consecutivo),
        available: [true, false],
    };
}

export default function Disponibles() {
    const { almacenByUser, getUser } = useAuth();
    const formRef = useRef();
    const user = getUser();

    const [vista, setVista] = useState("resumen");
    const [productos, setProductos] = useState([]);
    const [data, setData] = useState(getDefaultFilters([]));
    const [pagination, setPagination] = useState(1);
    const [limit, setLimit] = useState(10);
    const [results, setResults] = useState(0);
    const [configBotons, setConfigBotons] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);

    const productosFiltrados = useMemo(() => {
        if (vista === "resumen") {
            return productos;
        }

        return productos.filter((item) => item.serial === true);
    }, [productos, vista]);

    const buscarArticulos = useCallback(() => {
        if (!formRef.current) {
            return;
        }

        const formData = new FormData(formRef.current);
        let estado = formData.get("estado");
        estado = estado === "All" ? [true, false] : [estado === "1"];

        setPagination(1);
        setData({
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
        });
    }, [almacenByUser]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingProductos(true);

                const [productosRes, configRes] = await Promise.all([
                    listarProductosSeguridad(),
                    encontrarModulo(user.username),
                ]);

                setProductos(Array.isArray(productosRes) ? productosRes : []);
                const config = JSON.parse(configRes?.[0]?.detalles || "{}");
                setConfigBotons(config?.botones || []);
            } catch (error) {
                console.error("Error al cargar disponibles:", error);
                setProductos([]);
                setConfigBotons([]);
            } finally {
                setLoadingProductos(false);
            }
        };

        if (user?.username) {
            cargarDatos();
        }
    }, [user?.username]);

    useEffect(() => {
        if (almacenByUser.length > 0) {
            setData(getDefaultFilters(almacenByUser));
        }
    }, [almacenByUser]);

    useEffect(() => {
        buscarArticulos();
    }, [vista, buscarArticulos]);

    const handleTableConsulta = (nextVista) => {
        setVista(nextVista);
        setLimit(10);
        setPagination(1);
        setResults(0);
    };

    const onChangeLimit = (e) => {
        setLimit(Number(e.target.value));
        setPagination(1);
    };

    const limpiarFiltros = () => {
        if (!formRef.current) {
            return;
        }

        formRef.current.reset();
        setLimit(10);
        setPagination(1);
        setResults(0);
        setData(getDefaultFilters(almacenByUser));
    };

    const descargarExcel = async () => {
        const formData = new FormData(formRef.current);

        if (vista === "detallado") {
            const response = await listarSeriales(false, false, data);
            excel(response, "seriales", "Articulos de seguridad");
            return;
        }

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
            "Cod categoria": item.producto.cons_categoria,
            "Cod articulo": item.cons_producto,
            "Articulo": item.producto.name,
            "Cantidad": item.cantidad,
        }));

        excel(newData, "Seguridad", "Stock seguridad");
    };

    return (
        <section>
            <h2>Consulta de disponibles</h2>

            <form ref={formRef} className="row g-3 mb-4 mt-3">
                <div className="col-md-3">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Almacen</span>
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

                <div className="col-md-3">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Articulo</span>
                        <select
                            className="form-select form-select-sm"
                            name="producto"
                            onChange={buscarArticulos}
                        >
                            <option value="">Todos</option>
                            {productosFiltrados.map((item, idx) => (
                                <option key={idx} value={item.consecutivo}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {vista === "detallado" && (
                    <>
                        {[
                            ["estado", "Estado", ["Disponible", "No disponible", "All"]],
                            ["serial", "Serial Interno"],
                            ["bag_pack", "Serial Externo"],
                            ["s_pack", "S Pack"],
                            ["m_pack", "M Pack"],
                            ["l_pack", "L Pack"],
                        ].map(([name, label, options]) => {
                            const mostrar =
                                name === "serial"
                                    ? configBotons.includes("disponibles_serial")
                                    : true;

                            if (!mostrar) {
                                return null;
                            }

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
                        })}
                    </>
                )}

                <div className="col-md-3">
                    <button
                        type="button"
                        onClick={descargarExcel}
                        className="btn btn-success btn-sm w-100"
                        disabled={loadingProductos}
                    >
                        Descargar Excel
                    </button>
                </div>

                <div className="col-md-3">
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="btn btn-outline-secondary btn-sm w-100"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </form>

            <div className="line" />

            <div className="row">
                <div className="col-md-3 mb-3">
                    <button
                        type="button"
                        className={`btn btn-sm w-100 ${vista === "resumen" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => handleTableConsulta("resumen")}
                    >
                        Resumen
                    </button>
                </div>

                {configBotons.includes("disponibles_detallado") && (
                    <div className="col-md-3 mb-3">
                        <button
                            type="button"
                            className={`btn btn-sm w-100 ${vista === "detallado" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => handleTableConsulta("detallado")}
                        >
                            Detallado
                        </button>
                    </div>
                )}

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

            {vista === "resumen" ? (
                <ConsultaDetallada
                    limit={limit}
                    pagination={pagination}
                    setPagination={setPagination}
                    data={data}
                    setResults={setResults}
                    configBotons={configBotons}
                />
            ) : (
                <ConsultaResumen
                    limit={limit}
                    pagination={pagination}
                    setPagination={setPagination}
                    data={data}
                    setResults={setResults}
                    configBotons={configBotons}
                />
            )}
        </section>
    );
}
