import React, { useEffect, useState } from "react";

export default function CorregirInspeccionContenedorModal({
    open,
    loading = false,
    inspeccionSeleccionada,
    onClose,
    onConfirm
}) {
    const [contenedorCorrecto, setContenedorCorrecto] = useState("");
    const [observaciones, setObservaciones] = useState("");

    useEffect(() => {
        if (!open) {
            setContenedorCorrecto("");
            setObservaciones("");
        }
    }, [open]);

    if (!open || !inspeccionSeleccionada) {
        return null;
    }

    const confirmar = () => {
        onConfirm?.({
            contenedorCorrecto: contenedorCorrecto.trim().toUpperCase(),
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
                    <span className="fw-semibold">Corregir contenedor inspeccionado</span>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>

                <div className="card-body">
                    <div className="mb-3">
                        <div className="small text-muted">Contenedor actual</div>
                        <div className="fw-semibold">
                            {inspeccionSeleccionada?.contenedor?.contenedor || "No registrado"}
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="small text-muted">Fecha de inspeccion</div>
                        <div className="fw-semibold">
                            {inspeccionSeleccionada?.Inspeccion?.fecha_inspeccion || "No registrada"}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="contenedor-correcto" className="form-label fw-semibold">
                            Contenedor correcto
                        </label>
                        <input
                            id="contenedor-correcto"
                            className="form-control"
                            type="text"
                            value={contenedorCorrecto}
                            onChange={(event) => setContenedorCorrecto(event.target.value.toUpperCase())}
                            placeholder="Ingresa el contenedor correcto"
                        />
                        <div className="form-text">
                            Debe existir previamente en el sistema.
                        </div>
                    </div>

                    <div className="mb-0">
                        <label htmlFor="observaciones-correccion-contenedor" className="form-label fw-semibold">
                            Observaciones
                        </label>
                        <textarea
                            id="observaciones-correccion-contenedor"
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
