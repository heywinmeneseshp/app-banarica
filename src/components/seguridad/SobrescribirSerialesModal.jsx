/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Table } from "react-bootstrap";

import excel from "@hooks/useExcel";

const MAX_FILAS = 300;
const NOMBRE_CAMPO = {
    cons_producto: "Artículo",
    cons_almacen: "Almacén",
    bag_pack: "Serial bag pack",
    s_pack: "Serial S pack",
    m_pack: "Serial M pack",
    l_pack: "Serial L pack",
};

// Alerta previa a sobrescribir seriales que ya existen (Seguridad > Recepcion). Lista cada serial y
// que campos se reemplazan (valor actual -> valor nuevo), marca los ya usados en un contenedor, pide
// el motivo y las observaciones (obligatorios) y deja elegir como se suma el stock.
// Solo el Super administrador o quien tenga el permiso puede confirmar.
export default function SobrescribirSerialesModal({ show, verificacion, puedeSobrescribir, cargando, onCancelar, onConfirmar }) {
    const [motivo, setMotivo] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [stockModo, setStockModo] = useState("nuevos");

    useEffect(() => {
        if (show) { setMotivo(""); setObservaciones(""); setStockModo("nuevos"); }
    }, [show]);

    if (!verificacion) return null;
    const { existentes = [], nuevos = 0, total = 0, conCambios = 0, usados = 0 } = verificacion;
    const valido = motivo.trim().length >= 3 && observaciones.trim().length >= 3;

    const descargar = () => {
        excel(existentes.flatMap((e) => (e.cambios.length ? e.cambios : [{ campo: "", anterior: "", nuevo: "" }]).map((c) => ({
            Serial: e.serial,
            Estado: e.usado ? `Usado${e.contenedor ? ` en ${e.contenedor}` : ""}` : "Disponible",
            Campo: NOMBRE_CAMPO[c.campo] || c.campo,
            "Valor actual": c.anterior ?? "",
            "Valor nuevo": c.nuevo ?? "",
        }))), "Seriales a sobrescribir", "Seriales a sobrescribir");
    };

    return (
        <Modal show={show} onHide={onCancelar} size="lg" centered scrollable backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Seriales que ya existen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="warning" className="py-2 small">
                    <strong>{existentes.length}</strong> de los {total} seriales del archivo ya existen
                    ({conCambios} con cambios{existentes.length - conCambios > 0 ? `, ${existentes.length - conCambios} sin cambios` : ""}).
                    {" "}Si continúas, se <strong>sobrescribirán</strong> con la información del archivo y los valores
                    anteriores quedarán guardados en el historial de cada serial. {nuevos > 0 && <>Los otros {nuevos} son nuevos y se cargan normal.</>}
                    {usados > 0 && (
                        <div className="mt-1 text-danger">
                            <strong>{usados}</strong> ya fueron usados (asignados a un contenedor). Se sobrescribirán igual y quedará registrado.
                        </div>
                    )}
                </Alert>

                <div style={{ maxHeight: 280, overflowY: "auto" }} className="mb-2">
                    <Table size="sm" bordered className="mb-0 align-middle">
                        <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                            <tr>
                                <th className="text-custom-small">Serial</th>
                                <th className="text-custom-small text-center">Estado</th>
                                <th className="text-custom-small">Qué se sobrescribe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {existentes.slice(0, MAX_FILAS).map((e) => (
                                <tr key={e.serial}>
                                    <td className="text-custom-small fw-bold">{e.serial}</td>
                                    <td className="text-custom-small text-center">
                                        {e.usado
                                            ? <span className="text-danger">Usado{e.contenedor ? ` · ${e.contenedor}` : ""}</span>
                                            : "Disponible"}
                                    </td>
                                    <td className="text-custom-small">
                                        {e.cambios.length === 0
                                            ? <span className="text-muted">Sin cambios</span>
                                            : e.cambios.map((c) => (
                                                <div key={c.campo}>
                                                    {NOMBRE_CAMPO[c.campo] || c.campo}: <span className="text-muted">{c.anterior ?? "(vacío)"}</span> → <strong>{c.nuevo}</strong>
                                                </div>
                                            ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center small text-muted mb-3">
                    <span>{existentes.length > MAX_FILAS ? `Se muestran ${MAX_FILAS} de ${existentes.length}.` : ""}</span>
                    <Button variant="link" size="sm" className="p-0" onClick={descargar}>Descargar lista completa (Excel)</Button>
                </div>

                {!puedeSobrescribir ? (
                    <Alert variant="danger" className="py-2 small mb-0">
                        No tienes permiso para sobrescribir seriales. Solo un Super administrador o quien tenga el permiso
                        «recepcion_sobrescribir» puede hacerlo. Quita esos seriales del archivo o pide a un administrador que cargue el archivo.
                    </Alert>
                ) : (
                    <>
                        <Form.Label className="small mb-0 fw-bold">Motivo de la sobrescritura <span className="text-danger">*</span></Form.Label>
                        <Form.Control size="sm" className="mb-2" value={motivo} maxLength={255} placeholder="Ej. Corrección de seriales errados"
                            onChange={(e) => setMotivo(e.target.value)} />
                        <Form.Label className="small mb-0 fw-bold">Observaciones <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={2} size="sm" className="mb-3" value={observaciones} placeholder="Explica por qué se sobrescriben estos seriales"
                            onChange={(e) => setObservaciones(e.target.value)} />

                        <div className="small fw-bold mb-1">Stock del almacén</div>
                        <Form.Check type="radio" id="stock-nuevos" name="stockModo" checked={stockModo === "nuevos"} onChange={() => setStockModo("nuevos")}
                            label={`Sumar solo los seriales nuevos (${nuevos})`} />
                        <Form.Check type="radio" id="stock-todos" name="stockModo" checked={stockModo === "todos"} onChange={() => setStockModo("todos")}
                            label={`Sumar todos los seriales del archivo (${total}), incluidos los que ya existían`} />
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onCancelar} disabled={cargando}>Cancelar</Button>
                {puedeSobrescribir && (
                    <Button variant="warning" size="sm" disabled={!valido || cargando}
                        onClick={() => onConfirmar({ motivo: motivo.trim(), observaciones: observaciones.trim(), stockModo })}>
                        {cargando ? "Cargando..." : "Sobrescribir y cargar"}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
