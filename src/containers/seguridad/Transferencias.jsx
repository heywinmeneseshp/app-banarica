import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@hooks/useAuth";
import { PropagateLoader } from "react-spinners";
import useDate from "@hooks/useDate";

import { listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { ejecutarTraslado } from "@services/api/traslados";
import { encontrarModulo } from "@services/api/configuracion";
import { enviarCorreo } from "@services/api/correo";
import uSemana from "@hooks/useSemana";

import Paginacion from "@components/Paginacion";
import { generateTransferExcelBase64 } from "utils/generateTransferExcelBase64.js";

const buildTransferSummary = (items) => {
    return items.reduce((acc, item) => {
        const current = acc[item.cons_producto] || { cantidad: 0, seriales: [] };
        current.cantidad += 1;
        current.seriales.push(item.serial || item.bag_pack || item.s_pack || item.m_pack || item.l_pack || "Sin identificador");
        acc[item.cons_producto] = current;
        return acc;
    }, {});
};

const getItemKey = (item) => `${item.cons_producto}-${item.serial || item.id}`;

const TransferListModal = ({ show, onClose, items, onRemove }) => {
    const [selectedItemsToDelete, setSelectedItemsToDelete] = useState([]);

    useEffect(() => {
        if (show) {
            setSelectedItemsToDelete([]);
        }
    }, [show, items]);

    const handleCheck = (item) => {
        setSelectedItemsToDelete((prev) => {
            const uniqueKey = getItemKey(item);
            if (prev.some((i) => getItemKey(i) === uniqueKey)) {
                return prev.filter((i) => getItemKey(i) !== uniqueKey);
            }
            return [...prev, item];
        });
    };

    const handleCheckAll = () => {
        if (selectedItemsToDelete.length === items.length) {
            setSelectedItemsToDelete([]);
            return;
        }
        setSelectedItemsToDelete([...items]);
    };

    const handleMassiveRemove = () => {
        if (selectedItemsToDelete.length === 0) {
            return window.alert("Debe seleccionar al menos un articulo para eliminar.");
        }

        if (window.confirm(`¿Esta seguro de eliminar ${selectedItemsToDelete.length} articulo(s) de la lista de traslado?`)) {
            onRemove(selectedItemsToDelete);
            setSelectedItemsToDelete([]);
        }
    };

    const allChecked = items.length > 0 && selectedItemsToDelete.length === items.length;

    if (!show) {
        return null;
    }

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        <div className="modal-header py-2">
                            <div>
                                <h5 className="modal-title mb-0">Lista de transferencia</h5>
                                <small className="text-muted">{items.length} item(s) acumulados</small>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body py-2">
                            {items.length === 0 ? (
                                <div className="alert alert-light border mb-0">
                                    No hay articulos agregados a la transferencia.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-center">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        onChange={handleCheckAll}
                                                        checked={allChecked}
                                                        disabled={items.length === 0}
                                                    />
                                                </th>
                                                <th>Articulo</th>
                                                <th>Serial Int</th>
                                                <th>Serial Ext</th>
                                                <th>S Pack</th>
                                                <th>M Pack</th>
                                                <th>L Pack</th>
                                                <th className="text-end">Accion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => {
                                                const isSelected = selectedItemsToDelete.some((i) => getItemKey(i) === getItemKey(item));

                                                return (
                                                    <tr key={getItemKey(item)}>
                                                        <td className="text-center">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleCheck(item)}
                                                            />
                                                        </td>
                                                        <td>{item.cons_producto}</td>
                                                        <td>{item.serial || "-"}</td>
                                                        <td>{item.bag_pack || "-"}</td>
                                                        <td>{item.s_pack || "-"}</td>
                                                        <td>{item.m_pack || "-"}</td>
                                                        <td>{item.l_pack || "-"}</td>
                                                        <td className="text-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => onRemove(item)}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer d-flex justify-content-between py-2">
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={handleMassiveRemove}
                                disabled={selectedItemsToDelete.length === 0}
                            >
                                Eliminar seleccionados ({selectedItemsToDelete.length})
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default function Transferencias() {
    const limitRef = useRef();
    const formRef = useRef();
    const fechaActual = useDate();

    const { almacenByUser, user } = useAuth();

    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([]);
    const [draftLimit, setDraftLimit] = useState("20");
    const [origenSeleccionado, setOrigenSeleccionado] = useState("");
    const [destinoSeleccionado, setDestinoSeleccionado] = useState("");

    const [limit, setLimit] = useState(20);
    const [pagination, setPagination] = useState(1);

    const [checkAll, setCheckAll] = useState(false);
    const [checKs, setChecks] = useState([]);

    const [itemsToTransfer, setItemsToTransfer] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [semanaData, setSemanaData] = useState(null);
    const [bool, setBool] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mostrarSerial, setMostrarSerial] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const seleccionadosActuales = checKs.filter(Boolean).length;
    const resumenTransferencia = buildTransferSummary(itemsToTransfer);

    const getFormData = () => {
        const formData = new FormData(formRef.current);
        return {
            cons_producto: formData.get("producto"),
            serial: formData.get("serial"),
            bag_pack: formData.get("bag_pack"),
            s_pack: formData.get("s_pack"),
            m_pack: formData.get("m_pack"),
            l_pack: formData.get("l_pack"),
            cons_almacen: formData.get("origen"),
            available: [true],
        };
    };

    const buscarArticulos = useCallback(async () => {
        if (!formRef.current) return;

        setCheckAll(false);
        setChecks([]);

        try {
            const res = await listarSeriales(pagination, limit, getFormData());
            setTabla(res.data);
            setTotal(res.total);
            setChecks(new Array(res.data.length).fill(false));
        } catch (error) {
            console.error("Error al listar seriales:", error);
            setFeedback({ type: "danger", message: "No fue posible cargar los seriales con los filtros actuales." });
        }
    }, [pagination, limit]);

    useEffect(() => {
        buscarArticulos();
    }, [buscarArticulos]);

    useEffect(() => {
        listarProductosSeguridad().then((res) => setProductos(res.filter((item) => item.serial === true)));

        encontrarModulo("Semana").then((res) => setSemanaData(res[0]));

        setMostrarSerial(user.id_roll !== "Super usuario");
        const origenInicial = almacenByUser?.[0]?.consecutivo || "";
        const destinoInicial = almacenByUser.find((item) => item.consecutivo !== origenInicial)?.consecutivo || origenInicial;
        setOrigenSeleccionado(origenInicial);
        setDestinoSeleccionado(destinoInicial);
    }, [user.id_roll, almacenByUser]);

    const onChanageBuscar = (e) => {
        setFeedback(null);

        if (e?.target?.name === "origen") {
            const nuevoOrigen = e.target.value;
            setOrigenSeleccionado(nuevoOrigen);

            if (destinoSeleccionado === nuevoOrigen) {
                const nuevoDestino = almacenByUser.find((item) => item.consecutivo !== nuevoOrigen)?.consecutivo || nuevoOrigen;
                setDestinoSeleccionado(nuevoDestino);
                if (formRef.current?.destino) {
                    formRef.current.destino.value = nuevoDestino;
                }
            }
        }

        if (pagination === 1) {
            buscarArticulos();
            return;
        }

        setPagination(1);
    };

    const handleLimit = () => {
        const newLimit = parseInt(limitRef.current.value, 10);

        if (!(newLimit > 0)) {
            setDraftLimit(String(limit));
            return;
        }

        if (pagination === 1 && newLimit === limit) {
            return;
        }

        if (pagination === 1) {
            setLimit(newLimit);
            setDraftLimit(String(newLimit));
            setCheckAll(false);
            return;
        }

        setPagination(1);
        setLimit(newLimit);
        setDraftLimit(String(newLimit));
        setCheckAll(false);
    };

    const handleDraftLimitChange = (e) => {
        setDraftLimit(e.target.value);
    };

    const handleDraftLimitCommit = () => {
        handleLimit();
    };

    const handleDestinoChange = (e) => {
        setDestinoSeleccionado(e.target.value);
    };

    const limpiarFiltros = () => {
        if (!formRef.current) return;

        const origenActual = origenSeleccionado || formRef.current.origen.value;
        const destinoActual = almacenByUser.find((item) => item.consecutivo !== origenActual)?.consecutivo || origenActual;

        formRef.current.reset();
        formRef.current.origen.value = origenActual;
        formRef.current.destino.value = destinoActual;
        formRef.current.fecha.value = fechaActual;

        setOrigenSeleccionado(origenActual);
        setDestinoSeleccionado(destinoActual);
        setPagination(1);
        setCheckAll(false);
        setChecks([]);
        setFeedback(null);
        setShowAdvancedFilters(false);
        buscarArticulos();
    };

    const handleCheckAll = () => {
        setFeedback(null);
        const newState = !checkAll;
        setChecks(new Array(tabla.length).fill(newState));
        setCheckAll(newState);
    };

    const hadleChecks = (position) => {
        setFeedback(null);
        setChecks((prevChecks) => {
            const newChecks = [...prevChecks];
            newChecks[position] = !newChecks[position];

            if (!newChecks[position]) {
                setCheckAll(false);
            } else if (newChecks.every((check) => check === true)) {
                setCheckAll(true);
            }

            return newChecks;
        });
    };

    const agregarItem = () => {
        const itemsSeleccionados = tabla.filter((_, index) => checKs[index]);

        if (itemsSeleccionados.length === 0) {
            setFeedback({ type: "warning", message: "Seleccione al menos un articulo antes de agregarlo a la lista." });
            return;
        }

        const nuevosItems = [...itemsToTransfer];
        let itemsAgregados = 0;

        itemsSeleccionados.forEach((item) => {
            const exists = nuevosItems.some((existingItem) => getItemKey(existingItem) === getItemKey(item));
            if (!exists) {
                nuevosItems.push(item);
                itemsAgregados++;
            }
        });

        setItemsToTransfer(nuevosItems);
        setChecks(new Array(tabla.length).fill(false));
        setCheckAll(false);
        setFeedback({
            type: itemsAgregados > 0 ? "success" : "info",
            message: itemsAgregados > 0
                ? `${itemsAgregados} articulo(s) agregado(s). La lista ahora tiene ${nuevosItems.length} item(s).`
                : "Los articulos seleccionados ya estaban en la lista de traslado.",
        });
    };

    const removeItemFromTransfer = (itemsToRemove) => {
        const listToRemove = Array.isArray(itemsToRemove) ? itemsToRemove : [itemsToRemove];
        if (listToRemove.length === 0) return;

        const confirmationText = listToRemove.length === 1
            ? `¿Esta seguro de eliminar el articulo ${listToRemove[0].cons_producto} de la lista de traslado?`
            : `¿Esta seguro de eliminar ${listToRemove.length} articulos de la lista de traslado?`;

        if (window.confirm(confirmationText)) {
            const uniqueKeysToRemove = new Set(listToRemove.map((item) => getItemKey(item)));
            const updatedItems = itemsToTransfer.filter((item) => !uniqueKeysToRemove.has(getItemKey(item)));

            setItemsToTransfer(updatedItems);
            setFeedback({
                type: "info",
                message: `${listToRemove.length} articulo(s) removido(s). Quedan ${updatedItems.length} item(s) en la lista.`,
            });
        }
    };

    const buildTransferItems = () => {
        return itemsToTransfer.map((item) => ({
            id: item.id,
            cons_producto: item.cons_producto,
            cons_almacen: item.cons_almacen,
            serial: item.serial || null,
            bag_pack: item.bag_pack || null,
            s_pack: item.s_pack || null,
            m_pack: item.m_pack || null,
            l_pack: item.l_pack || null,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);

        const form = formRef.current;
        const origen = form.origen.value;
        const destino = form.destino.value;
        const fecha = form.fecha.value;
        const semanaInput = form.semana.value;
        const transferencias = buildTransferItems();

        if (itemsToTransfer.length === 0) {
            setLoading(false);
            setFeedback({ type: "warning", message: "No ha seleccionado ningun articulo para trasladar." });
            return;
        }

        if (destino === origen) {
            setLoading(false);
            setFeedback({ type: "warning", message: "El origen y el destino no pueden ser el mismo." });
            return;
        }

        try {
            const semana = await uSemana(semanaInput);
            const trasladoResponse = await ejecutarTraslado({
                origen,
                destino,
                fecha,
                semana,
                realizado_por: user.username,
                observaciones: `Precintos transferidos al almacen ${destino}`,
                items: transferencias,
            });

            const base64String = await generateTransferExcelBase64(transferencias, destino);

            try {
                const fechaEnvio = new Date().toLocaleDateString("es-ES");
                const datosCorreo = {
                    destinatario: "amaestre@banarica.com",
                    asunto: `Transferencia de Insumos - ${destino} (${fechaEnvio})`,
                    cuerpo: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
                .container { max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9; }
                .header { background-color: #28a745ff; color: white; padding: 10px; border-radius: 5px 5px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
                .content { padding: 0 10px; }
                .highlight { font-weight: bold; color: #28a745ff; }
                .details-box { background-color: #ffffff; border: 1px solid #e0e0e0; border-left: 5px solid #28a745ff; padding: 15px; margin-top: 15px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Notificacion de Transferencia de Insumos</h2>
                </div>
                <div class="content">
                    <p>Estimado/a destinatario/a,</p>
                    <p>Por medio del presente, se informa la transferencia de insumos realizada desde el almacen <span class="highlight">${origen}</span> hacia el almacen <span class="highlight">${destino}</span>.</p>
                    <div class="details-box">
                        <p><strong>Detalles de la Transferencia:</strong></p>
                        <ul>
                            <li><strong>Origen:</strong> <span class="highlight">${origen}</span></li>
                            <li><strong>Destino:</strong> <span class="highlight">${destino}</span></li>
                            <li><strong>Fecha de Envio:</strong> <span class="highlight">${fechaEnvio}</span></li>
                        </ul>
                    </div>
                    <p>El listado detallado de todos los insumos transferidos se adjunta a este correo en formato Excel (.xlsx).</p>
                    <p>Por favor, verifique el archivo adjunto para su registro y confirmacion de recepcion.</p>
                    <p>Atentamente,</p>
                    <p>El equipo de Logistica.</p>
                </div>
            </div>
        </body>
        </html>
    `,
                    archivo: {
                        nombre: `Transferencia_${destino.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
                        contenido: base64String,
                        tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                };
                await enviarCorreo(datosCorreo);
            } catch (error) {
                console.error("Error al enviar el correo de transferencia:", error);
                setFeedback({
                    type: "warning",
                    message: "La transferencia fue exitosa, pero hubo un error al enviar el correo con el Excel.",
                });
            }

            setPagination(1);
            setItemsToTransfer([]);
            setFeedback({ type: "success", message: trasladoResponse?.message || "Transferencia realizada" });
            setBool(true);
            setLoading(false);
        } catch (e) {
            console.error("Error al procesar transferencia:", e);
            setLoading(false);
            setFeedback({ type: "danger", message: e?.response?.data?.message || e?.message || "Error en la transferencia" });
        }
    };

    const nuevaTranferencia = async () => {
        setBool(false);
        setItemsToTransfer([]);
        setFeedback(null);
        await buscarArticulos();
    };

    return (
        <>
            {loading && (
                <div className="position-fixed top-50 start-50 translate-middle z-3">
                    <div className="bg-white border rounded shadow-sm px-3 py-2 text-center">
                        <PropagateLoader color="#0d6efd" />
                    </div>
                </div>
            )}

            <TransferListModal
                show={showModal}
                onClose={() => setShowModal(false)}
                items={itemsToTransfer}
                onRemove={removeItemFromTransfer}
            />

            <form ref={formRef} onSubmit={handleSubmit} className="py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-1 mb-2">
                    <div>
                        <h3 className="mb-0">Transferencias</h3>
                        <p className="text-muted small mb-0">Seleccione seriales disponibles y confirme el traslado.</p>
                    </div>
                </div>

                {feedback && (
                    <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 px-3 mb-2 small`} role="alert">
                        {feedback.message}
                        <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setFeedback(null)}></button>
                    </div>
                )}

                <div className="d-flex flex-wrap gap-2 mb-2">
                    <span className="badge text-bg-light border text-dark py-2 px-3">Origen: {origenSeleccionado || "Sin definir"}</span>
                    <span className="badge text-bg-light border text-dark py-2 px-3">Destino: {destinoSeleccionado || "Sin definir"}</span>
                    <span className="badge text-bg-light border text-dark py-2 px-3">Seleccion: {seleccionadosActuales}</span>
                    <span className="badge text-bg-light border text-dark py-2 px-3">En lista: {itemsToTransfer.length}</span>
                </div>

                <div className="card border-0 shadow-sm mb-2">
                    <div className="card-body py-2 px-3">
                        <div className="row g-2">
                            <div className="col-12 col-md-6 col-xl-3">
                                <label htmlFor="origen" className="form-label fw-semibold small mb-1">Origen</label>
                                <select
                                    className="form-select form-select-sm"
                                    id="origen"
                                    name="origen"
                                    value={origenSeleccionado}
                                    onChange={onChanageBuscar}
                                    disabled={bool}
                                >
                                    {almacenByUser.map((item, index) => (
                                        <option key={index} value={item.consecutivo}>{item.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <label htmlFor="destino" className="form-label fw-semibold small mb-1">Destino</label>
                                <select
                                    className="form-select form-select-sm"
                                    id="destino"
                                    name="destino"
                                    value={destinoSeleccionado}
                                    onChange={handleDestinoChange}
                                    disabled={bool}
                                >
                                    {almacenByUser.map((item, index) => (
                                        <option
                                            key={index}
                                            value={item.consecutivo}
                                            disabled={item.consecutivo === origenSeleccionado}
                                        >
                                            {item.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <label htmlFor="producto" className="form-label fw-semibold small mb-1">Articulo</label>
                                <select
                                    className="form-select form-select-sm"
                                    id="producto"
                                    name="producto"
                                    disabled={bool}
                                    onChange={onChanageBuscar}
                                >
                                    <option value="">Todos</option>
                                    {productos.map((item, index) => (
                                        <option key={index} value={item.consecutivo}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <label htmlFor="semana" className="form-label fw-semibold small mb-1">Semana</label>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    id="semana"
                                    name="semana"
                                    min={semanaData ? semanaData.semana_actual - semanaData.semana_previa : 0}
                                    max={semanaData ? semanaData.semana_actual * 1 + semanaData.semana_siguiente : 99}
                                    required
                                    disabled={bool}
                                />
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <label htmlFor="fecha" className="form-label fw-semibold small mb-1">Fecha</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    id="fecha"
                                    name="fecha"
                                    defaultValue={fechaActual}
                                    disabled={bool}
                                />
                            </div>
                            <div className="col-12">
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm px-0 text-decoration-none"
                                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                    disabled={bool}
                                >
                                    {showAdvancedFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
                                </button>
                            </div>

                            {showAdvancedFilters && (
                                <>
                                    {mostrarSerial && (
                                        <div className="col-12 col-md-6 col-xl-3">
                                            <label htmlFor="serial" className="form-label fw-semibold small mb-1">Serial Int</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                id="serial"
                                                name="serial"
                                                onChange={onChanageBuscar}
                                                disabled={bool}
                                            />
                                        </div>
                                    )}

                                    <div className="col-12 col-md-6 col-xl-3">
                                        <label htmlFor="bag_pack" className="form-label fw-semibold small mb-1">Serial Ext</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            id="bag_pack"
                                            name="bag_pack"
                                            onChange={onChanageBuscar}
                                            disabled={bool}
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 col-xl-2">
                                        <label htmlFor="s_pack" className="form-label fw-semibold small mb-1">S Pack</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            id="s_pack"
                                            name="s_pack"
                                            onChange={onChanageBuscar}
                                            disabled={bool}
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 col-xl-2">
                                        <label htmlFor="m_pack" className="form-label fw-semibold small mb-1">M Pack</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            id="m_pack"
                                            name="m_pack"
                                            onChange={onChanageBuscar}
                                            disabled={bool}
                                        />
                                    </div>

                                    <div className="col-12 col-md-6 col-xl-2">
                                        <label htmlFor="l_pack" className="form-label fw-semibold small mb-1">L Pack</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            id="l_pack"
                                            name="l_pack"
                                            onChange={onChanageBuscar}
                                            disabled={bool}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {itemsToTransfer.length > 0 && (
                    <div className="card border-0 shadow-sm mb-2">
                        <div className="card-body py-2 px-3">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-1 mb-2">
                                <div>
                                    <h6 className="mb-0">Resumen de la lista</h6>
                                    <small className="text-muted">Revise antes de confirmar.</small>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Articulo</th>
                                            <th>Cantidad</th>
                                            <th>Referencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(resumenTransferencia).map(([consProducto, detalle]) => (
                                            <tr key={consProducto}>
                                                <td>{consProducto}</td>
                                                <td>{detalle.cantidad}</td>
                                                <td>{detalle.seriales.slice(0, 3).join(", ")}{detalle.seriales.length > 3 ? "..." : ""}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card border-0 shadow-sm">
                    <div className="card-body py-2 px-3">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-3 col-xl-2">
                                <label htmlFor="limit" className="form-label fw-semibold small mb-1">Limite</label>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    id="limit"
                                    name="limit"
                                    min={1}
                                    max={total}
                                    ref={limitRef}
                                    value={draftLimit}
                                    onChange={handleDraftLimitChange}
                                    onBlur={handleDraftLimitCommit}
                                    onKeyDown={(e) => e.key === "Enter" && handleDraftLimitCommit()}
                                />
                            </div>
                            <div className="col-12 col-md-9 col-xl-3">
                                <div className="small text-uppercase text-muted fw-semibold">Resultados</div>
                                <div className="fw-semibold small">{total}</div>
                            </div>
                            <div className="col-12 col-md-6 col-xl-3">
                                <div className="small text-uppercase text-muted fw-semibold">Estado de seleccion</div>
                                <div className="fw-semibold small">Seleccionados: {seleccionadosActuales} | En lista: {itemsToTransfer.length}</div>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button
                                        type="button"
                                        onClick={limpiarFiltros}
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={bool}
                                    >
                                        Limpiar filtros
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(true)}
                                        className="btn btn-warning btn-sm"
                                        disabled={bool}
                                    >
                                        Ver lista ({itemsToTransfer.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={agregarItem}
                                        className="btn btn-primary btn-sm"
                                        disabled={bool || loading || checKs.every((c) => c === false)}
                                    >
                                        Agregar
                                    </button>
                                    {!bool ? (
                                        <button type="submit" className="btn btn-success btn-sm" disabled={loading}>
                                            {loading ? "Procesando..." : "Transferir"}
                                        </button>
                                    ) : (
                                        <button type="button" onClick={nuevaTranferencia} className="btn btn-primary btn-sm">
                                            Nueva transferencia
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-sm table-striped table-hover align-middle mb-2">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="checkAll"
                                                name="checkAll"
                                                onChange={handleCheckAll}
                                                checked={checkAll}
                                            />
                                        </th>
                                        <th>Alm</th>
                                        <th>Articulo</th>
                                        {mostrarSerial && <th>Serial Int</th>}
                                        <th>Serial Ext</th>
                                        <th>S Pack</th>
                                        <th>M Pack</th>
                                        <th>L Pack</th>
                                        <th className="d-none d-md-table-cell">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tabla.length === 0 && (
                                        <tr>
                                            <td colSpan={mostrarSerial ? 9 : 8} className="text-center text-muted py-4">
                                                No hay seriales disponibles con esos filtros.
                                            </td>
                                        </tr>
                                    )}
                                    {tabla.map((item, index) => (
                                        <tr key={item.id || `${item.cons_producto}-${index}`}>
                                            <td className="text-center">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`check-${index}`}
                                                    name={`check-${index}`}
                                                    checked={checKs[index] || false}
                                                    onChange={() => hadleChecks(index)}
                                                />
                                            </td>
                                            <td>{item?.cons_almacen}</td>
                                            <td>{item?.cons_producto}</td>
                                            {mostrarSerial && <td>{item?.serial}</td>}
                                            <td>{item?.bag_pack}</td>
                                            <td>{item?.s_pack}</td>
                                            <td>{item?.m_pack}</td>
                                            <td>{item?.l_pack}</td>
                                            <td className="d-none d-md-table-cell">
                                                <span className={`badge ${item?.available === true ? "text-bg-success" : "text-bg-secondary"}`}>
                                                    {item?.available === true ? "Disponible" : "Usado"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-center">
                            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
