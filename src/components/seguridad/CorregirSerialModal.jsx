import React, { useEffect, useState } from "react";
import { FaExchangeAlt, FaUndoAlt } from "react-icons/fa";

export default function CorregirSerialModal({
    serialSeleccionado,
    open,
    loading = false,
    onClose,
    onConfirm
}) {
    const [modoCorreccion, setModoCorreccion] = useState("revertir");
    const [serialCorrecto, setSerialCorrecto] = useState("");
    const [observaciones, setObservaciones] = useState("");

    useEffect(() => {
        if (!open) {
            setModoCorreccion("revertir");
            setSerialCorrecto("");
            setObservaciones("");
        }
    }, [open]);

    if (!open || !serialSeleccionado) {
        return null;
    }

    const confirmar = () => {
        onConfirm?.({
            modoCorreccion,
            serialCorrecto: serialCorrecto.trim().toUpperCase(),
            observaciones: observaciones.trim()
        });
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(15, 23, 42, 0.45)", zIndex: 1050 }}
        >
            <div className="card border-0 shadow" style={{ width: "min(640px, 92vw)" }}>
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Corregir serial</span>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>

                <div className="card-body">
                    <div className="mb-3">
                        <div className="small text-muted">Serial errado</div>
                        <div className="fw-semibold">{serialSeleccionado.serial}</div>
                    </div>

                    <div className="mb-3">
                        <div className="small text-muted">Contenedor actual</div>
                        <div className="fw-semibold">
                            {serialSeleccionado?.contenedor?.contenedor || "No registrado"}
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="form-label fw-semibold">Accion</div>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className={`btn btn-sm ${modoCorreccion === "revertir" ? "btn-warning" : "btn-outline-warning"}`}
                                onClick={() => setModoCorreccion("revertir")}
                            >
                                <FaUndoAlt className="me-2" />
                                Solo revertir
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${modoCorreccion === "reemplazar" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setModoCorreccion("reemplazar")}
                            >
                                <FaExchangeAlt className="me-2" />
                                Revertir y reemplazar
                            </button>
                        </div>
                    </div>

                    {modoCorreccion === "reemplazar" && (
                        <div className="mb-3">
                            <label htmlFor="serial-correcto" className="form-label fw-semibold">
                                Serial correcto
                            </label>
                            <input
                                id="serial-correcto"
                                className="form-control"
                                type="text"
                                value={serialCorrecto}
                                onChange={(event) => setSerialCorrecto(event.target.value.toUpperCase())}
                                placeholder="Ingresa el serial disponible correcto"
                            />
                            <div className="form-text">
                                El serial correcto debe estar disponible y pertenecer al mismo articulo.
                            </div>
                        </div>
                    )}

                    <div className="mb-0">
                        <label htmlFor="observaciones-correccion" className="form-label fw-semibold">
                            Observaciones
                        </label>
                        <textarea
                            id="observaciones-correccion"
                            className="form-control"
                            rows={3}
                            value={observaciones}
                            onChange={(event) => setObservaciones(event.target.value)}
                            placeholder="Motivo de la correccion"
                        />
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={confirmar}
                        disabled={loading}
                    >
                        {loading ? "Corrigiendo..." : "Confirmar correccion"}
                    </button>
                </div>
            </div>
        </div>
    );
}
