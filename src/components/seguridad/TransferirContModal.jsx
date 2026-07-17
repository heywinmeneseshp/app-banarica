import React, { useEffect, useRef, useState } from "react";
import { paginarListado } from "@services/api/listado";
import { transferirContenedor } from "@services/api/seguridad";

export default function TransferirContModal({ seriales, onClose, onDone }) {
    const [busqueda, setBusqueda] = useState("");
    const [opciones, setOpciones] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!busqueda.trim()) {
            setOpciones([]);
            setSeleccionado(null);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setBuscando(true);
            try {
                const res = await paginarListado(1, 100, { contenedor: busqueda.trim(), habilitado: true });
                const vistos = new Set();
                const unicos = (res?.data || []).reduce((acc, item) => {
                    const id = item?.Contenedor?.id;
                    if (!id || vistos.has(id)) return acc;
                    vistos.add(id);
                    acc.push({
                        id,
                        contenedor: item?.Contenedor?.contenedor,
                        semana: item?.Embarque?.semana?.consecutivo || "—"
                    });
                    return acc;
                }, []);
                setOpciones(unicos);
            } catch {
                setOpciones([]);
            } finally {
                setBuscando(false);
            }
        }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [busqueda]);

    const handleConfirm = async () => {
        if (!seleccionado) return;
        setGuardando(true);
        try {
            const serialCodes = seriales.map(s => s.serial);
            const res = await transferirContenedor(serialCodes, seleccionado.id);
            alert(res.message || "Transferencia completada");
            onDone();
        } catch (e) {
            alert(e?.response?.data?.message || "Error al transferir los seriales");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
                <div className="modal-content">
                    <div className="modal-header py-2">
                        <h6 className="modal-title fw-bold mb-0">
                            Transferir {seriales.length} serial{seriales.length !== 1 ? "es" : ""} a otro contenedor
                        </h6>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body py-2">
                        <div className="mb-2" style={{ maxHeight: 120, overflowY: "auto" }}>
                            {seriales.map((s, i) => (
                                <span key={i} className="badge bg-secondary me-1 mb-1 text-custom-small">
                                    {s.serial} · {s.producto?.name || s.cons_producto}
                                </span>
                            ))}
                        </div>

                        <label className="form-label fw-semibold text-custom-small mb-1">
                            Buscar contenedor destino
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-sm mb-1"
                            placeholder="Ej: MNBU3967277"
                            value={busqueda}
                            onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); }}
                            autoFocus
                        />

                        {buscando && (
                            <p className="text-custom-small text-muted mb-1">Buscando...</p>
                        )}

                        {!buscando && opciones.length > 0 && (
                            <div className="border rounded" style={{ maxHeight: 180, overflowY: "auto" }}>
                                {opciones.map(op => (
                                    <button
                                        key={op.id}
                                        type="button"
                                        className={`d-block w-100 text-start px-2 py-1 border-0 text-custom-small ${seleccionado?.id === op.id ? "bg-primary text-white" : "bg-white"}`}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setSeleccionado(op)}
                                    >
                                        <strong>{op.contenedor}</strong>
                                        <span className="ms-2 text-muted" style={{ color: seleccionado?.id === op.id ? "#ddd" : undefined }}>
                                            Semana {op.semana}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!buscando && busqueda.trim() && opciones.length === 0 && (
                            <p className="text-custom-small text-danger mb-0">No se encontró ningún contenedor.</p>
                        )}

                        {seleccionado && (
                            <div className="alert alert-success py-1 mt-2 text-custom-small mb-0">
                                Destino seleccionado: <strong>{seleccionado.contenedor}</strong> — Semana {seleccionado.semana}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer py-2">
                        <button type="button" className="btn btn-sm btn-secondary" onClick={onClose} disabled={guardando}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleConfirm}
                            disabled={!seleccionado || guardando}
                        >
                            {guardando ? "Transfiriendo..." : `Confirmar transferencia`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
