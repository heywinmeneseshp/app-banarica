/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

import excel from "@hooks/useExcel";
import {
    guardarCoberturaConfig,
    guardarCoberturaProducto,
    listarCobertura,
} from "@services/api/seguridad";
import { useAuth } from "@hooks/useAuth";
import PedidoProveedorModal from "@components/seguridad/PedidoProveedorModal";

const num = (v) => Number(v ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });

// Seguridad > Disponibles > Cobertura y reposicion: promedio mensual de consumo, alerta cuando el
// stock queda por debajo del porcentaje configurado (150 % por defecto) y pedido sugerido por
// proveedor redondeado por bulto. Solo para Super administrador o quien tenga el permiso.
export default function ConsultaCobertura({ data }) {
    const { almacenByUser } = useAuth();
    const [filas, setFilas] = useState([]);
    const [config, setConfig] = useState({ porcentaje: 150, meses: 3 });
    const [periodo, setPeriodo] = useState({ desde: "", hasta: "" });
    const [porcentajeGeneral, setPorcentajeGeneral] = useState("150");
    const [meses, setMeses] = useState("3");
    const [proveedor, setProveedor] = useState("");
    const [soloAlertas, setSoloAlertas] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [verPedido, setVerPedido] = useState(false);

    const almacenes = useMemo(() => {
        const sel = data?.cons_almacen;
        const lista = Array.isArray(sel) ? sel : (sel ? [sel] : []);
        return lista.length ? lista : almacenByUser.map((a) => a.consecutivo);
    }, [data?.cons_almacen, almacenByUser]);

    const cargar = useCallback(async () => {
        if (!almacenes.length) return;
        setCargando(true);
        setError("");
        try {
            const r = await listarCobertura({ almacenes: almacenes.join(",") });
            setFilas(r.productos || []);
            setConfig(r.config);
            setPeriodo({ desde: r.desde, hasta: r.hasta });
            setPorcentajeGeneral(String(r.config.porcentaje));
            setMeses(String(r.config.meses));
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudo cargar la cobertura");
            setFilas([]);
        }
        setCargando(false);
    }, [almacenes]);

    useEffect(() => { cargar(); }, [cargar]);

    const proveedores = useMemo(() => {
        const m = new Map();
        filas.forEach((f) => { if (f.cons_proveedor) m.set(f.cons_proveedor, f.proveedor || f.cons_proveedor); });
        return [...m.entries()].map(([cons, nombre]) => ({ cons, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [filas]);

    const visibles = filas.filter((f) => (!data?.cons_producto || f.consecutivo === data.cons_producto)
        && (!proveedor || f.cons_proveedor === proveedor)
        && (!soloAlertas || f.alerta));
    const enAlerta = filas.filter((f) => f.alerta);

    const guardarGeneral = async () => {
        try {
            await guardarCoberturaConfig({ porcentaje: Number(porcentajeGeneral), meses: Number(meses) });
            setMensaje("Configuración guardada");
            await cargar();
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudo guardar la configuración");
        }
    };

    const guardarPorProducto = async (fila, valor) => {
        const limpio = String(valor).trim();
        const actual = fila.porcentaje_propio === null ? "" : String(fila.porcentaje_propio);
        if (limpio === actual) return;
        try {
            await guardarCoberturaProducto(fila.consecutivo, limpio === "" ? null : Number(limpio));
            await cargar();
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudo guardar el porcentaje");
        }
    };

    const descargar = () => {
        excel(visibles.map((f) => ({
            "Cod articulo": f.consecutivo,
            "Articulo": f.name,
            "Proveedor": f.proveedor || "",
            "Stock": f.stock,
            [`Consumo ${config.meses} meses`]: f.consumo_total,
            "Promedio mensual": f.promedio_mensual,
            "Porcentaje": f.porcentaje,
            "Objetivo": f.objetivo,
            "Faltante": f.faltante,
            "Unidades por bulto": f.bulto,
            "Sugerido a pedir": f.sugerido,
            "Estado": f.alerta ? "Por debajo" : "Ok",
        })), "Cobertura", "Cobertura de stock");
    };

    return (
        <div>
            {error && <div className="alert alert-danger py-1 px-2 small">{error}</div>}
            {mensaje && (
                <div className="alert alert-success py-1 px-2 small d-flex justify-content-between align-items-center">
                    <span>{mensaje}</span>
                    <button type="button" className="btn-close btn-sm" aria-label="Cerrar" onClick={() => setMensaje("")} />
                </div>
            )}

            {enAlerta.length > 0 && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2">
                    <FaExclamationTriangle />
                    <span>
                        <strong>{enAlerta.length}</strong> producto(s) con stock por debajo del objetivo
                        (porcentaje del promedio mensual de consumo).
                    </span>
                </div>
            )}

            <div className="row g-2 align-items-end mb-3">
                <div className="col-6 col-md-2">
                    <label className="form-label small mb-0 text-muted">% general</label>
                    <input type="number" min="1" className="form-control form-control-sm" value={porcentajeGeneral}
                        onChange={(e) => setPorcentajeGeneral(e.target.value)} />
                </div>
                <div className="col-6 col-md-2">
                    <label className="form-label small mb-0 text-muted">Meses del promedio</label>
                    <input type="number" min="1" className="form-control form-control-sm" value={meses}
                        onChange={(e) => setMeses(e.target.value)} />
                </div>
                <div className="col-12 col-md-2">
                    <button type="button" className="btn btn-primary btn-sm w-100" onClick={guardarGeneral}
                        disabled={String(config.porcentaje) === porcentajeGeneral && String(config.meses) === meses}>
                        Guardar
                    </button>
                </div>
                <div className="col-12 col-md-3">
                    <label className="form-label small mb-0 text-muted">Proveedor</label>
                    <select className="form-select form-select-sm" value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
                        <option value="">Todos</option>
                        {proveedores.map((p) => <option key={p.cons} value={p.cons}>{p.nombre}</option>)}
                    </select>
                </div>
                <div className="col-12 col-md-3 d-flex gap-2">
                    <button type="button" className="btn btn-success btn-sm flex-fill" onClick={() => setVerPedido(true)} disabled={!enAlerta.length}>
                        Pedido por proveedor
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm flex-fill" onClick={descargar} disabled={!visibles.length}>
                        Excel
                    </button>
                </div>
            </div>

            <div className="form-check mb-2">
                <input id="solo-alertas" type="checkbox" className="form-check-input" checked={soloAlertas} onChange={(e) => setSoloAlertas(e.target.checked)} />
                <label htmlFor="solo-alertas" className="form-check-label small">Mostrar solo los que están por debajo</label>
            </div>

            <p className="small text-muted mb-2">
                Consumo = salidas (sin traslados ni rechazados) del {periodo.desde} al {periodo.hasta}, dividido entre {config.meses} mes(es).
                El objetivo es el porcentaje del promedio mensual; el sugerido se redondea hacia arriba por unidades de bulto.
            </p>

            <div className="table-responsive">
                <table className="table table-striped table-bordered table-sm mb-1 text-nowrap">
                    <thead>
                        <tr>
                            {["Artículo", "Proveedor", "Stock", `Consumo ${config.meses} m`, "Promedio mensual", "% (propio)", "Objetivo", "Faltante", "Bulto", "Sugerido", "Estado"].map((h) => (
                                <th key={h} className="text-custom-small text-center">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cargando && <tr><td colSpan={11} className="text-center py-3">Cargando...</td></tr>}
                        {!cargando && visibles.length === 0 && <tr><td colSpan={11} className="text-center text-muted py-3">Sin productos para mostrar</td></tr>}
                        {!cargando && visibles.map((f) => (
                            <tr key={f.consecutivo} className={f.alerta ? "table-warning" : ""}>
                                <td className="text-custom-small">{f.name}</td>
                                <td className="text-custom-small text-center">{f.proveedor || "—"}</td>
                                <td className="text-custom-small text-center fw-bold">{num(f.stock)}</td>
                                <td className="text-custom-small text-center">{num(f.consumo_total)}</td>
                                <td className="text-custom-small text-center fw-bold">{num(f.promedio_mensual)}</td>
                                <td className="text-center" style={{ width: 90 }}>
                                    <input type="number" min="1" className="form-control form-control-sm text-center"
                                        defaultValue={f.porcentaje_propio ?? ""} key={`${f.consecutivo}-${f.porcentaje_propio}`}
                                        placeholder={String(config.porcentaje)}
                                        onBlur={(e) => guardarPorProducto(f, e.target.value)} />
                                </td>
                                <td className="text-custom-small text-center">{num(f.objetivo)}</td>
                                <td className="text-custom-small text-center">{num(f.faltante)}</td>
                                <td className="text-custom-small text-center">{num(f.bulto)}</td>
                                <td className="text-custom-small text-center fw-bold text-primary">{f.sugerido ? num(f.sugerido) : "—"}</td>
                                <td className="text-custom-small text-center">
                                    {!f.pedido_sugerido
                                        ? <span className="badge bg-secondary" title="Este producto está excluido del pedido sugerido y de las alertas">Sin pedido</span>
                                        : f.alerta
                                            ? <span className="badge bg-warning text-dark"><FaExclamationTriangle className="me-1" />Por debajo</span>
                                            : <span className="badge bg-success">Ok</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PedidoProveedorModal show={verPedido} onClose={() => setVerPedido(false)} filas={enAlerta} almacenes={almacenes} observacionGeneral={config.observacion_pedido || ""} onObservacionGuardada={cargar} />
        </div>
    );
}
