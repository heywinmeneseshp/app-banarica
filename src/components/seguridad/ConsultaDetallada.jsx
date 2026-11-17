import React, { useEffect, useState } from "react";

import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { filtrarCategorias } from "@services/api/categorias";
import { useAuth } from "@hooks/useAuth";
import { filtradoGeneralStock } from "@services/api/stock";
import { sincronizarStockDisponible } from "@services/api/seguridad";

export default function ConsultaDetallada({
    data,
    setPagination,
    limit,
    pagination,
    setResults
}) {
    const [total, setTotal] = useState(0);
    const [tabla, setTabla] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [sincronizados, setSincronizados] = useState(null); // cambios hechos por la ultima sincronizacion
    const [recarga, setRecarga] = useState(0);
    const { almacenByUser } = useAuth();

    useEffect(() => {
        const listar = async () => {
            try {
                setLoading(true);

                const categoria = await filtrarCategorias(1, 1, "Seguridad");
                const body = {
                    producto: {
                        cons_categoria: categoria?.data?.[0]?.consecutivo,
                        consecutivo: data?.cons_producto || "",
                    },
                    almacen: {
                        consecutivo:
                            !data?.cons_almacen || data.cons_almacen.length === 0
                                ? almacenByUser.map((item) => item.consecutivo)
                                : data.cons_almacen,
                    },
                    pagination: {
                        offset: pagination,
                        limit,
                    },
                    stock: {
                        isBlock: false,
                    }
                };

                const res = await filtradoGeneralStock(body);
                const result = (res?.data || []).sort((a, b) => a.cantidad - b.cantidad);
                setTotal(res?.total || 0);
                setTabla(result);
                setResults(res?.total || 0);

                if (result.length > 0) {
                    syncStock(result);
                }
            } catch (error) {
                console.error("Error al cargar detalle de disponibles:", error);
                setTotal(0);
                setTabla([]);
                setResults(0);
            } finally {
                setLoading(false);
            }
        };

        listar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [almacenByUser, data, limit, pagination, setResults, recarga]);

    // Pone el stock igual a la cantidad de seriales disponibles. Una sola llamada al servidor (antes eran
    // decenas, una por articulo). Si el stock cambia en filas que no estaban en pantalla (por ejemplo, de 0
    // a mas de 0), se recarga la lista una vez.
    // Boton: ajusta TODAS las cantidades de Seguridad (todos los almacenes) a los seriales disponibles.
    const ajustarTodo = async () => {
        if (!window.confirm("Se ajustarán las cantidades de stock de todos los artículos con serial de Seguridad (todos los almacenes) a la cantidad de seriales disponibles. ¿Continuar?")) return;
        setSyncing(true);
        try {
            const res = await sincronizarStockDisponible({});
            setSincronizados(res?.actualizados || 0);
            window.alert(`Cantidades ajustadas: ${res?.actualizados || 0} de ${res?.revisados || 0} registros.`);
            setRecarga((n) => n + 1);
        } catch (error) {
            window.alert(error?.response?.data?.message || "No fue posible ajustar las cantidades.");
        } finally {
            setSyncing(false);
        }
    };

    const syncStock = async (filas) => {
        setSyncing(true);
        try {
            const res = await sincronizarStockDisponible({
                almacenes: [...new Set(filas.map((f) => f.cons_almacen))],
                productos: [...new Set(filas.map((f) => f.cons_producto))],
            });
            setSincronizados(res?.actualizados || 0);
            if (res?.actualizados > 0) {
                setTabla((prev) => prev.map((r) => {
                    const c = res.cambios.find((x) => x.cons_almacen === r.cons_almacen && x.cons_producto === r.cons_producto);
                    return c ? { ...r, cantidad: c.nuevo } : r;
                }));
            }
        } catch (error) {
            console.error("No fue posible actualizar el stock con los seriales disponibles:", error);
            setSincronizados(null);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <span className={styles.tabla_text}>
            <div className="small text-muted mb-1 d-flex align-items-center gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={ajustarTodo} disabled={syncing}>
                    Ajustar todas las cantidades
                </button>
                {syncing
                    ? "Actualizando el stock con los seriales disponibles..."
                    : sincronizados === null
                        ? "El stock se actualiza con la cantidad de seriales disponibles."
                        : sincronizados > 0
                            ? `Stock actualizado con los seriales disponibles: ${sincronizados} fila(s) corregida(s).`
                            : "El stock coincide con los seriales disponibles."}
            </div>
            <table className="table table-striped table-bordered table-sm mb-1">
                <thead>
                    <tr>
                        <th className="text-custom-small text-center" scope="col">Alm</th>
                        <th className="text-custom-small text-center"></th>
                        <th className="text-custom-small text-center">Cod</th>
                        <th className="text-custom-small text-center">Articulo</th>
                        <th className="text-custom-small text-center">
                            Cantidad
                            {syncing && (
                                <span
                                    className="spinner-border spinner-border-sm ms-1 text-secondary"
                                    role="status"
                                    title="Sincronizando conteos..."
                                    style={{ width: "0.65rem", height: "0.65rem", borderWidth: "0.1em" }}
                                />
                            )}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={5} className="text-center">
                                Cargando resultados...
                            </td>
                        </tr>
                    )}

                    {!loading && tabla.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center">
                                No hay resultados para los filtros seleccionados.
                            </td>
                        </tr>
                    )}

                    {tabla.map((item, index) => (
                        <tr key={index}>
                            <td className="text-custom-small text-center">{item.cons_almacen}</td>
                            <td className="text-custom-small text-center">{item.almacen?.nombre}</td>
                            <td className="text-custom-small text-center">{item.cons_producto}</td>
                            <td className="text-custom-small text-center">{item.producto?.name}</td>
                            <td className="text-custom-small text-center">
                                <span className={item.cantidad < 0 ? "text-danger fw-bold" : ""}>
                                    {item.cantidad}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <span className="container">
                <Paginacion
                    setPagination={setPagination}
                    pagination={pagination}
                    total={total}
                    limit={limit}
                />
            </span>
        </span>
    );
}
