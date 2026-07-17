import React, { useEffect, useState } from "react";

import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { filtrarCategorias } from "@services/api/categorias";
import { useAuth } from "@hooks/useAuth";
import { actualizarStockAlmacen, filtradoGeneralStock } from "@services/api/stock";
import { listarSeriales } from "@services/api/seguridad";

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
    }, [almacenByUser, data, limit, pagination, setResults]);

    const syncStock = async (filas) => {
        setSyncing(true);
        try {
            await Promise.all(
                filas.map(async (item) => {
                    try {
                        const res = await listarSeriales(1, 10, {
                            cons_almacen: item.cons_almacen,
                            cons_producto: item.cons_producto,
                            available: true,
                        });
                        const cantidadReal = res?.total || 0;
                        if (cantidadReal === item.cantidad) return;

                        actualizarStockAlmacen(item.cons_almacen, item.cons_producto, { cantidad: cantidadReal })
                            .catch(console.error);

                        setTabla((prev) => {
                            const next = [...prev];
                            const idx = next.findIndex(
                                (r) => r.cons_almacen === item.cons_almacen && r.cons_producto === item.cons_producto
                            );
                            if (idx !== -1) next[idx] = { ...next[idx], cantidad: cantidadReal };
                            return next;
                        });
                    } catch { /* silent per-row errors */ }
                })
            );
        } finally {
            setSyncing(false);
        }
    };

    return (
        <span className={styles.tabla_text}>
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
