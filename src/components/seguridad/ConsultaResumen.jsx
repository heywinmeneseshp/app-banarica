import React, { useEffect, useState } from "react";

import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { listarSeriales } from "@services/api/seguridad";
import { useAuth } from "@hooks/useAuth";

export default function ConsultaResumen({
    data,
    setPagination,
    limit,
    pagination,
    setResults,
    configBotons = []
}) {
    const { almacenByUser } = useAuth();
    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const listar = async () => {
            try {
                setLoading(true);

                const almacenes = almacenByUser.map((item) => item.consecutivo);
                const filtros = {
                    ...data,
                    cons_almacen:
                        !data?.cons_almacen || data.cons_almacen.length === 0
                            ? almacenes
                            : data.cons_almacen,
                    serial: data?.serial || "",
                };

                const res = await listarSeriales(pagination, limit, filtros);
                setTabla(res?.data || []);
                setTotal(res?.total || 0);
                setResults(res?.total || 0);
            } catch (error) {
                console.error("Error al cargar resumen de disponibles:", error);
                setTabla([]);
                setTotal(0);
                setResults(0);
            } finally {
                setLoading(false);
            }
        };

        listar();
    }, [almacenByUser, data, pagination, limit, setResults]);

    const totalColumnas = configBotons.includes("disponibles_serial") ? 8 : 7;

    return (
        <span className={styles.tabla_text}>
            <table className="table table-striped table-bordered table-sm mb-1">
                <thead>
                    <tr>
                        <th className="text-custom-small text-center">Alm</th>
                        <th className="text-custom-small text-center">Articulo</th>
                        {configBotons.includes("disponibles_serial") && (
                            <th className="text-custom-small text-center">Serial Interno</th>
                        )}
                        <th className="text-custom-small text-center">Serial Externo</th>
                        <th className="text-custom-small text-center">S Pack</th>
                        <th className="text-custom-small text-center">M Pack</th>
                        <th className="text-custom-small text-center">L Pack</th>
                        <th className="text-custom-small text-center">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={totalColumnas} className="text-center">
                                Cargando resultados...
                            </td>
                        </tr>
                    )}

                    {!loading && tabla.length === 0 && (
                        <tr>
                            <td colSpan={totalColumnas} className="text-center">
                                No hay resultados para los filtros seleccionados.
                            </td>
                        </tr>
                    )}

                    {tabla.map((item, index) => (
                        <tr key={index}>
                            <td className="text-custom-small text-center">{item.cons_almacen}</td>
                            <td className="text-custom-small text-center">{item.producto.name}</td>
                            {configBotons.includes("disponibles_serial") && (
                                <td className="text-custom-small text-center">{item.serial}</td>
                            )}
                            <td className="text-custom-small text-center">{item.bag_pack}</td>
                            <td className="text-custom-small text-center">{item.s_pack}</td>
                            <td className="text-custom-small text-center">{item.m_pack}</td>
                            <td className="text-custom-small text-center">{item.l_pack}</td>
                            <td className="text-custom-small text-center">
                                {item.available === true ? "Disponible" : "Usado"}
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
