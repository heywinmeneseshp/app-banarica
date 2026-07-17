import React, { useEffect, useState } from "react";
import { FaUndoAlt, FaExchangeAlt } from "react-icons/fa";

import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import CorregirSerialModal from "@components/seguridad/CorregirSerialModal";
import TransferirContModal from "@components/seguridad/TransferirContModal";
import { corregirAsignacionSerial, listarSeriales } from "@services/api/seguridad";
import { useAuth } from "@hooks/useAuth";
import { buildTracecodeUrl } from "@utils/tracecode";

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
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [transferItems, setTransferItems] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const user = getUser();
    const canCorrectSerials =
        user?.id_rol === "Super administrador" || configBotons.includes("disponibles_corregir_serial");
    const canTransferSerials =
        user?.id_rol === "Super administrador" || configBotons.includes("disponibles_transferir_serial");

    useEffect(() => {
        setSelectedIds(new Set());
    }, [pagination]);

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
    }, [almacenByUser, data, pagination, limit, setResults, refreshKey]);

    const usadosEnTabla = tabla.filter((i) => i.available === false);
    const allSelected =
        usadosEnTabla.length > 0 && usadosEnTabla.every((i) => selectedIds.has(i.serial));

    const toggleSelect = (serial) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(serial) ? next.delete(serial) : next.add(serial);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(usadosEnTabla.map((i) => i.serial)));
        }
    };

    const totalColumnas =
        (configBotons.includes("disponibles_serial") ? 9 : 8) +
        (canCorrectSerials ? 1 : 0) +
        (canTransferSerials ? 2 : 0);

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

            setRefreshKey((prev) => prev + 1);
            cerrarCorreccion();
        } catch (error) {
            console.error("Error corrigiendo serial:", error);
        } finally {
            setCorrigiendo(false);
        }
    };

    const onTransferDone = () => {
        setTransferItems(null);
        setSelectedIds(new Set());
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <span className={styles.tabla_text}>
            {canTransferSerials && selectedIds.size > 0 && (
                <div className="mb-1">
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                            setTransferItems(tabla.filter((i) => selectedIds.has(i.serial)))
                        }
                    >
                        <FaExchangeAlt className="me-1" />
                        Transferir seleccionados ({selectedIds.size})
                    </button>
                </div>
            )}

            <table className="table table-striped table-bordered table-sm mb-1">
                <thead>
                    <tr>
                        {canTransferSerials && (
                            <th className="text-custom-small text-center" style={{ width: 32 }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    title="Seleccionar todos los usados"
                                    disabled={usadosEnTabla.length === 0}
                                />
                            </th>
                        )}
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
                        <th className="text-custom-small text-center">Contenedor</th>
                        {canCorrectSerials && <th className="text-custom-small text-center">Corregir</th>}
                        {canTransferSerials && <th className="text-custom-small text-center">Transferir</th>}
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
                            {canTransferSerials && (
                                <td className="text-custom-small text-center">
                                    {item.available === false ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.serial)}
                                            onChange={() => toggleSelect(item.serial)}
                                        />
                                    ) : null}
                                </td>
                            )}
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
                            <td className="text-custom-small text-center">
                                {item.available === false && item.contenedor?.contenedor ? (
                                    <a
                                        href={buildTracecodeUrl({ id: item.contenedor.id, contenedor: item.contenedor.contenedor })}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-custom-small"
                                    >
                                        {item.contenedor.contenedor}
                                    </a>
                                ) : '-'}
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
                            {canTransferSerials && (
                                <td className="text-custom-small text-center">
                                    {item.available === false ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => setTransferItems([item])}
                                            title={`Transferir serial ${item.serial}`}
                                        >
                                            <FaExchangeAlt />
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

            {transferItems && (
                <TransferirContModal
                    seriales={transferItems}
                    onClose={() => setTransferItems(null)}
                    onDone={onTransferDone}
                />
            )}
        </span>
    );
}
