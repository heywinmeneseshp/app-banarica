import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Col, Form, Row, Table } from "react-bootstrap";
import { FaChevronDown, FaChevronRight, FaFilePdf } from "react-icons/fa";

import excel from "@hooks/useExcel";
import { listarProveedores } from "@services/api/proveedores";
import { listarPedidosProveedor, marcarPedidoProveedorRecibido } from "@services/api/seguridad";
import { crearPedidoPdf } from "@utils/pedidoProveedorPdf";
import { datosComercializadora } from "@utils/empresaPedido";
import Paginacion from "@components/Paginacion";

const LIMITE = 20;
const COLOR_ESTADO = { generado: "secondary", enviado: "info", recibido: "success" };
const num = (v) => Number(v ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });

// Informe de pedidos > Pedidos a proveedor: los pedidos generados desde Seguridad > Disponibles >
// Cobertura y reposicion (codigo PP-...), con su estado (generado, enviado o recibido), el detalle,
// el PDF y la opcion de marcarlos como recibidos. Solo para quien tenga el permiso de cobertura.
export default function PedidosProveedorInforme() {
    const [filas, setFilas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [filtros, setFiltros] = useState({ codigo: "", proveedor: "", estado: "", desde: "", hasta: "" });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [abierto, setAbierto] = useState(null);
    const [pagina, setPagina] = useState(1);

    useEffect(() => {
        listarProveedores().then((l) => setProveedores(l || [])).catch(() => setProveedores([]));
    }, []);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
            setFilas(await listarPedidosProveedor(params));
            setPagina(1);
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudieron cargar los pedidos");
            setFilas([]);
        }
        setCargando(false);
    }, [filtros]);

    useEffect(() => {
        const t = setTimeout(cargar, 300);
        return () => clearTimeout(t);
    }, [cargar]);

    const datosProveedor = useMemo(() => Object.fromEntries(proveedores.map((p) => [p.consecutivo, p])), [proveedores]);
    const cambiar = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));

    const alternarRecibido = async (fila) => {
        const nuevo = !fila.recibido;
        const texto = nuevo
            ? `¿Marcar el pedido ${fila.codigo} como recibido?`
            : `¿Quitar la marca de recibido del pedido ${fila.codigo}?`;
        if (!window.confirm(texto)) return;
        try {
            const r = await marcarPedidoProveedorRecibido(fila.codigo, nuevo);
            setFilas((prev) => prev.map((f) => (f.codigo === fila.codigo ? {
                ...f,
                recibido: r.recibido,
                fecha_recibido: r.fecha_recibido,
                recibido_por: r.recibido_por,
                recibido_por_nombre: r.recibido_por ? "Tú" : "",
                estado: r.recibido ? "recibido" : (f.enviado ? "enviado" : "generado"),
            } : f)));
        } catch (e) {
            setError(e?.response?.data?.message || "No se pudo actualizar el pedido");
        }
    };

    const descargarPdf = (fila) => {
        const almacenes = String(fila.almacenes || "").split(",").map((a) => a.trim()).filter(Boolean);
        const empresa = datosComercializadora(
            almacenes.length && almacenes.every((a) => a.slice(-2) === "BC") ? "XXBC" : (almacenes[0] || ""),
        );
        const datos = datosProveedor[fila.cons_proveedor] || {};
        const doc = crearPedidoPdf({
            codigo: fila.codigo,
            empresa,
            proveedor: { ...datos, razon_social: datos.razon_social || fila.proveedor },
            solicitante: { nombre: fila.usuario_nombre, email: fila.usuario_email },
            lineas: fila.detalle,
            observaciones: fila.observaciones,
            fecha: new Date(`${fila.fecha}T12:00:00`),
        });
        doc.save(`${fila.codigo}_${String(fila.proveedor || "").replace(/[^\w-]+/g, "_")}.pdf`);
    };

    const descargarExcel = () => {
        excel(filas.flatMap((f) => (f.detalle.length ? f.detalle : [{}]).map((l) => ({
            "Pedido": f.codigo,
            "Fecha": f.fecha,
            "Proveedor": f.proveedor,
            "Realizado por": f.usuario_nombre,
            "Estado": f.estado,
            "Enviado a": f.destinatarios,
            "Fecha recibido": f.fecha_recibido || "",
            "Cod articulo": l.cod || "",
            "Articulo": l.nombre || "",
            "Unidades por bulto": l.bulto ?? "",
            "Bultos": l.bultos ?? "",
            "Cantidad": l.cantidad ?? "",
        }))), "Pedidos a proveedor", "Pedidos a proveedor");
    };

    const visibles = filas.slice((pagina - 1) * LIMITE, pagina * LIMITE);

    return (
        <div>
            <Row className="g-2 align-items-end mb-3">
                <Col xs={6} md={2}>
                    <Form.Label className="small mb-0 text-muted">Pedido</Form.Label>
                    <Form.Control size="sm" placeholder="PP-00001" value={filtros.codigo} onChange={(e) => cambiar("codigo", e.target.value.trim())} />
                </Col>
                <Col xs={6} md={3}>
                    <Form.Label className="small mb-0 text-muted">Proveedor</Form.Label>
                    <Form.Select size="sm" value={filtros.proveedor} onChange={(e) => cambiar("proveedor", e.target.value)}>
                        <option value="">Todos</option>
                        {proveedores.map((p) => <option key={p.consecutivo} value={p.consecutivo}>{p.razon_social}</option>)}
                    </Form.Select>
                </Col>
                <Col xs={6} md={2}>
                    <Form.Label className="small mb-0 text-muted">Estado</Form.Label>
                    <Form.Select size="sm" value={filtros.estado} onChange={(e) => cambiar("estado", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="generado">Generado</option>
                        <option value="enviado">Enviado</option>
                        <option value="recibido">Recibido</option>
                    </Form.Select>
                </Col>
                <Col xs={6} md="auto">
                    <Form.Label className="small mb-0 text-muted">Desde</Form.Label>
                    <Form.Control size="sm" type="date" value={filtros.desde} onChange={(e) => cambiar("desde", e.target.value)} />
                </Col>
                <Col xs={6} md="auto">
                    <Form.Label className="small mb-0 text-muted">Hasta</Form.Label>
                    <Form.Control size="sm" type="date" value={filtros.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
                </Col>
                <Col xs={12} md="auto">
                    <Button size="sm" variant="success" disabled={!filas.length} onClick={descargarExcel}>Descargar Excel</Button>
                </Col>
            </Row>

            {error && <div className="alert alert-danger py-1 px-2 small">{error}</div>}

            <Table size="sm" bordered hover className="align-middle">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: 28 }} />
                        {["Pedido", "Fecha", "Proveedor", "Realizado por", "Productos", "Estado", "Enviado a", "Recibido", "PDF", "Recibir"].map((h) => (
                            <th key={h} className="text-custom-small text-center">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cargando && <tr><td colSpan={11} className="text-center py-3">Cargando...</td></tr>}
                    {!cargando && visibles.length === 0 && <tr><td colSpan={11} className="text-center text-muted py-3">Sin pedidos a proveedor</td></tr>}
                    {!cargando && visibles.map((f) => (
                        <React.Fragment key={f.codigo}>
                            <tr>
                                <td className="text-center">
                                    <button type="button" className="btn btn-link btn-sm p-0 text-secondary" aria-label="Ver detalle"
                                        onClick={() => setAbierto(abierto === f.codigo ? null : f.codigo)}>
                                        {abierto === f.codigo ? <FaChevronDown /> : <FaChevronRight />}
                                    </button>
                                </td>
                                <td className="text-custom-small text-center fw-bold">{f.codigo}</td>
                                <td className="text-custom-small text-center">{f.fecha}</td>
                                <td className="text-custom-small text-center">{f.proveedor}</td>
                                <td className="text-custom-small text-center">{f.usuario_nombre}</td>
                                <td className="text-custom-small text-center"><Badge bg="info" text="dark" className="fw-normal">{f.detalle.length}</Badge></td>
                                <td className="text-center"><Badge bg={COLOR_ESTADO[f.estado]} className="fw-normal text-capitalize">{f.estado}</Badge></td>
                                <td className="text-custom-small text-center">{f.destinatarios || "—"}</td>
                                <td className="text-custom-small text-center">
                                    {f.recibido ? `${f.fecha_recibido} · ${f.recibido_por_nombre}` : "—"}
                                </td>
                                <td className="text-center">
                                    <button type="button" className="btn btn-link btn-sm p-0 text-danger" title="Descargar PDF" aria-label="Descargar PDF" onClick={() => descargarPdf(f)}>
                                        <FaFilePdf size={16} />
                                    </button>
                                </td>
                                <td className="text-center">
                                    <Button size="sm" className="py-0" variant={f.recibido ? "outline-secondary" : "success"} onClick={() => alternarRecibido(f)}>
                                        {f.recibido ? "Deshacer" : "Marcar recibido"}
                                    </Button>
                                </td>
                            </tr>
                            {abierto === f.codigo && (
                                <tr>
                                    <td colSpan={11} className="bg-light" style={{ padding: "8px 16px" }}>
                                        <Table size="sm" bordered className="mb-1">
                                            <thead className="table-light">
                                                <tr>{["Cod", "Artículo", "Unid. por bulto", "Bultos", "Cantidad"].map((h) => <th key={h} className="text-custom-small text-center">{h}</th>)}</tr>
                                            </thead>
                                            <tbody>
                                                {f.detalle.map((l) => (
                                                    <tr key={l.cod}>
                                                        <td className="text-custom-small text-center">{l.cod}</td>
                                                        <td className="text-custom-small">{l.nombre}</td>
                                                        <td className="text-custom-small text-center">{num(l.bulto)}</td>
                                                        <td className="text-custom-small text-center">{num(l.bultos)}</td>
                                                        <td className="text-custom-small text-center fw-bold">{num(l.cantidad)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        {f.observaciones && <div className="small"><strong>Observaciones:</strong> {f.observaciones}</div>}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
            <Paginacion setPagination={setPagina} pagination={pagina} total={filas.length} limit={LIMITE} />
        </div>
    );
}
