import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@hooks/useAuth";
import { useBotonesUsuario } from "@hooks/useBotonesUsuario";
import { PropagateLoader } from "react-spinners";
import { FaCamera, FaTrashAlt, FaCheckCircle, FaTimesCircle, FaCog } from "react-icons/fa";
import useDate from "@hooks/useDate";

import { listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { listarAlmacenes } from "@services/api/almacenes";
import {
    crearTrasladoPendiente,
    listarTrasladosPendientes,
    contarTrasladosPendientes,
    aceptarTraslado,
    rechazarTraslado,
    listarEvidenciasTraslado,
    listarArticulosTraslado,
} from "@services/api/traslados";
import { encontrarModulo, actualizarModulo } from "@services/api/configuracion";
import { enviarCorreo } from "@services/api/email";
import { filtrarSemanasRangoProgramador } from "@services/api/semanas";
import { useEvidencias } from "@containers/programacion/hooks/useEvidencias";
import ProgramadorEvidenceModal from "@containers/programacion/ProgramadorEvidenceModal";
import VerEvidenciasModal from "@containers/programacion/VerEvidenciasModal";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmails = (value) => (
    String(value || "")
        .split(/[,;]+/)
        .map((email) => email.trim())
        .filter((email) => EMAIL_REGEX.test(email))
);

const PACK_LABELS = { s_pack: "S Pack", m_pack: "M Pack", l_pack: "L Pack" };

const buildEmptyFilaAleatoria = () => ({ id: Date.now() + Math.random(), producto: "", cantidad: "", serialPack: "" });

const ScanActionButton = ({ label, onClick, disabled }) => (
    <button
        type="button"
        className="input-group-text bg-white text-secondary"
        onClick={onClick}
        disabled={disabled}
        aria-label={`Escanear ${label}`}
        title={`Escanear ${label}`}
        style={{ minWidth: "44px", cursor: disabled ? "not-allowed" : "pointer" }}
    >
        <FaCamera />
    </button>
);

const TransferListModal = ({ show, onClose, items, onRemove, mostrarSerial }) => {
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
                                <>
                                    {/* Mobile: tarjetas */}
                                    <div className="d-md-none">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                onChange={handleCheckAll}
                                                checked={allChecked}
                                                disabled={items.length === 0}
                                                id="modal-check-all-mobile"
                                            />
                                            <label htmlFor="modal-check-all-mobile" className="mb-0 text-custom-small">Seleccionar todos</label>
                                        </div>
                                        {items.map((item) => {
                                            const isSelected = selectedItemsToDelete.some((i) => getItemKey(i) === getItemKey(item));

                                            return (
                                                <div key={getItemKey(item)} className="border rounded p-2 mb-2">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleCheck(item)}
                                                                id={`modal-item-mobile-${getItemKey(item)}`}
                                                            />
                                                            <label className="form-check-label fw-bold text-custom-small" htmlFor={`modal-item-mobile-${getItemKey(item)}`}>
                                                                {item.cons_producto}
                                                            </label>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm text-decoration-none p-0"
                                                            style={{ width: 26, height: 26, lineHeight: "24px", color: "#dc3545" }}
                                                            title="Eliminar"
                                                            onClick={() => onRemove(item)}
                                                        >
                                                            <FaTrashAlt size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="text-custom-small text-muted mt-1">
                                                        {mostrarSerial && <div>Serial Int: {item.serial || "-"}</div>}
                                                        <div>Serial Ext: {item.bag_pack || "-"}</div>
                                                        <div>S Pack: {item.s_pack || "-"} &middot; M Pack: {item.m_pack || "-"} &middot; L Pack: {item.l_pack || "-"}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop: tabla */}
                                    <div className="d-none d-md-block table-responsive">
                                        <table className="table table-sm table-hover align-middle text-center mb-0">
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
                                                    <th className="text-center">Articulo</th>
                                                    {mostrarSerial && <th className="text-center">Serial Int</th>}
                                                    <th className="text-center">Serial Ext</th>
                                                    <th className="text-center">S Pack</th>
                                                    <th className="text-center">M Pack</th>
                                                    <th className="text-center">L Pack</th>
                                                    <th className="text-center">Accion</th>
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
                                                            <td className="text-center">{item.cons_producto}</td>
                                                            {mostrarSerial && <td className="text-center">{item.serial || "-"}</td>}
                                                            <td className="text-center">{item.bag_pack || "-"}</td>
                                                            <td className="text-center">{item.s_pack || "-"}</td>
                                                            <td className="text-center">{item.m_pack || "-"}</td>
                                                            <td className="text-center">{item.l_pack || "-"}</td>
                                                            <td className="text-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link btn-sm text-decoration-none p-0"
                                                                    style={{ width: 26, height: 26, lineHeight: "24px", color: "#dc3545" }}
                                                                    title="Eliminar"
                                                                    onClick={() => onRemove(item)}
                                                                >
                                                                    <FaTrashAlt size={12} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer py-2">
                            <div className="d-grid gap-2 d-sm-flex justify-content-sm-between w-100">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm order-2 order-sm-1"
                                    onClick={handleMassiveRemove}
                                    disabled={selectedItemsToDelete.length === 0}
                                >
                                    Eliminar seleccionados ({selectedItemsToDelete.length})
                                </button>
                                <button type="button" className="btn btn-secondary btn-sm order-1 order-sm-2" onClick={onClose}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

const formatearFechaCorta = (value) => {
    if (!value) return "-";
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }
    return String(value);
};

const PendienteCard = ({ traslado, tipo, procesando, onAceptar, onRechazar, onSubirEvidencia, onVerEvidencia, onVerArticulos }) => (
    <div className="border rounded p-2 mb-2 bg-white">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
            <div>
                <strong className="text-custom-small">{traslado.consecutivo}</strong>
                <div className="text-custom-small text-muted">
                    {traslado.origen} &rarr; {traslado.destino}
                </div>
            </div>
            <span className="badge text-bg-warning">Pendiente</span>
        </div>
        <div className="text-custom-small text-muted mt-1">
            <div>Semana: {traslado.semana || "-"} &middot; Fecha: {formatearFechaCorta(traslado.fecha_salida)}</div>
            <div>Articulos: {traslado.total_items ?? "-"}</div>
            <div>
                Evidencia de entrega: {traslado.evidencia_cargada ? (
                    <span className="text-success">Cargada ({traslado.evidencia_total_fotos || 0} fotos)</span>
                ) : (
                    <span className="text-muted">Sin cargar (opcional)</span>
                )}
            </div>
        </div>
        <div className="d-grid gap-2 d-sm-flex flex-sm-wrap mt-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onVerArticulos(traslado)}>
                Ver articulos
            </button>

            {traslado.evidencia_cargada && (
                <button type="button" className="btn btn-sm btn-outline-info" onClick={() => onVerEvidencia(traslado)}>
                    Ver evidencia
                </button>
            )}

            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => onSubirEvidencia({
                    id: traslado.id,
                    consecutivo: traslado.consecutivo,
                    semanaLabel: traslado.semana,
                    fecha: traslado.fecha_salida,
                    contenedorLabel: traslado.consecutivo,
                    destino: traslado.destino,
                })}
            >
                <FaCamera className="me-1" /> {traslado.evidencia_cargada ? "Agregar evidencia" : "Subir evidencia (opcional)"}
            </button>

            {tipo === "recibir" && (
                <>
                    <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => onAceptar(traslado)}
                        disabled={procesando === traslado.id}
                    >
                        <FaCheckCircle className="me-1" /> Aceptar
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRechazar(traslado)}
                        disabled={procesando === traslado.id}
                    >
                        <FaTimesCircle className="me-1" /> Rechazar
                    </button>
                </>
            )}
        </div>
    </div>
);

