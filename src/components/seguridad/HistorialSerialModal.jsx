import React, { useEffect, useState } from "react";
import { Button, Modal, Table } from "react-bootstrap";

import excel from "@hooks/useExcel";
import { listarHistorialSerial } from "@services/api/seguridad";

const NOMBRE_CAMPO = {
    cons_producto: "Artículo",
    cons_almacen: "Almacén",
    bag_pack: "Serial bag pack",
    s_pack: "Serial S pack",
    m_pack: "Serial M pack",
    l_pack: "Serial L pack",
};

const fecha = (v) => (v ? new Date(v).toLocaleString("es-CO") : "");

// Historial de sobrescrituras de un serial (Recepcion): que campo cambio, valor anterior y nuevo,
// motivo, observaciones, quien lo hizo y el movimiento de recepcion.
export default function HistorialSerialModal({ serial, onClose }) {
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!serial) return;
        setCargando(true);
        setError("");
        listarHistorialSerial({ serial })
            .then(setFilas)
            .catch((e) => { setFilas([]); setError(e?.response?.data?.message || "No se pudo cargar el historial"); })
            .finally(() => setCargando(false));
    }, [serial]);

    const descargar = () => excel(filas.map((h) => ({
        Fecha: fecha(h.createdAt),
        Serial: h.serial,
        Campo: NOMBRE_CAMPO[h.campo] || h.campo,
        "Valor anterior": h.valor_anterior ?? "",
        "Valor nuevo": h.valor_nuevo ?? "",
        "Estaba usado": h.usado ? "Sí" : "No",
        Motivo: h.motivo || "",
        Observaciones: h.observaciones || "",
        Usuario: h.usuario || "",
        Movimiento: h.cons_movimiento || "",
    })), "Historial", `Historial serial ${serial}`);

    return (
        <Modal show={Boolean(serial)} onHide={onClose} size="lg" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Historial del serial {serial}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger py-1 small">{error}</div>}
                <Table size="sm" bordered className="align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            {["Fecha", "Campo", "Anterior", "Nuevo", "Motivo / observaciones", "Usuario", "Mov."].map((h) => (
                                <th key={h} className="text-custom-small text-center">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cargando && <tr><td colSpan={7} className="text-center py-3">Cargando...</td></tr>}
                        {!cargando && filas.length === 0 && !error && (
                            <tr><td colSpan={7} className="text-center text-muted py-3">Este serial no tiene sobrescrituras registradas.</td></tr>
                        )}
                        {filas.map((h) => (
                            <tr key={h.id}>
                                <td className="text-custom-small text-center">{fecha(h.createdAt)}</td>
                                <td className="text-custom-small text-center">{NOMBRE_CAMPO[h.campo] || h.campo}</td>
                                <td className="text-custom-small text-center text-muted">{h.valor_anterior ?? "(vacío)"}</td>
                                <td className="text-custom-small text-center fw-bold">{h.valor_nuevo ?? "(vacío)"}</td>
                                <td className="text-custom-small">
                                    <div>{h.motivo}</div>
                                    <div className="text-muted">{h.observaciones}</div>
                                    {h.usado ? <span className="badge bg-danger fw-normal">Estaba usado</span> : null}
                                </td>
                                <td className="text-custom-small text-center">{h.usuario}</td>
                                <td className="text-custom-small text-center">{h.cons_movimiento}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-success" size="sm" disabled={!filas.length} onClick={descargar}>Descargar Excel</Button>
                <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
}
