import React, { useEffect, useState } from "react";
import { FaUndoAlt } from "react-icons/fa";

import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import CorregirSerialModal from "@components/seguridad/CorregirSerialModal";
import { corregirAsignacionSerial, listarSeriales } from "@services/api/seguridad";
import { useAuth } from "@hooks/useAuth";

export default function ConsultaResumen({
    data,
    setPagination,
    limit,
    pagination,
    setResults,
    configBotons = []
}) {
    const { almacenByUser, getUser } = useAuth();
    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serialSeleccionado, setSerialSeleccionado] = useState(null);
    const [corrigiendo, setCorrigiendo] = useState(false);

    const user = getUser();
    const canCorrectSerials =
        user?.id_rol === "Super administrador" || configBotons.includes("disponibles_corregir_serial");

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

    const totalColumnas =
        (configBotons.includes("disponibles_serial") ? 8 : 7) + (canCorrectSerials ? 1 : 0);

    const abrirCorreccion = (item) => {
        setSerialSeleccionado(item);
    };

    const cerrarCorreccion = () => {
        setSerialSeleccionado(null);
        setCorrigiendo(false);
    };

    const ejecutarCorreccion = async ({ modoCorreccion, serialCorrecto, observaciones }) => {
        if (!serialSeleccionado?.serial) {
            return;
        }

        if (modoCorreccion === "reemplazar" && !serialCorrecto.trim()) {
            window.alert("Debes indicar el serial correcto para el reemplazo.");
            return;
        }

        try {
            setCorrigiendo(true);
            await corregirAsignacionSerial({
                serial_errado: serialSeleccionado.serial,
                serial_correcto: modoCorreccion === "reemplazar" ? serialCorrecto.trim().toUpperCase() : "",
                observaciones: observaciones.trim()
            });

            const res = await listarSeriales(pagination, limit, {
                ...data,
                cons_almacen:
                    !data?.cons_almacen || data.cons_almacen.length === 0
                        ? almacenByUser.map((item) => item.consecutivo)
                        : data.cons_almacen,
                serial: data?.serial || "",
            });

            setTabla(res?.data || []);
            setTotal(res?.total || 0);
            setResults(res?.total || 0);
            cerrarCorreccion();
        } catch (error) {
            console.error("Error corrigiendo serial:", error);
        } finally {
            setCorrigiendo(false);
        }
    };

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
                        {canCorrectSerials && <th className="text-custom-small text-center">Corregir</th>}
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
                            {canCorrectSerials && (
                                <td className="text-custom-small text-center">
                                    {item.available === false ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => abrirCorreccion(item)}
                                            title={`Corregir serial ${item.serial}`}
                                        >
                                            <FaUndoAlt />
                                        </button>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                            )}
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

            <CorregirSerialModal
                open={Boolean(serialSeleccionado)}
                serialSeleccionado={serialSeleccionado}
                loading={corrigiendo}
                onClose={cerrarCorreccion}
                onConfirm={ejecutarCorreccion}
            />
        </span>
    );
}