const PendientesView = ({
    cargando,
    pendientesRecibir,
    pendientesEnviados,
    procesandoPendienteId,
    onAceptar,
    onRechazar,
    onSubirEvidencia,
    onVerEvidencia,
    onVerArticulos,
    onRefrescar,
}) => (
    <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Por recibir &nbsp;<span className="badge bg-warning text-dark">{pendientesRecibir.length}</span></h6>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onRefrescar} disabled={cargando}>
                {cargando ? "Actualizando..." : "Actualizar"}
            </button>
        </div>

        {cargando ? (
            <div className="text-center text-muted py-3 text-custom-small">Cargando transferencias pendientes...</div>
        ) : pendientesRecibir.length === 0 ? (
            <div className="text-center text-muted py-3 text-custom-small border rounded bg-light mb-3">
                No tienes transferencias pendientes por aceptar.
            </div>
        ) : (
            <div className="mb-3">
                {pendientesRecibir.map((traslado) => (
                    <PendienteCard
                        key={traslado.id}
                        traslado={traslado}
                        tipo="recibir"
                        procesando={procesandoPendienteId}
                        onAceptar={onAceptar}
                        onRechazar={onRechazar}
                        onSubirEvidencia={onSubirEvidencia}
                        onVerEvidencia={onVerEvidencia}
                        onVerArticulos={onVerArticulos}
                    />
                ))}
            </div>
        )}

        <h6 className="mb-2">Enviadas, pendientes por aceptar &nbsp;<span className="badge bg-secondary">{pendientesEnviados.length}</span></h6>
        {cargando ? (
            <div className="text-center text-muted py-3 text-custom-small">Cargando...</div>
        ) : pendientesEnviados.length === 0 ? (
            <div className="text-center text-muted py-3 text-custom-small border rounded bg-light">
                No tienes transferencias enviadas en espera de aceptacion.
            </div>
        ) : (
            <div>
                {pendientesEnviados.map((traslado) => (
                    <PendienteCard
                        key={traslado.id}
                        traslado={traslado}
                        tipo="enviado"
                        onSubirEvidencia={onSubirEvidencia}
                        onVerEvidencia={onVerEvidencia}
                        onVerArticulos={onVerArticulos}
                    />
                ))}
            </div>
        )}
    </div>
);

