import React, { useEffect, useState } from "react";
import { GrUpdate } from "react-icons/gr";

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
    const [updatingKey, setUpdatingKey] = useState("");
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
    }, [almacenByUser, data, limit, pagination, setResults]);

    const ajustarInventario = async (cons_almacen, cons_producto, index) => {
        try {
            setUpdatingKey(`${cons_almacen}-${cons_producto}`);

            const res = await listarSeriales(1, 10, {
                cons_almacen,
                cons_producto,
                available: true
            });
            const cantidadReal = res?.total || 0;

            await actualizarStockAlmacen(cons_almacen, cons_producto, { cantidad: cantidadReal });

            setTabla((prevTabla) => {
                const nuevaTabla = [...prevTabla];
                if (nuevaTabla[index]) {
                    nuevaTabla[index] = {
                        ...nuevaTabla[index],
                        cantidad: cantidadReal
                    };
                }
                return nuevaTabla;
            });

            window.alert("Datos actualizados");
        } catch (error) {
            console.error("Error al ajustar inventario:", error);
            window.alert("No fue posible actualizar el inventario");
        } finally {
            setUpdatingKey("");
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
                        <th className="text-custom-small text-center">Cantidad</th>
                        <th className="text-custom-small text-center">Actualizar</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={6} className="text-center">
                                Cargando resultados...
                            </td>
                        </tr>
                    )}

                    {!loading && tabla.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center">
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
                            <td className="text-custom-small text-center">
                                {updatingKey === `${item.cons_almacen}-${item.cons_producto}` ? (
                                    <span className="text-muted">Actualizando...</span>
                                ) : (
                                    <GrUpdate
                                        size={14}
                                        title="Actualizar inventario"
                                        onClick={() =>
                                            ajustarInventario(item.cons_almacen, item.cons_producto, index)
                                        }
                                        style={{
                                            color: "#0d6efd",
                                            cursor: "pointer",
                                            transition: "transform 0.15s ease, color 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = "#0b5ed7";
                                            e.currentTarget.style.transform = "scale(1.15)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = "#0d6efd";
                                            e.currentTarget.style.transform = "scale(1)";
                                        }}
                                    />
                                )}
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
