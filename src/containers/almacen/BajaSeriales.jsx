import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@hooks/useAuth";
import { PropagateLoader } from "react-spinners";
import useDate from "@hooks/useDate";

import { listarProductosSeguridad, listarSeriales, darDeBajaSerial } from "@services/api/seguridad";
import { encontrarModulo } from "@services/api/configuracion";
import { filtrarSemanasRangoProgramador } from "@services/api/semanas";

import Paginacion from "@components/Paginacion";

const MOTIVOS = ["Avería", "Obsolescencia", "Pérdida", "Robo", "Destrucción", "Donación", "Otro"];

const getItemKey = (item) => `${item.cons_producto}-${item.serial || item.id}`;

const BajaListModal = ({ show, onClose, items, onRemove, mostrarSerial }) => {
    const [selectedToDelete, setSelectedToDelete] = useState([]);

    useEffect(() => {
        if (show) setSelectedToDelete([]);
    }, [show, items]);

    const handleCheck = (item) => {
        setSelectedToDelete((prev) => {
            const key = getItemKey(item);
            return prev.some((i) => getItemKey(i) === key)
                ? prev.filter((i) => getItemKey(i) !== key)
                : [...prev, item];
        });
    };

    const handleCheckAll = () => {
        setSelectedToDelete(selectedToDelete.length === items.length ? [] : [...items]);
    };

    const handleMassiveRemove = () => {
        if (!selectedToDelete.length) return window.alert("Debe seleccionar al menos un articulo.");
        if (window.confirm(`¿Eliminar ${selectedToDelete.length} articulo(s) de la lista?`)) {
            onRemove(selectedToDelete);
            setSelectedToDelete([]);
        }
    };

    if (!show) return null;

    const allChecked = items.length > 0 && selectedToDelete.length === items.length;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        <div className="modal-header py-2">
                            <div>
                                <h5 className="modal-title mb-0">Lista de baja</h5>
                                <small className="text-muted">{items.length} item(s) acumulados</small>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
                        </div>
                        <div className="modal-body py-2">
                            {items.length === 0 ? (
                                <div className="alert alert-light border mb-0">No hay articulos en la lista.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered table-striped align-middle text-center mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-custom-small">
                                                    <input className="form-check-input" type="checkbox" onChange={handleCheckAll} checked={allChecked} disabled={!items.length} />
                                                </th>
                                                <th className="text-custom-small">Alm</th>
                                                <th className="text-custom-small">Articulo</th>
                                                {mostrarSerial && <th className="text-custom-small">Serial Int</th>}
                                                <th className="text-custom-small">Serial Ext</th>
                                                <th className="text-custom-small">S Pack</th>
                                                <th className="text-custom-small">M Pack</th>
                                                <th className="text-custom-small">L Pack</th>
                                                <th className="text-custom-small text-end">Accion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => {
                                                const isSelected = selectedToDelete.some((i) => getItemKey(i) === getItemKey(item));
                                                return (
                                                    <tr key={getItemKey(item)}>
                                                        <td className="text-center">
                                                            <input className="form-check-input" type="checkbox" checked={isSelected} onChange={() => handleCheck(item)} />
                                                        </td>
                                                        <td className="text-custom-small">{item.cons_almacen}</td>
                                                        <td className="text-custom-small">{item.cons_producto}</td>
                                                        {mostrarSerial && <td className="text-custom-small">{item.serial || "-"}</td>}
                                                        <td className="text-custom-small">{item.bag_pack || "-"}</td>
                                                        <td className="text-custom-small">{item.s_pack || "-"}</td>
                                                        <td className="text-custom-small">{item.m_pack || "-"}</td>
                                                        <td className="text-custom-small">{item.l_pack || "-"}</td>
                                                        <td className="text-end">
                                                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onRemove(item)}>
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
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleMassiveRemove} disabled={!selectedToDelete.length}>
                                Eliminar seleccionados ({selectedToDelete.length})
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
};

export default function BajaSeriales() {
    const formRef = useRef();
    const limitRef = useRef();
    const fechaActual = useDate();

    const { almacenByUser, user } = useAuth();

    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([]);
    const [draftLimit, setDraftLimit] = useState("20");
    const [origenSeleccionado, setOrigenSeleccionado] = useState("");

    const [limit, setLimit] = useState(20);
    const [pagination, setPagination] = useState(1);

    const [checkAll, setCheckAll] = useState(false);
    const [checks, setChecks] = useState([]);

    const [itemsToBaja, setItemsToBaja] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const [semanas, setSemanas] = useState([]);
    const [bool, setBool] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mostrarSerial, setMostrarSerial] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const [motivo, setMotivo] = useState("");
    const [observacion, setObservacion] = useState("");

    const seleccionadosActuales = checks.filter(Boolean).length;

    const getFormData = () => {
        const formData = new FormData(formRef.current);
        return {
            cons_producto: formData.get("producto") || undefined,
            serial: formData.get("serial") || undefined,
            bag_pack: formData.get("bag_pack") || undefined,
            s_pack: formData.get("s_pack") || undefined,
            m_pack: formData.get("m_pack") || undefined,
            l_pack: formData.get("l_pack") || undefined,
            cons_almacen: formData.get("origen") || undefined,
            available: true,
            dado_de_baja: false,
        };
    };

    const buscarArticulos = useCallback(async () => {
        if (!formRef.current) return;
        setCheckAll(false);
        setChecks([]);
        try {
            const res = await listarSeriales(pagination, limit, getFormData());
            setTabla(res?.data || []);
            setTotal(res?.total || 0);
            setChecks(new Array((res?.data || []).length).fill(false));
        } catch {
            setFeedback({ type: "danger", message: "No fue posible cargar los seriales." });
        }
    }, [pagination, limit]);

    useEffect(() => {
        buscarArticulos();
    }, [buscarArticulos]);

    useEffect(() => {
        const origenInicial = almacenByUser?.[0]?.consecutivo || "";
        setOrigenSeleccionado(origenInicial);

        listarProductosSeguridad().then((res) =>
            setProductos((res || []).filter((item) => item.serial === true))
        );

        encontrarModulo("Semana", { syncWeeks: false })
            .then((res) => {
                const config = res[0];
                return filtrarSemanasRangoProgramador({
                    anho_actual: config.anho_actual,
                    semana_actual: config.semana_actual,
                    semana_previa: config.semana_previa,
                    semana_siguiente: config.semana_siguiente,
                    total_semanas_anho: config.total_semanas_anho,
                });
            })
            .then((lista) => setSemanas(lista || []))
            .catch(() => {});

        if (user?.id_rol === "Super administrador") {
            setMostrarSerial(true);
            return;
        }
        if (!user?.username) return;
        encontrarModulo(user.username)
            .then((config) => {
                const detalles = JSON.parse(config?.[0]?.detalles || "{}");
                setMostrarSerial((detalles?.botones || []).includes("disponibles_serial"));
            })
            .catch(() => setMostrarSerial(false));
    }, [user?.id_rol, user?.username, almacenByUser]);

    const onChangeBuscar = (e) => {
        setFeedback(null);
        if (e?.target?.name === "origen") setOrigenSeleccionado(e.target.value);
        if (pagination === 1) {
            buscarArticulos();
        } else {
            setPagination(1);
        }
    };

    const handleLimit = () => {
        const newLimit = parseInt(limitRef.current.value, 10);
        if (!(newLimit > 0)) { setDraftLimit(String(limit)); return; }
        if (pagination === 1 && newLimit === limit) return;
        setPagination(1);
        setLimit(newLimit);
        setDraftLimit(String(newLimit));
        setCheckAll(false);
    };

    const limpiarFiltros = () => {
        if (!formRef.current) return;
        formRef.current.reset();
        if (formRef.current.origen) formRef.current.origen.value = origenSeleccionado;
        if (formRef.current.fecha) formRef.current.fecha.value = fechaActual;
        setPagination(1);
        setCheckAll(false);
        setChecks([]);
        setFeedback(null);
        buscarArticulos();
    };

    const handleCheckAll = () => {
        const next = !checkAll;
        setChecks(new Array(tabla.length).fill(next));
        setCheckAll(next);
    };

    const handleCheck = (position) => {
        setChecks((prev) => {
            const next = [...prev];
            next[position] = !next[position];
            setCheckAll(next.every(Boolean));
            return next;
        });
    };

    const agregarItem = () => {
        const itemsSeleccionados = tabla.filter((_, i) => checks[i]);
        if (!itemsSeleccionados.length) {
            setFeedback({ type: "warning", message: "Seleccione al menos un articulo antes de agregar." });
            return;
        }

        const nuevos = [...itemsToBaja];
        let agregados = 0;
        itemsSeleccionados.forEach((item) => {
            if (!nuevos.some((ex) => getItemKey(ex) === getItemKey(item))) {
                nuevos.push(item);
                agregados++;
            }
        });

        setItemsToBaja(nuevos);
        setChecks(new Array(tabla.length).fill(false));
        setCheckAll(false);
        setFeedback({
            type: agregados > 0 ? "success" : "info",
            message: agregados > 0
                ? `${agregados} articulo(s) agregado(s). Lista: ${nuevos.length} item(s).`
                : "Los articulos seleccionados ya estaban en la lista.",
        });
    };

    const removeItem = (itemsToRemove) => {
        const list = Array.isArray(itemsToRemove) ? itemsToRemove : [itemsToRemove];
        const msg = list.length === 1 ? `¿Eliminar ${list[0].cons_producto} de la lista?` : `¿Eliminar ${list.length} articulos de la lista?`;
        if (window.confirm(msg)) {
            const keys = new Set(list.map(getItemKey));
            const updated = itemsToBaja.filter((i) => !keys.has(getItemKey(i)));
            setItemsToBaja(updated);
            setFeedback({ type: "info", message: `${list.length} articulo(s) removido(s). Quedan ${updated.length}.` });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback(null);

        if (!itemsToBaja.length) {
            setFeedback({ type: "warning", message: "No hay articulos en la lista para dar de baja." });
            return;
        }
        if (!motivo) {
            setFeedback({ type: "warning", message: "Debes seleccionar un motivo de baja." });
            return;
        }

        const form = formRef.current;
        const fecha = form.fecha.value;
        const semana = form.semana.value;

        if (!semana) {
            setFeedback({ type: "warning", message: "Debes seleccionar la semana." });
            return;
        }

        setLoading(true);
        try {
            const result = await darDeBajaSerial({
                serial_ids: itemsToBaja.map((s) => s.id),
                motivo,
                observacion: observacion.trim() || undefined,
                fecha,
                semana,
            });

            setItemsToBaja([]);
            setMotivo("");
            setObservacion("");
            setBool(true);
            setFeedback({
                type: "success",
                message: result?.message || `${itemsToBaja.length} serial(es) dado(s) de baja.`,
            });
        } catch (error) {
            setFeedback({ type: "danger", message: error?.message || "Error al dar de baja los seriales." });
        } finally {
            setLoading(false);
        }
    };

    const nuevaBaja = async () => {
        setBool(false);
        setItemsToBaja([]);
        setMotivo("");
        setObservacion("");
        setFeedback(null);
        await buscarArticulos();
    };

    return (
        <>
            {loading && (
                <div className="position-fixed top-50 start-50 translate-middle z-3">
                    <div className="bg-white border rounded shadow-sm px-3 py-2 text-center">
                        <PropagateLoader color="#dc3545" />
                    </div>
                </div>
            )}

            <BajaListModal
                show={showModal}
                onClose={() => setShowModal(false)}
                items={itemsToBaja}
                onRemove={removeItem}
                mostrarSerial={mostrarSerial}
            />

            <form ref={formRef} onSubmit={handleSubmit}>
                <h2 className="mb-2">Baja de seriales</h2>
                <div className="line"></div>

                {feedback && (
                    <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 mb-3 small`} role="alert">
                        {feedback.message}
                        <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
                    </div>
                )}

                {/* Filtros */}
                <div className="row g-2 mb-3">
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="origen" className="form-label mt-1 mb-1">Almacen</label>
                        <select className="form-select form-select-sm" id="origen" name="origen" value={origenSeleccionado} onChange={onChangeBuscar} disabled={bool}>
                            <option value="">Todos mis almacenes</option>
                            {almacenByUser.map((a) => (
                                <option key={a.consecutivo} value={a.consecutivo}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="producto" className="form-label mt-1 mb-1">Articulo</label>
                        <select className="form-select form-select-sm" id="producto" name="producto" disabled={bool} onChange={onChangeBuscar}>
                            <option value="">Todos</option>
                            {productos.map((p) => (
                                <option key={p.consecutivo} value={p.consecutivo}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="fecha" className="form-label mt-1 mb-1">Fecha</label>
                        <input type="date" className="form-control form-control-sm" id="fecha" name="fecha" defaultValue={fechaActual} disabled={bool} />
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="semana" className="form-label mt-1 mb-1">Semana</label>
                        <select className="form-select form-select-sm" id="semana" name="semana" required disabled={bool} defaultValue="">
                            <option value="" disabled>Seleccione</option>
                            {semanas.map((s) => (
                                <option key={s.consecutivo} value={s.consecutivo}>{s.consecutivo}</option>
                            ))}
                        </select>
                    </div>
                    {mostrarSerial && (
                        <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                            <label htmlFor="serial" className="form-label mt-1 mb-1">Serial Int</label>
                            <input type="text" className="form-control form-control-sm" id="serial" name="serial" onChange={onChangeBuscar} disabled={bool} />
                        </div>
                    )}
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="bag_pack" className="form-label mt-1 mb-1">Serial Ext</label>
                        <input type="text" className="form-control form-control-sm" id="bag_pack" name="bag_pack" onChange={onChangeBuscar} disabled={bool} />
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="s_pack" className="form-label mt-1 mb-1">S Pack</label>
                        <input type="text" className="form-control form-control-sm" id="s_pack" name="s_pack" onChange={onChangeBuscar} disabled={bool} />
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="m_pack" className="form-label mt-1 mb-1">M Pack</label>
                        <input type="text" className="form-control form-control-sm" id="m_pack" name="m_pack" onChange={onChangeBuscar} disabled={bool} />
                    </div>
                    <div className="col-6 col-sm-4 col-md-3 col-xl-2">
                        <label htmlFor="l_pack" className="form-label mt-1 mb-1">L Pack</label>
                        <input type="text" className="form-control form-control-sm" id="l_pack" name="l_pack" onChange={onChangeBuscar} disabled={bool} />
                    </div>
                </div>

                {/* Motivo y observacion — solo visible cuando hay items en la lista */}
                {itemsToBaja.length > 0 && (
                    <div className="row g-2 mb-3">
                        <div className="col-12">
                            <h6 className="mb-1">
                                Lista de baja &nbsp;
                                <span className="badge bg-danger">{itemsToBaja.length}</span>
                            </h6>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4 col-xl-3">
                            <label htmlFor="baja-motivo" className="form-label mt-1 mb-1">Motivo <span className="text-danger">*</span></label>
                            <select id="baja-motivo" className="form-select form-select-sm" value={motivo} onChange={(e) => setMotivo(e.target.value)} required disabled={bool}>
                                <option value="">-- Seleccionar motivo --</option>
                                {MOTIVOS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-sm-6 col-md-8 col-xl-9">
                            <label htmlFor="baja-observacion" className="form-label mt-1 mb-1">Observacion</label>
                            <input
                                id="baja-observacion"
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Opcional"
                                maxLength={200}
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                disabled={bool}
                            />
                        </div>
                    </div>
                )}

                {/* Barra de control */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 mt-3">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <label htmlFor="limite-baja" className="mb-0 small">Limite:</label>
                        <input
                            id="limite-baja"
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: "65px" }}
                            min={1}
                            ref={limitRef}
                            value={draftLimit}
                            onChange={(e) => setDraftLimit(e.target.value)}
                            onBlur={handleLimit}
                            onKeyDown={(e) => e.key === "Enter" && handleLimit()}
                        />
                        <span className="text-custom-small text-muted">
                            {total} resultados &nbsp;·&nbsp; Sel: {seleccionadosActuales} &nbsp;·&nbsp; Lista: {itemsToBaja.length}
                        </span>
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                        <button type="button" onClick={limpiarFiltros} className="btn btn-sm btn-outline-secondary" disabled={bool}>Limpiar</button>
                        <button type="button" onClick={() => setShowModal(true)} className="btn btn-sm btn-warning" disabled={bool}>Ver lista ({itemsToBaja.length})</button>
                        <button type="button" onClick={agregarItem} className="btn btn-sm btn-primary" disabled={bool || loading || checks.every((c) => !c)}>Agregar</button>
                        {!bool ? (
                            <button type="submit" className="btn btn-sm btn-danger" disabled={loading || !itemsToBaja.length || !motivo}>
                                {loading ? "Procesando..." : "Dar de baja"}
                            </button>
                        ) : (
                            <button type="button" onClick={nuevaBaja} className="btn btn-sm btn-primary">Nueva baja</button>
                        )}
                    </div>
                </div>

                {/* Tabla */}
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-sm mt-2 text-center align-middle">
                        <thead className="align-middle">
                            <tr>
                                <th className="text-custom-small text-center">
                                    <input className="form-check-input" type="checkbox" onChange={handleCheckAll} checked={checkAll} />
                                </th>
                                <th className="text-custom-small text-center">Alm</th>
                                <th className="text-custom-small text-center">Articulo</th>
                                {mostrarSerial && <th className="text-custom-small text-center">Serial Int</th>}
                                <th className="text-custom-small text-center">Serial Ext</th>
                                <th className="text-custom-small text-center">S Pack</th>
                                <th className="text-custom-small text-center">M Pack</th>
                                <th className="text-custom-small text-center">L Pack</th>
                            </tr>
                        </thead>
                        <tbody className="align-middle">
                            {tabla.length === 0 && (
                                <tr>
                                    <td colSpan={mostrarSerial ? 8 : 7} className="text-center text-muted py-4 text-custom-small">
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
                                            checked={checks[index] || false}
                                            onChange={() => handleCheck(index)}
                                        />
                                    </td>
                                    <td className="text-custom-small text-center">{item.cons_almacen}</td>
                                    <td className="text-custom-small text-center">{item.cons_producto}</td>
                                    {mostrarSerial && <td className="text-custom-small text-center">{item.serial}</td>}
                                    <td className="text-custom-small text-center">{item.bag_pack}</td>
                                    <td className="text-custom-small text-center">{item.s_pack}</td>
                                    <td className="text-custom-small text-center">{item.m_pack}</td>
                                    <td className="text-custom-small text-center">{item.l_pack}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </form>
        </>
    );
}