const ArticulosTrasladoModal = ({ show, onClose, loading, error, articulos }) => {
    if (!show) return null;

    const resumen = buildTransferSummary(articulos);

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        <div className="modal-header py-2">
                            <h5 className="modal-title mb-0">Articulos de la transferencia</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body py-2">
                            {loading ? (
                                <div className="text-center text-muted py-3 text-custom-small">Cargando articulos...</div>
                            ) : error ? (
                                <div className="alert alert-danger mb-0">{error}</div>
                            ) : articulos.length === 0 ? (
                                <div className="alert alert-light border mb-0">No se encontraron articulos para esta transferencia.</div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <strong className="text-custom-small">Resumen por producto:</strong>
                                        <div className="table-responsive mt-1">
                                            <table className="table table-sm table-bordered table-striped align-middle text-center mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-custom-small">Articulo</th>
                                                        <th className="text-custom-small">Cantidad</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(resumen).map(([consProducto, detalle]) => (
                                                        <tr key={consProducto}>
                                                            <td className="text-custom-small">{consProducto}</td>
                                                            <td className="text-custom-small">{detalle.cantidad}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <strong className="text-custom-small">Detalle de seriales:</strong>
                                    <ul className="list-group list-group-flush mt-1">
                                        {articulos.map((item) => (
                                            <li key={item.id} className="list-group-item small">
                                                <strong>{item.cons_producto}</strong>
                                                {item.serial && <> &middot; Serial Int: {item.serial}</>}
                                                {item.bag_pack && <> &middot; Serial Ext: {item.bag_pack}</>}
                                                {item.s_pack && <> &middot; S Pack: {item.s_pack}</>}
                                                {item.m_pack && <> &middot; M Pack: {item.m_pack}</>}
                                                {item.l_pack && <> &middot; L Pack: {item.l_pack}</>}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        <div className="modal-footer py-2">
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

    const scannerVideoRef = useRef(null);
    const scannerStreamRef = useRef(null);
    const scannerFrameRef = useRef(null);
    const barcodeDetectorRef = useRef(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerError, setScannerError] = useState("");
    const [scannerSupported, setScannerSupported] = useState(true);
    const [scannerFilaId, setScannerFilaId] = useState(null);

    const { almacenByUser, user } = useAuth();
    const { tieneBoton } = useBotonesUsuario();

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

    const [semanas, setSemanas] = useState([]);
    const [todosAlmacenes, setTodosAlmacenes] = useState([]);
    const [bool, setBool] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mostrarSerial, setMostrarSerial] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const [vista, setVista] = useState("manual"); // 'manual' | 'aleatoria' | 'pendientes'
    const modoAleatorio = vista === "aleatoria";
    const [agruparPor, setAgruparPor] = useState("s_pack");
    const [filasAleatorias, setFilasAleatorias] = useState([]);
    const [generandoAleatorio, setGenerandoAleatorio] = useState(false);

    const [pendientesRecibir, setPendientesRecibir] = useState([]);
    const [pendientesEnviados, setPendientesEnviados] = useState([]);
    const [totalPendientesRecibir, setTotalPendientesRecibir] = useState(0);
    const [cargandoPendientes, setCargandoPendientes] = useState(false);
    const [procesandoPendienteId, setProcesandoPendienteId] = useState(null);
    const [evidenciasDriveFolderIdTraslado, setEvidenciasDriveFolderIdTraslado] = useState("");

    const [correosCcTransferencias, setCorreosCcTransferencias] = useState("");
    const [correosCcDraft, setCorreosCcDraft] = useState("");
    const [showConfigCc, setShowConfigCc] = useState(false);
    const [guardandoConfigCc, setGuardandoConfigCc] = useState(false);

    const [showVerEvidenciaTraslado, setShowVerEvidenciaTraslado] = useState(false);
    const [verEvidenciaTrasladoLoading, setVerEvidenciaTrasladoLoading] = useState(false);
    const [verEvidenciaTrasladoError, setVerEvidenciaTrasladoError] = useState(null);
    const [verEvidenciaTrasladoFotos, setVerEvidenciaTrasladoFotos] = useState([]);
    const [verEvidenciaTrasladoCarpetaUrl, setVerEvidenciaTrasladoCarpetaUrl] = useState(null);
    const [verEvidenciaTrasladoActual, setVerEvidenciaTrasladoActual] = useState(null);

    const [showArticulosTraslado, setShowArticulosTraslado] = useState(false);
    const [articulosTrasladoLoading, setArticulosTrasladoLoading] = useState(false);
    const [articulosTrasladoError, setArticulosTrasladoError] = useState(null);
    const [articulosTrasladoLista, setArticulosTrasladoLista] = useState([]);

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
        const origenInicial = almacenByUser?.[0]?.consecutivo || "";
        const destinoInicial = almacenByUser.find((item) => item.consecutivo !== origenInicial)?.consecutivo || origenInicial;
        setOrigenSeleccionado(origenInicial);
        setDestinoSeleccionado(destinoInicial);

        const loadConfig = async () => {
            listarAlmacenes().then((res) => setTodosAlmacenes((res || []).filter((item) => item.activo !== false)));
            listarProductosSeguridad().then((res) => setProductos(res.filter((item) => item.serial === true)));
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

            if (!user?.username) {
                setMostrarSerial(false);
                return;
            }

            try {
                const config = await encontrarModulo(user.username);
                const detallesRaw = config?.[0]?.detalles;
                const detalles = detallesRaw ? JSON.parse(detallesRaw) : {};
                const botones = Array.isArray(detalles?.botones) ? detalles.botones : [];
                setMostrarSerial(botones.includes("disponibles_serial"));
            } catch (error) {
                console.error("Error cargando permisos de serial interno en transferencias:", error);
                setMostrarSerial(false);
            }
        };

        loadConfig();
    }, [user?.id_rol, user?.username, almacenByUser]);

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

    const almacenesConsecutivos = almacenByUser.map((item) => item.consecutivo);

    const cargarConteoPendientes = useCallback(async () => {
        if (almacenesConsecutivos.length === 0) return;
        try {
            const res = await contarTrasladosPendientes(almacenesConsecutivos);
            setTotalPendientesRecibir(res?.total || 0);
        } catch (error) {
            console.error("Error al contar transferencias pendientes:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [almacenByUser]);

    const cargarPendientes = useCallback(async () => {
        if (almacenesConsecutivos.length === 0) return;
        setCargandoPendientes(true);
        try {
            const [recibir, enviados] = await Promise.all([
                listarTrasladosPendientes(almacenesConsecutivos, "recibir"),
                listarTrasladosPendientes(almacenesConsecutivos, "enviados"),
            ]);
            setPendientesRecibir(recibir || []);
            setPendientesEnviados(enviados || []);
        } catch (error) {
            console.error("Error al cargar transferencias pendientes:", error);
            setFeedback({ type: "danger", message: "No fue posible cargar las transferencias pendientes." });
        } finally {
            setCargandoPendientes(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [almacenByUser]);

    useEffect(() => {
        cargarConteoPendientes();
    }, [cargarConteoPendientes]);

    useEffect(() => {
        encontrarModulo("Google_drive_evidencias_traslados")
            .then((res) => {
                try {
                    const detalles = res?.[0]?.detalles;
                    if (detalles) {
                        const config = JSON.parse(detalles);
                        if (config?.carpetaID) setEvidenciasDriveFolderIdTraslado(config.carpetaID);
                    }
                } catch { /* carpeta de evidencias de traslados no configurada aun */ }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        encontrarModulo("Transferencias_correos_cc")
            .then((res) => {
                try {
                    const detalles = res?.[0]?.detalles;
                    const config = detalles ? JSON.parse(detalles) : {};
                    setCorreosCcTransferencias(config?.correosCc || "");
                } catch { /* correos cc no configurados aun */ }
            })
            .catch(() => {});
    }, []);

    const abrirConfigCc = () => {
        setCorreosCcDraft(correosCcTransferencias);
        setShowConfigCc(true);
    };

    const guardarConfigCc = async () => {
        setGuardandoConfigCc(true);
        try {
            const res = await actualizarModulo({
                modulo: "Transferencias_correos_cc",
                detalles: JSON.stringify({ correosCc: correosCcDraft.trim() }),
            });
            if (!res) throw new Error("No fue posible guardar la configuracion.");
            setCorreosCcTransferencias(correosCcDraft.trim());
            setShowConfigCc(false);
            setFeedback({ type: "success", message: "Correos CC de Transferencias actualizados." });
        } catch (error) {
            setFeedback({ type: "danger", message: error?.message || "No fue posible guardar la configuracion de correos CC." });
        } finally {
            setGuardandoConfigCc(false);
        }
    };

    const cambiarVista = (nuevaVista) => {
        setVista(nuevaVista);
        setFeedback(null);
        if (nuevaVista === "aleatoria") {
            setFilasAleatorias((prev) => (prev.length ? prev : [buildEmptyFilaAleatoria()]));
        }
        if (nuevaVista === "pendientes") {
            cargarPendientes();
        }
    };

    const enviarCorreoAceptacion = async (traslado) => {
        const { destinatario: destinatariosAlmacenes, cc: ccTransferencia } = obtenerCorreosAlmacenes(traslado.origen, traslado.destino);

        if (destinatariosAlmacenes.length === 0) return;

        try {
            const fechaAceptacion = new Date().toLocaleDateString("es-ES");
            const datosCorreo = {
                destinatario: destinatariosAlmacenes.join(","),
                ...(ccTransferencia.length > 0 && { cc: ccTransferencia.join(",") }),
                asunto: `Transferencia aceptada - ${traslado.consecutivo} (${fechaAceptacion})`,
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
                    <h2>Transferencia de Insumos Aceptada</h2>
                </div>
                <div class="content">
                    <p>Estimado/a destinatario/a,</p>
                    <p>La transferencia de insumos desde el almacen <span class="highlight">${traslado.origen}</span> hacia el almacen <span class="highlight">${traslado.destino}</span> fue aceptada y completada.</p>
                    <div class="details-box">
                        <p><strong>Detalles de la Transferencia:</strong></p>
                        <ul>
                            <li><strong>Consecutivo:</strong> <span class="highlight">${traslado.consecutivo}</span></li>
                            <li><strong>Origen:</strong> <span class="highlight">${traslado.origen}</span></li>
                            <li><strong>Destino:</strong> <span class="highlight">${traslado.destino}</span></li>
                            <li><strong>Semana:</strong> <span class="highlight">${traslado.semana || "-"}</span></li>
                            <li><strong>Articulos:</strong> <span class="highlight">${traslado.total_items ?? "-"}</span></li>
                            <li><strong>Fecha de aceptacion:</strong> <span class="highlight">${fechaAceptacion}</span></li>
                        </ul>
                    </div>
                    <p>Atentamente,</p>
                    <p>El equipo de Logistica.</p>
                </div>
            </div>
        </body>
        </html>
    `,
            };
            await enviarCorreo(datosCorreo);
        } catch (error) {
            console.error("Error al enviar el correo de aceptacion de transferencia:", error);
        }
    };

    const handleAceptarPendiente = async (traslado) => {
        if (!window.confirm(`¿Aceptar la transferencia ${traslado.consecutivo} de ${traslado.origen} hacia ${traslado.destino}?`)) return;

        setProcesandoPendienteId(traslado.id);
        try {
            const res = await aceptarTraslado(traslado.id, user);
            setFeedback({ type: "success", message: res?.message || "Transferencia aceptada." });
            await enviarCorreoAceptacion(traslado);
            await cargarPendientes();
            await cargarConteoPendientes();
        } catch (error) {
            setFeedback({ type: "danger", message: error?.message || "No fue posible aceptar la transferencia." });
        } finally {
            setProcesandoPendienteId(null);
        }
    };

    const handleRechazarPendiente = async (traslado) => {
        const motivo = window.prompt(`Motivo del rechazo de la transferencia ${traslado.consecutivo} (opcional):`);
        if (motivo === null) return;

        if (!window.confirm(`¿Rechazar la transferencia ${traslado.consecutivo}? Los articulos volveran a estar disponibles en ${traslado.origen}.`)) return;

        setProcesandoPendienteId(traslado.id);
        try {
            const res = await rechazarTraslado(traslado.id, user, motivo);
            setFeedback({ type: "info", message: res?.message || "Transferencia rechazada." });
            await cargarPendientes();
            await cargarConteoPendientes();
        } catch (error) {
            setFeedback({ type: "danger", message: error?.message || "No fue posible rechazar la transferencia." });
        } finally {
            setProcesandoPendienteId(null);
        }
    };

    const updateLocalRowTraslado = useCallback((id, updater) => {
        setPendientesEnviados((prev) => prev.map((row) => (row.id === id ? updater(row) : row)));
        setPendientesRecibir((prev) => prev.map((row) => (row.id === id ? updater(row) : row)));
    }, []);

    const setAlertTraslado = useCallback(({ mensaje, color }) => {
        setFeedback({ type: color, message: mensaje });
    }, []);

    const {
        showEvidenciaModal: showEvidenciaTrasladoModal,
        selectedProgramacion: selectedTrasladoEvidencia,
        uploadingEvidencia: uploadingEvidenciaTraslado,
        evidenciaFiles: evidenciaTrasladoFiles,
        evidenciaResultados: evidenciaTrasladoResultados,
        setEvidenciaFiles: setEvidenciaTrasladoFiles,
        setEvidenciaResultados: setEvidenciaTrasladoResultados,
        cerrarModalEvidencia: cerrarModalEvidenciaTraslado,
        abrirModalEvidencia: abrirModalEvidenciaTraslado,
        handleEvidenciaFilesChange: handleEvidenciaTrasladoFilesChange,
        handleEvidenciaCameraChange: handleEvidenciaTrasladoCameraChange,
        subirEvidenciasProgramacion: subirEvidenciaTraslado,
    } = useEvidencias({
        evidenciasDriveFolderId: evidenciasDriveFolderIdTraslado,
        updateLocalRow: updateLocalRowTraslado,
        setAlert: setAlertTraslado,
        setReloadKey: () => {},
        entityType: "traslado",
    });

    const abrirVerEvidenciaTraslado = async (traslado) => {
        setVerEvidenciaTrasladoActual(traslado);
        setShowVerEvidenciaTraslado(true);
        setVerEvidenciaTrasladoLoading(true);
        setVerEvidenciaTrasladoError(null);
        setVerEvidenciaTrasladoFotos([]);
        setVerEvidenciaTrasladoCarpetaUrl(null);

        try {
            const res = await listarEvidenciasTraslado(traslado.id, user);
            setVerEvidenciaTrasladoFotos(res?.data || []);
            setVerEvidenciaTrasladoCarpetaUrl(res?.carpetaUrl || null);
        } catch (error) {
            setVerEvidenciaTrasladoError(error.message || "No fue posible cargar la evidencia.");
        } finally {
            setVerEvidenciaTrasladoLoading(false);
        }
    };

    const cerrarVerEvidenciaTraslado = () => {
        setShowVerEvidenciaTraslado(false);
        setVerEvidenciaTrasladoFotos([]);
        setVerEvidenciaTrasladoError(null);
        setVerEvidenciaTrasladoCarpetaUrl(null);
        setVerEvidenciaTrasladoActual(null);
    };

    const irASubirDesdeVerTraslado = () => {
        const traslado = verEvidenciaTrasladoActual;
        cerrarVerEvidenciaTraslado();
        if (traslado) {
            abrirModalEvidenciaTraslado({
                id: traslado.id,
                consecutivo: traslado.consecutivo,
                semanaLabel: traslado.semana,
                fecha: traslado.fecha_salida,
                contenedorLabel: traslado.consecutivo,
                destino: traslado.destino,
            });
        }
    };

    const abrirArticulosTraslado = async (traslado) => {
        setShowArticulosTraslado(true);
        setArticulosTrasladoLoading(true);
        setArticulosTrasladoError(null);
        setArticulosTrasladoLista([]);

        try {
            const res = await listarArticulosTraslado(traslado.id, user);
            setArticulosTrasladoLista(res?.data || []);
        } catch (error) {
            setArticulosTrasladoError(error.message || "No fue posible cargar los articulos.");
        } finally {
            setArticulosTrasladoLoading(false);
        }
    };

    const cerrarArticulosTraslado = () => {
        setShowArticulosTraslado(false);
        setArticulosTrasladoLista([]);
        setArticulosTrasladoError(null);
    };

    const agregarFilaAleatoria = () => {
        setFilasAleatorias((prev) => [...prev, buildEmptyFilaAleatoria()]);
    };

    const actualizarFilaAleatoria = (id, campo, valor) => {
        setFilasAleatorias((prev) => prev.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)));
    };

    const eliminarFilaAleatoria = (id) => {
        setFilasAleatorias((prev) => prev.filter((fila) => fila.id !== id));
    };

    const closeScanner = useCallback(() => {
        if (scannerFrameRef.current) {
            cancelAnimationFrame(scannerFrameRef.current);
            scannerFrameRef.current = null;
        }

        if (scannerStreamRef.current) {
            scannerStreamRef.current.getTracks().forEach((track) => track.stop());
            scannerStreamRef.current = null;
        }

        if (scannerVideoRef.current) {
            scannerVideoRef.current.pause();
            scannerVideoRef.current.srcObject = null;
        }

        setScannerOpen(false);
        setScannerError("");
        setScannerFilaId(null);
    }, []);

    const openScanner = useCallback((filaId) => {
        setScannerFilaId(filaId);
        setScannerSupported(true);
        setScannerError("");
        setScannerOpen(true);
    }, []);

    const applyScannedValue = useCallback((rawValue) => {
        const nextValue = String(rawValue || "").trim().toUpperCase();
        if (!nextValue || scannerFilaId == null) return;

        actualizarFilaAleatoria(scannerFilaId, "serialPack", nextValue);
        closeScanner();
    }, [scannerFilaId, closeScanner]);

    useEffect(() => {
        if (!scannerOpen) {
            return undefined;
        }

        let cancelled = false;
        const videoElement = scannerVideoRef.current;

        const startScanner = async () => {
            try {
                if (typeof window === "undefined" || typeof navigator === "undefined") {
                    throw new Error("La camara no esta disponible en este entorno.");
                }

                if (typeof window.BarcodeDetector === "undefined") {
                    setScannerSupported(false);
                    setScannerError("Este navegador no soporta lectura por camara. Usa Chrome o Brave actualizados.");
                    return;
                }

                const preferredFormats = [
                    "qr_code",
                    "code_128",
                    "code_39",
                    "ean_13",
                    "ean_8",
                    "upc_a",
                    "upc_e",
                    "codabar",
                    "itf",
                    "data_matrix",
                    "pdf417",
                    "aztec"
                ];

                let formats = preferredFormats;
                if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
                    const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
                    formats = preferredFormats.filter((item) => supportedFormats.includes(item));
                }

                if (formats.length === 0) {
                    setScannerSupported(false);
                    setScannerError("El navegador no reporta formatos compatibles para QR o codigo de barras.");
                    return;
                }

                barcodeDetectorRef.current = new window.BarcodeDetector({ formats });

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                scannerStreamRef.current = stream;

                if (!videoElement) {
                    return;
                }

                videoElement.srcObject = stream;
                videoElement.setAttribute("playsInline", "true");
                await videoElement.play();

                const scanFrame = async () => {
                    if (cancelled) return;

                    if (!videoElement || !barcodeDetectorRef.current || videoElement.readyState < 2) {
                        scannerFrameRef.current = requestAnimationFrame(scanFrame);
                        return;
                    }

                    try {
                        const barcodes = await barcodeDetectorRef.current.detect(videoElement);
                        const rawValue = barcodes?.[0]?.rawValue;
                        if (rawValue) {
                            applyScannedValue(rawValue);
                            return;
                        }
                    } catch (error) {
                        console.error("Error leyendo desde la camara en transferencias:", error);
                    }

                    scannerFrameRef.current = requestAnimationFrame(scanFrame);
                };

                scannerFrameRef.current = requestAnimationFrame(scanFrame);
            } catch (error) {
                console.error("No fue posible iniciar la camara en transferencias:", error);
                setScannerError(
                    error?.name === "NotAllowedError"
                        ? "Debes permitir el acceso a la camara para escanear."
                        : "No fue posible iniciar la camara en este dispositivo."
                );
            }
        };

        startScanner();

        return () => {
            cancelled = true;

            if (scannerFrameRef.current) {
                cancelAnimationFrame(scannerFrameRef.current);
                scannerFrameRef.current = null;
            }

            if (scannerStreamRef.current) {
                scannerStreamRef.current.getTracks().forEach((track) => track.stop());
                scannerStreamRef.current = null;
            }

            if (videoElement) {
                videoElement.pause();
                videoElement.srcObject = null;
            }
        };
    }, [applyScannedValue, scannerOpen]);

    const generarSeleccionAleatoria = async () => {
        setFeedback(null);

        const filasValidas = filasAleatorias.filter((f) => f.producto && Number(f.cantidad) > 0);

        if (filasValidas.length === 0) {
            setFeedback({ type: "warning", message: "Agrega al menos un articulo con producto y cantidad validos." });
            return;
        }

        setGenerandoAleatorio(true);

        const nuevosItems = [...itemsToTransfer];
        const resumenGenerado = [];
        const advertencias = [];

        try {
            for (const fila of filasValidas) {
                const cantidadSolicitada = Number(fila.cantidad);
                const serialPackSolicitado = (fila.serialPack || "").trim();

                const res = await listarSeriales(1, 2000, {
                    cons_producto: fila.producto,
                    cons_almacen: origenSeleccionado,
                    available: [true],
                });

                const disponibles = (res?.data || []).filter(
                    (item) => !nuevosItems.some((existing) => getItemKey(existing) === getItemKey(item))
                );

                const grupos = disponibles.reduce((acc, item) => {
                    const clave = item[agruparPor];
                    if (!clave) return acc;
                    if (!acc[clave]) acc[clave] = [];
                    acc[clave].push(item);
                    return acc;
                }, {});

                let claveElegida;
                let fueElegidoManualmente = false;

                if (serialPackSolicitado) {
                    claveElegida = Object.keys(grupos).find(
                        (clave) => clave.toLowerCase() === serialPackSolicitado.toLowerCase()
                    );

                    if (!claveElegida) {
                        advertencias.push(`${fila.producto}: no se encontraron articulos disponibles con ${PACK_LABELS[agruparPor]} "${serialPackSolicitado}".`);
                        continue;
                    }

                    fueElegidoManualmente = true;
                } else {
                    const clavesDisponibles = Object.keys(grupos);

                    if (clavesDisponibles.length === 0) {
                        advertencias.push(`${fila.producto}: no hay articulos disponibles con ${PACK_LABELS[agruparPor]} asignado en el almacen ${origenSeleccionado}.`);
                        continue;
                    }

                    claveElegida = clavesDisponibles[Math.floor(Math.random() * clavesDisponibles.length)];
                }

                const grupoElegido = [...grupos[claveElegida]].sort(() => Math.random() - 0.5);
                const seleccionados = grupoElegido.slice(0, cantidadSolicitada);

                seleccionados.forEach((item) => nuevosItems.push(item));

                resumenGenerado.push(
                    `${fila.producto}: ${seleccionados.length} de ${cantidadSolicitada} solicitado(s) (${PACK_LABELS[agruparPor]} ${claveElegida}${fueElegidoManualmente ? "" : ", aleatorio"})`
                );

                if (seleccionados.length < cantidadSolicitada) {
                    advertencias.push(`${fila.producto}: el paquete ${claveElegida} solo tenia ${seleccionados.length} disponible(s).`);
                }
            }

            setItemsToTransfer(nuevosItems);

            const mensajePartes = [];
            if (resumenGenerado.length) mensajePartes.push(`Seleccion generada: ${resumenGenerado.join(" · ")}`);
            if (advertencias.length) mensajePartes.push(advertencias.join(" · "));

            setFeedback({
                type: advertencias.length && resumenGenerado.length === 0 ? "danger" : advertencias.length ? "warning" : "success",
                message: mensajePartes.join(" — ") || "No se genero ninguna seleccion.",
            });
        } catch (error) {
            console.error("Error al generar seleccion aleatoria:", error);
            setFeedback({ type: "danger", message: "No fue posible generar la seleccion aleatoria." });
        } finally {
            setGenerandoAleatorio(false);
        }
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

    const obtenerCorreosAlmacenes = (origenCod, destinoCod) => {
        const almacenOrigen = todosAlmacenes.find((item) => item.consecutivo === origenCod);
        const almacenDestino = todosAlmacenes.find((item) => item.consecutivo === destinoCod);

        const destinatarios = [
            ...parseEmails(almacenOrigen?.email),
            ...parseEmails(almacenDestino?.email),
        ];

        return {
            destinatario: [...new Set(destinatarios)],
            cc: parseEmails(correosCcTransferencias),
        };
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
            const trasladoResponse = await crearTrasladoPendiente({
                origen,
                destino,
                fecha,
                semana: semanaInput,
                realizado_por: user.username,
                observaciones: `Precintos transferidos al almacen ${destino}`,
                items: transferencias,
            });

            const base64String = await generateTransferExcelBase64(transferencias, destino);
            const { destinatario: destinatariosAlmacenes, cc: ccTransferencia } = obtenerCorreosAlmacenes(origen, destino);

            let avisoCorreo = null;

            if (destinatariosAlmacenes.length === 0) {
                avisoCorreo = "no se envio correo: el almacen origen y/o destino no tienen un correo registrado.";
            } else {
                try {
                    const fechaEnvio = new Date().toLocaleDateString("es-ES");
                    const datosCorreo = {
                        destinatario: destinatariosAlmacenes.join(","),
                        ...(ccTransferencia.length > 0 && { cc: ccTransferencia.join(",") }),
                        asunto: `Transferencia pendiente por aceptar - ${destino} (${fechaEnvio})`,
                        cuerpo: `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; }
                .container { max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9; }
                .header { background-color: #f0ad4eff; color: white; padding: 10px; border-radius: 5px 5px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
                .content { padding: 0 10px; }
                .highlight { font-weight: bold; color: #f0ad4eff; }
                .details-box { background-color: #ffffff; border: 1px solid #e0e0e0; border-left: 5px solid #f0ad4eff; padding: 15px; margin-top: 15px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Transferencia de Insumos Pendiente</h2>
                </div>
                <div class="content">
                    <p>Estimado/a destinatario/a,</p>
                    <p>Se registro una transferencia de insumos desde el almacen <span class="highlight">${origen}</span> hacia el almacen <span class="highlight">${destino}</span>, en espera de aceptacion por parte del almacen destino.</p>
                    <div class="details-box">
                        <p><strong>Detalles de la Transferencia:</strong></p>
                        <ul>
                            <li><strong>Origen:</strong> <span class="highlight">${origen}</span></li>
                            <li><strong>Destino:</strong> <span class="highlight">${destino}</span></li>
                            <li><strong>Fecha de Envio:</strong> <span class="highlight">${fechaEnvio}</span></li>
                            <li><strong>Semana:</strong> <span class="highlight">${semanaInput}</span></li>
                            <li><strong>Articulos:</strong> <span class="highlight">${transferencias.length}</span></li>
                        </ul>
                    </div>
                    <p>El listado detallado de los insumos se adjunta a este correo en formato Excel (.xlsx).</p>
                    <p>El almacen destino debe aceptar la transferencia desde la pestaña "Pendientes" en Transferencias.</p>
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
                    avisoCorreo = "hubo un error al enviar el correo con el Excel.";
                }
            }

            setPagination(1);
            setItemsToTransfer([]);
            setFeedback({
                type: avisoCorreo ? "warning" : "success",
                message: avisoCorreo
                    ? `${trasladoResponse?.message || "Transferencia registrada como pendiente."} (${avisoCorreo})`
                    : (trasladoResponse?.message || "Transferencia registrada como pendiente."),
            });
            setBool(true);
            setLoading(false);
            cargarConteoPendientes();
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
                mostrarSerial={mostrarSerial}
            />

            <form ref={formRef} onSubmit={handleSubmit}>
                <h2 className="mb-2">Transferencias</h2>
                <div className="line"></div>

                {feedback && (
                    <div className={`alert alert-${feedback.type} d-flex justify-content-between align-items-center gap-2 fade show py-2 mb-3 small`} role="alert">
                        <span>{feedback.message}</span>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setFeedback(null)}
                            aria-label="Cerrar"
                            style={{ flexShrink: 0 }}
                        />
                    </div>
                )}

                {vista !== "pendientes" && totalPendientesRecibir > 0 && (
                    <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 mb-3 small" role="alert">
                        <span>
                            Tienes <strong>{totalPendientesRecibir}</strong> transferencia{totalPendientesRecibir !== 1 ? "s" : ""} pendiente{totalPendientesRecibir !== 1 ? "s" : ""} por aceptar de otro almacen.
                        </span>
                        <button type="button" className="btn btn-sm btn-warning" onClick={() => cambiarVista("pendientes")}>
                            Ver pendientes
                        </button>
                    </div>
                )}

                {/* Modo de seleccion */}
                <div className="mb-3 d-flex align-items-center gap-2">
                    <div className="btn-group btn-group-sm d-flex d-sm-inline-flex flex-grow-1 flex-sm-grow-0" role="group">
                        <button type="button" className={`btn flex-fill flex-sm-grow-0 ${vista === "manual" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => cambiarVista("manual")} disabled={bool}>
                            Manual
                        </button>
                        <button type="button" className={`btn flex-fill flex-sm-grow-0 ${vista === "aleatoria" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => cambiarVista("aleatoria")} disabled={bool}>
                            Aleatoria
                        </button>
                        <button type="button" className={`btn flex-fill flex-sm-grow-0 position-relative ${vista === "pendientes" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => cambiarVista("pendientes")} disabled={bool}>
                            Pendientes
                            {totalPendientesRecibir > 0 && (
                                <span className="badge rounded-pill bg-danger ms-1">{totalPendientesRecibir}</span>
                            )}
                        </button>
                    </div>
                    {user?.id_rol === "Super administrador" && (
                        <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0"
                            style={{
                                width: 32, height: 32,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                color: "#adb5bd",
                            }}
                            onClick={abrirConfigCc}
                            title="Configurar correos CC de Transferencias"
                        >
                            <FaCog size={17} />
                        </button>
                    )}
                </div>

                {vista === "pendientes" ? (
                    <PendientesView
                        cargando={cargandoPendientes}
                        pendientesRecibir={pendientesRecibir}
                        pendientesEnviados={pendientesEnviados}
                        procesandoPendienteId={procesandoPendienteId}
                        onAceptar={handleAceptarPendiente}
                        onRechazar={handleRechazarPendiente}
                        onSubirEvidencia={abrirModalEvidenciaTraslado}
                        onVerEvidencia={abrirVerEvidenciaTraslado}
                        onVerArticulos={abrirArticulosTraslado}
                        onRefrescar={cargarPendientes}
                    />
                ) : (
                <>
                {/* Filtros comunes */}
                <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <label htmlFor="origen" className="form-label mt-1 mb-1">Origen</label>
                        <select className="form-select form-select-sm" id="origen" name="origen" value={origenSeleccionado} onChange={onChanageBuscar} disabled={bool}>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <label htmlFor="destino" className="form-label mt-1 mb-1">Destino</label>
                        <select className="form-select form-select-sm" id="destino" name="destino" value={destinoSeleccionado} onChange={handleDestinoChange} disabled={bool}>
                            {todosAlmacenes.map((item, index) => (
                                <option key={index} value={item.consecutivo} disabled={item.consecutivo === origenSeleccionado}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {!modoAleatorio && (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label htmlFor="producto" className="form-label mt-1 mb-1">Articulo</label>
                            <select className="form-select form-select-sm" id="producto" name="producto" disabled={bool} onChange={onChanageBuscar}>
                                <option value="">Todos</option>
                                {productos.map((item, index) => (
                                    <option key={index} value={item.consecutivo}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <label htmlFor="fecha" className="form-label mt-1 mb-1">Fecha</label>
                        <input type="date" className="form-control form-control-sm" id="fecha" name="fecha" defaultValue={fechaActual} disabled={bool} />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <label htmlFor="semana" className="form-label mt-1 mb-1">Semana</label>
                        <select className="form-select form-select-sm" id="semana" name="semana" required disabled={bool} defaultValue="">
                            <option value="" disabled>Seleccione</option>
                            {semanas.map((s) => (
                                <option key={s.consecutivo} value={s.consecutivo}>{s.consecutivo}</option>
                            ))}
                        </select>
                    </div>
                    {!modoAleatorio && mostrarSerial && (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <label htmlFor="serial" className="form-label mt-1 mb-1">Serial Int</label>
                            <input type="text" className="form-control form-control-sm" id="serial" name="serial" onChange={onChanageBuscar} disabled={bool} />
                        </div>
                    )}
                    {!modoAleatorio && (
                        <>
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <label htmlFor="bag_pack" className="form-label mt-1 mb-1">Serial Ext</label>
                                <input type="text" className="form-control form-control-sm" id="bag_pack" name="bag_pack" onChange={onChanageBuscar} disabled={bool} />
                            </div>
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <label htmlFor="s_pack" className="form-label mt-1 mb-1">S Pack</label>
                                <input type="text" className="form-control form-control-sm" id="s_pack" name="s_pack" onChange={onChanageBuscar} disabled={bool} />
                            </div>
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <label htmlFor="m_pack" className="form-label mt-1 mb-1">M Pack</label>
                                <input type="text" className="form-control form-control-sm" id="m_pack" name="m_pack" onChange={onChanageBuscar} disabled={bool} />
                            </div>
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <label htmlFor="l_pack" className="form-label mt-1 mb-1">L Pack</label>
                                <input type="text" className="form-control form-control-sm" id="l_pack" name="l_pack" onChange={onChanageBuscar} disabled={bool} />
                            </div>
                        </>
                    )}
                </div>

                {/* Modo aleatorio: seleccion de articulos y cantidades */}
                {modoAleatorio && (
                    <div className="mb-3 p-2 border rounded bg-light">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <label htmlFor="agrupar-por" className="form-label mt-1 mb-1">Agrupar por</label>
                                <select id="agrupar-por" className="form-select form-select-sm" value={agruparPor} onChange={(e) => setAgruparPor(e.target.value)} disabled={bool}>
                                    <option value="s_pack">S Pack</option>
                                    <option value="m_pack">M Pack</option>
                                    <option value="l_pack">L Pack</option>
                                </select>
                            </div>
                        </div>

                        {filasAleatorias.map((fila) => (
                            <div key={fila.id} className="row g-2 mb-2 align-items-center">
                                <div className="col-12 col-md-4">
                                    <select
                                        className="form-select form-select-sm"
                                        value={fila.producto}
                                        onChange={(e) => actualizarFilaAleatoria(fila.id, "producto", e.target.value)}
                                        disabled={bool}
                                    >
                                        <option value="">Seleccione producto</option>
                                        {productos.map((item, index) => (
                                            <option key={index} value={item.consecutivo}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-sm-4 col-md-2">
                                    <input
                                        type="number"
                                        min={1}
                                        className="form-control form-control-sm"
                                        placeholder="Cantidad"
                                        value={fila.cantidad}
                                        onChange={(e) => actualizarFilaAleatoria(fila.id, "cantidad", e.target.value)}
                                        disabled={bool}
                                    />
                                </div>
                                <div className="col-12 col-sm-8 col-md-4">
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder={`Serial ${PACK_LABELS[agruparPor]} (opcional)`}
                                            title="Si lo dejas vacio, el paquete se elige al azar"
                                            value={fila.serialPack}
                                            onChange={(e) => actualizarFilaAleatoria(fila.id, "serialPack", e.target.value)}
                                            disabled={bool}
                                        />
                                        <ScanActionButton label={PACK_LABELS[agruparPor]} onClick={() => openScanner(fila.id)} disabled={bool} />
                                    </div>
                                </div>
                                <div className="col-12 col-sm-12 col-md-2 d-flex justify-content-center justify-content-md-start">
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm text-decoration-none p-0"
                                        style={{ width: 26, height: 26, lineHeight: "24px", color: "#dc3545" }}
                                        title="Quitar articulo"
                                        onClick={() => eliminarFilaAleatoria(fila.id)}
                                        disabled={bool}
                                    >
                                        <FaTrashAlt size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="d-flex gap-2 flex-wrap mt-2">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={agregarFilaAleatoria} disabled={bool}>
                                + Agregar articulo
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={generarSeleccionAleatoria}
                                disabled={bool || generandoAleatorio || filasAleatorias.length === 0}
                            >
                                {generandoAleatorio ? "Generando..." : "Generar seleccion aleatoria"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Resumen lista */}
                {itemsToTransfer.length > 0 && (
                    <div className="mb-3">
                        <h6 className="mb-1">
                            Resumen de transferencia &nbsp;
                            <span className="badge bg-primary">{itemsToTransfer.length}</span>
                        </h6>
                        {/* Mobile: tarjetas */}
                        <div className="d-md-none">
                            {Object.entries(resumenTransferencia).map(([consProducto, detalle]) => (
                                <div key={consProducto} className="border rounded p-2 mb-2 bg-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong className="text-custom-small">{consProducto}</strong>
                                        <span className="badge bg-primary">{detalle.cantidad}</span>
                                    </div>
                                    <div className="text-custom-small text-muted mt-1">
                                        {detalle.seriales.slice(0, 3).join(", ")}{detalle.seriales.length > 3 ? "..." : ""}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: tabla */}
                        <div className="d-none d-md-block table-responsive">
                            <table className="table table-sm table-bordered table-striped align-middle text-center mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-custom-small">Articulo</th>
                                        <th className="text-custom-small">Cantidad</th>
                                        <th className="text-custom-small">Referencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(resumenTransferencia).map(([consProducto, detalle]) => (
                                        <tr key={consProducto}>
                                            <td className="text-custom-small">{consProducto}</td>
                                            <td className="text-custom-small">{detalle.cantidad}</td>
                                            <td className="text-custom-small">{detalle.seriales.slice(0, 3).join(", ")}{detalle.seriales.length > 3 ? "..." : ""}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Barra de control */}
                <div className="mb-2 mt-3">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                        {!modoAleatorio && (
                            <>
                                <label htmlFor="limite-transferencias" className="mb-0 small">Limite:</label>
                                <input
                                    id="limite-transferencias"
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: "65px" }}
                                    min={1}
                                    ref={limitRef}
                                    value={draftLimit}
                                    onChange={handleDraftLimitChange}
                                    onBlur={handleDraftLimitCommit}
                                    onKeyDown={(e) => e.key === "Enter" && handleDraftLimitCommit()}
                                />
                            </>
                        )}
                        <span className="text-custom-small text-muted">
                            {!modoAleatorio && <>{total} resultados &nbsp;·&nbsp; Sel: {seleccionadosActuales} &nbsp;·&nbsp; </>}
                            Lista: {itemsToTransfer.length}
                        </span>
                    </div>
                    <div className="d-grid gap-2 d-sm-flex flex-sm-wrap justify-content-sm-end">
                        {!modoAleatorio && (
                            <button type="button" onClick={limpiarFiltros} className="btn btn-sm btn-outline-secondary" disabled={bool}>Limpiar</button>
                        )}
                        <button type="button" onClick={() => setShowModal(true)} className="btn btn-sm btn-warning" disabled={bool}>Ver lista ({itemsToTransfer.length})</button>
                        {!modoAleatorio && (
                            <button type="button" onClick={agregarItem} className="btn btn-sm btn-primary" disabled={bool || loading || checKs.every((c) => !c)}>Agregar</button>
                        )}
                        {!bool ? (
                            <button type="submit" className="btn btn-sm btn-success" disabled={loading}>
                                {loading ? "Procesando..." : "Transferir"}
                            </button>
                        ) : (
                            <button type="button" onClick={nuevaTranferencia} className="btn btn-sm btn-primary">Nueva transferencia</button>
                        )}
                    </div>
                </div>

                {/* Tabla */}
                {!modoAleatorio && (
                    <>
                        {tabla.length === 0 ? (
                            <div className="text-center text-muted py-4 text-custom-small border rounded bg-light">
                                No hay seriales disponibles con esos filtros.
                            </div>
                        ) : (
                            <>
                                {/* Mobile: tarjetas */}
                                <div className="d-md-none">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <input className="form-check-input" type="checkbox" onChange={handleCheckAll} checked={checkAll} id="check-all-mobile" />
                                        <label htmlFor="check-all-mobile" className="mb-0 text-custom-small">Seleccionar todos</label>
                                    </div>
                                    {tabla.map((item, index) => (
                                        <div key={item.id || `${item.cons_producto}-${index}`} className="border rounded p-2 mb-2 bg-white">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={checKs[index] || false}
                                                        onChange={() => hadleChecks(index)}
                                                        id={`item-mobile-${index}`}
                                                    />
                                                    <label className="form-check-label fw-bold text-custom-small" htmlFor={`item-mobile-${index}`}>
                                                        {item?.cons_producto}
                                                    </label>
                                                </div>
                                                <span className={`badge ${item?.available === true ? "text-bg-success" : "text-bg-secondary"}`}>
                                                    {item?.available === true ? "Disponible" : "Usado"}
                                                </span>
                                            </div>
                                            <div className="text-custom-small text-muted mt-1">
                                                <div>Almacen: {item?.cons_almacen || "-"}</div>
                                                {mostrarSerial && <div>Serial Int: {item?.serial || "-"}</div>}
                                                <div>Serial Ext: {item?.bag_pack || "-"}</div>
                                                <div>S Pack: {item?.s_pack || "-"} &middot; M Pack: {item?.m_pack || "-"} &middot; L Pack: {item?.l_pack || "-"}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop: tabla */}
                                <div className="d-none d-md-block table-responsive">
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
                                                <th className="text-custom-small text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="align-middle">
                                            {tabla.map((item, index) => (
                                                <tr key={item.id || `${item.cons_producto}-${index}`}>
                                                    <td className="text-center">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={checKs[index] || false}
                                                            onChange={() => hadleChecks(index)}
                                                        />
                                                    </td>
                                                    <td className="text-custom-small text-center">{item?.cons_almacen}</td>
                                                    <td className="text-custom-small text-center">{item?.cons_producto}</td>
                                                    {mostrarSerial && <td className="text-custom-small text-center">{item?.serial}</td>}
                                                    <td className="text-custom-small text-center">{item?.bag_pack}</td>
                                                    <td className="text-custom-small text-center">{item?.s_pack}</td>
                                                    <td className="text-custom-small text-center">{item?.m_pack}</td>
                                                    <td className="text-custom-small text-center">{item?.l_pack}</td>
                                                    <td className="text-custom-small text-center">
                                                        <span className={`badge ${item?.available === true ? "text-bg-success" : "text-bg-secondary"}`}>
                                                            {item?.available === true ? "Disponible" : "Usado"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                    </>
                )}
                </>
                )}
            </form>

            {showEvidenciaTrasladoModal && (
                <ProgramadorEvidenceModal
                    show={showEvidenciaTrasladoModal}
                    selectedProgramacion={selectedTrasladoEvidencia}
                    evidenceFiles={evidenciaTrasladoFiles}
                    evidenceResults={evidenciaTrasladoResultados}
                    uploadingEvidencia={uploadingEvidenciaTraslado}
                    onClose={cerrarModalEvidenciaTraslado}
                    onFilesChange={handleEvidenciaTrasladoFilesChange}
                    onCameraFilesChange={handleEvidenciaTrasladoCameraChange}
                    onRemoveFile={(idx) => { const newFiles = [...evidenciaTrasladoFiles]; newFiles.splice(idx, 1); setEvidenciaTrasladoFiles(newFiles); }}
                    onUpload={subirEvidenciaTraslado}
                    onReset={() => { setEvidenciaTrasladoResultados(null); setEvidenciaTrasladoFiles([]); }}
                />
            )}

            {showVerEvidenciaTraslado && (
                <VerEvidenciasModal
                    show={showVerEvidenciaTraslado}
                    loading={verEvidenciaTrasladoLoading}
                    error={verEvidenciaTrasladoError}
                    fotos={verEvidenciaTrasladoFotos}
                    carpetaUrl={verEvidenciaTrasladoCarpetaUrl}
                    mostrarEnlaceDrive={tieneBoton('evidencias_ver_carpeta_drive')}
                    onClose={cerrarVerEvidenciaTraslado}
                    onSubirMas={irASubirDesdeVerTraslado}
                />
            )}

            <ArticulosTrasladoModal
                show={showArticulosTraslado}
                onClose={cerrarArticulosTraslado}
                loading={articulosTrasladoLoading}
                error={articulosTrasladoError}
                articulos={articulosTrasladoLista}
            />

            {showConfigCc && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header py-2">
                                    <h5 className="modal-title mb-0">Correos CC de Transferencias</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowConfigCc(false)} aria-label="Cerrar"></button>
                                </div>
                                <div className="modal-body">
                                    <label htmlFor="correos-cc-transferencias" className="form-label small">
                                        Correos que se agregan en copia (CC) a todos los correos de Transferencias (creacion y aceptacion).
                                    </label>
                                    <input
                                        id="correos-cc-transferencias"
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="correo1@banarica.com, correo2@banarica.com"
                                        value={correosCcDraft}
                                        onChange={(e) => setCorreosCcDraft(e.target.value)}
                                    />
                                    <small className="text-muted">Separa varios correos con comas.</small>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowConfigCc(false)} disabled={guardandoConfigCc}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={guardarConfigCc} disabled={guardandoConfigCc}>
                                        {guardandoConfigCc ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {scannerOpen && (
                <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Escanear {PACK_LABELS[agruparPor]}</h5>
                                <button type="button" className="btn-close" onClick={closeScanner} aria-label="Cerrar" />
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small mb-3">
                                    Acerca el codigo de barras o QR del paquete a la camara. Cuando se detecte, el valor se cargara automaticamente.
                                </p>
                                <div className="ratio ratio-4x3 bg-dark rounded overflow-hidden">
                                    <video
                                        ref={scannerVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                {scannerError && (
                                    <div className={`alert ${scannerSupported ? "alert-warning" : "alert-danger"} mt-3 mb-0`}>
                                        {scannerError}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeScanner}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
