import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Table } from "react-bootstrap";
import { FaEnvelope, FaFilePdf } from "react-icons/fa";

import excel from "@hooks/useExcel";
import { useAuth } from "@hooks/useAuth";
import { listarProveedores } from "@services/api/proveedores";
import { enviarCorreo } from "@services/api/email";
import { guardarCoberturaConfig, guardarObservacionProveedor, guardarPedidoProveedor } from "@services/api/seguridad";
import { crearPedidoPdf, pdfABase64 } from "@utils/pedidoProveedorPdf";
import { datosComercializadora } from "@utils/empresaPedido";

const num = (v) => Number(v ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Pedido por proveedor: lista lo que falta para completar el objetivo de cobertura de los productos
// en alerta, en bultos completos (el sugerido ya viene redondeado hacia arriba por bulto). Muestra
// quien solicita (comercializadora y su direccion) y quien lo envia (proveedor y su direccion),
// genera un codigo de pedido (PP-00001) y permite descargar el PDF/Excel o enviarlo por correo al
// proveedor con copia al usuario. El PDF usa el formato del documento de pedido de Almacen.
export default function PedidoProveedorModal({ show, onClose, filas = [], almacenes = [], observacionGeneral = "", onObservacionGuardada }) {
    const { getUser } = useAuth();
    const usuario = getUser();
    const [proveedor, setProveedor] = useState("");
    const [bultos, setBultos] = useState({});
    const [observaciones, setObservaciones] = useState("");
    const [codigos, setCodigos] = useState({});
    const [datosProveedores, setDatosProveedores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [resultado, setResultado] = useState(null);

    const proveedores = useMemo(() => {
        const m = new Map();
        filas.forEach((f) => m.set(f.cons_proveedor || "", f.proveedor || "Sin proveedor"));
        return [...m.entries()].map(([cons, nombre]) => ({ cons, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [filas]);

    useEffect(() => {
        if (!show) return;
        const inicial = {};
        filas.forEach((f) => { inicial[f.consecutivo] = Math.round(f.sugerido / f.bulto); });
        setBultos(inicial);
        setCodigos({});
        setResultado(null);
        setProveedor((p) => (proveedores.some((x) => x.cons === p) ? p : (proveedores[0]?.cons ?? "")));
    }, [show, filas, proveedores]);

    // Datos de contacto de los proveedores (razon social, direccion, telefono, correo).
    useEffect(() => {
        if (!show) return;
        listarProveedores()
            .then((lista) => setDatosProveedores(Object.fromEntries((lista || []).map((p) => [p.consecutivo, p]))))
            .catch(() => setDatosProveedores({}));
    }, [show]);

    // Observacion predeterminada: la del proveedor si existe y, si no, la general.
    const obsProveedor = (filas.find((f) => (f.cons_proveedor || "") === proveedor)?.observacion_proveedor || "").trim();
    useEffect(() => {
        if (!show) return;
        setObservaciones(obsProveedor || observacionGeneral || "");
    }, [show, proveedor, obsProveedor, observacionGeneral]);

    const datos = datosProveedores[proveedor] || {};
    const nombreProveedor = proveedores.find((p) => p.cons === proveedor)?.nombre || "Proveedor";
    const lineas = filas.filter((f) => (f.cons_proveedor || "") === proveedor);
    const cantidad = (f) => (Number(bultos[f.consecutivo]) || 0) * f.bulto;
    const conCantidad = lineas.filter((f) => cantidad(f) > 0);

    // Quien solicita: la comercializadora del almacen (si todos los almacenes son BC, Banachica).
    const empresa = datosComercializadora(
        almacenes.length && almacenes.every((a) => String(a).slice(-2) === "BC") ? "XXBC" : (almacenes[0] || ""),
    );
    const nombreUsuario = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || usuario?.username || "";
    const correoProveedor = (datos.email || "").trim();
    const correoUsuario = (usuario?.email || "").trim();
    const codigo = codigos[proveedor] || "";

    const filaExcel = (f) => ({
        "Pedido": codigos[f.cons_proveedor || ""] || "",
        "Proveedor": f.proveedor || "Sin proveedor",
        "Cod articulo": f.consecutivo,
        "Articulo": f.nombre_proveedor || f.name,
        "Stock": f.stock,
        "Promedio mensual": f.promedio_mensual,
        "Objetivo": f.objetivo,
        "Unidades por bulto": f.bulto,
        "Bultos a pedir": Number(bultos[f.consecutivo]) || 0,
        "Cantidad a pedir": cantidad(f),
    });

    const lineasRegistro = () => conCantidad.map((f) => ({
        cod: f.consecutivo,
        nombre: f.nombre_proveedor || f.name,
        bulto: f.bulto,
        bultos: Number(bultos[f.consecutivo]) || 0,
        cantidad: cantidad(f),
    }));

    // Reserva el codigo del pedido la primera vez y lo reutiliza (actualizando el detalle) despues.
    const asegurarCodigo = async (extra = {}) => {
        const r = await guardarPedidoProveedor({
            codigo: codigos[proveedor] || undefined,
            cons_proveedor: proveedor,
            proveedor: datos.razon_social || nombreProveedor,
            observaciones,
            lineas: lineasRegistro(),
            almacenes,
            ...extra,
        });
        setCodigos((c) => ({ ...c, [proveedor]: r.codigo }));
        return r.codigo;
    };

    const armarPdf = (codigoPedido) => crearPedidoPdf({
        codigo: codigoPedido,
        empresa,
        proveedor: { ...datos, razon_social: datos.razon_social || nombreProveedor },
        solicitante: { nombre: nombreUsuario, email: correoUsuario },
        lineas: lineasRegistro(),
        observaciones,
    });

    const guardarPredeterminada = async (tipo) => {
        setResultado(null);
        try {
            if (tipo === "proveedor") {
                await guardarObservacionProveedor(proveedor, observaciones);
            } else {
                await guardarCoberturaConfig({ observacion_pedido: observaciones });
            }
            await onObservacionGuardada?.();
            setResultado({
                ok: true,
                mensaje: tipo === "proveedor"
                    ? `Observación predeterminada guardada para ${nombreProveedor}.`
                    : "Observación general guardada.",
            });
        } catch (e) {
            setResultado({ ok: false, mensaje: e?.response?.data?.message || "No se pudo guardar la observación." });
        }
    };

    const nombreArchivo = (codigoPedido) => `${codigoPedido}_${nombreProveedor.replace(/[^\w-]+/g, "_")}.pdf`;

    const descargarProveedor = () => {
        if (!conCantidad.length) return;
        excel(conCantidad.map(filaExcel), "Pedido", `Pedido ${codigo || nombreProveedor}`);
    };

    const descargarTodos = () => {
        const todos = filas.filter((f) => cantidad(f) > 0)
            .sort((a, b) => String(a.proveedor).localeCompare(String(b.proveedor)))
            .map(filaExcel);
        if (todos.length) excel(todos, "Pedidos", "Pedidos por proveedor");
    };

    const descargarPdf = async () => {
        if (!conCantidad.length) return;
        setGenerando(true);
        setResultado(null);
        try {
            const cod = await asegurarCodigo();
            armarPdf(cod).save(nombreArchivo(cod));
        } catch (e) {
            setResultado({ ok: false, mensaje: e?.response?.data?.message || e?.message || "No se pudo generar el pedido." });
        } finally {
            setGenerando(false);
        }
    };

    const enviarPorCorreo = async () => {
        if (!conCantidad.length) return;
        if (!correoProveedor) {
            setResultado({ ok: false, mensaje: "Este proveedor no tiene correo registrado. Agrégalo en Maestros → Proveedores." });
            return;
        }
        if (!correoUsuario) {
            setResultado({ ok: false, mensaje: "Tu usuario no tiene correo registrado, no se puede enviar la copia." });
            return;
        }
        const destinos = `${correoProveedor} (proveedor) y ${correoUsuario} (tú)`;
        if (!window.confirm(`Se enviará el pedido en PDF a ${destinos}. ¿Continuar?`)) return;

        setEnviando(true);
        setResultado(null);
        try {
            const cod = await asegurarCodigo();
            const filasHtml = conCantidad.map((f) => `
                <tr>
                    <td style="border:1px solid #ccc;padding:4px 8px">${esc(f.consecutivo)}</td>
                    <td style="border:1px solid #ccc;padding:4px 8px">${esc(f.nombre_proveedor || f.name)}</td>
                    <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${num(f.bulto)}</td>
                    <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${num(Number(bultos[f.consecutivo]) || 0)}</td>
                    <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${num(cantidad(f))}</td>
                </tr>`).join("");
            const cuerpo = `
                <p>Buen día${datos.razon_social ? `, ${esc(datos.razon_social)}` : ""}.</p>
                <p>Adjuntamos el pedido <strong>${esc(cod)}</strong> en PDF. Resumen:</p>
                ${observaciones
                    ? `<p style="background:#fff3cd;border-left:4px solid #ffc107;padding:8px 12px;font-size:14px;font-weight:bold">${esc(observaciones).replace(/\n/g, "<br/>")}</p>`
                    : ""}
                <table style="border-collapse:collapse;font-size:13px">
                    <thead><tr style="background:#eee">
                        <th style="border:1px solid #ccc;padding:4px 8px">Cod</th>
                        <th style="border:1px solid #ccc;padding:4px 8px;text-align:left">Artículo</th>
                        <th style="border:1px solid #ccc;padding:4px 8px">Unid. por bulto</th>
                        <th style="border:1px solid #ccc;padding:4px 8px">Bultos</th>
                        <th style="border:1px solid #ccc;padding:4px 8px">Cantidad</th>
                    </tr></thead>
                    <tbody>${filasHtml}</tbody>
                </table>
                <p>Solicitado por: ${esc(nombreUsuario)} (${esc(correoUsuario)}).</p>`;

            const respuesta = await enviarCorreo({
                destinatario: correoProveedor,
                cc: correoUsuario,
                asunto: `Pedido ${cod} - ${empresa.comercializadora}`,
                cuerpo,
                archivo: { nombre: nombreArchivo(cod), contenido: pdfABase64(armarPdf(cod)), tipo: "application/pdf" },
            });
            if (respuesta?.success) {
                await asegurarCodigo({ enviado: true, destinatarios: `${correoProveedor}, ${correoUsuario}` });
                setResultado({ ok: true, mensaje: `Pedido ${cod} enviado a ${destinos}.` });
            } else {
                setResultado({ ok: false, mensaje: respuesta?.message || "No fue posible enviar el correo." });
            }
        } catch (e) {
            setResultado({ ok: false, mensaje: e?.response?.data?.message || e?.message || "No fue posible enviar el correo." });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Pedido por proveedor</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Label className="small mb-0 text-muted">Proveedor</Form.Label>
                <Form.Select size="sm" className="mb-2" value={proveedor} onChange={(e) => { setProveedor(e.target.value); setResultado(null); }}>
                    {proveedores.map((p) => <option key={p.cons} value={p.cons}>{p.nombre}</option>)}
                </Form.Select>

                <div className="d-flex align-items-center gap-2 mb-2 small">
                    <span className="text-muted">Pedido:</span>
                    {codigo
                        ? <span className="badge bg-primary fs-6">{codigo}</span>
                        : <span className="text-muted">se genera al descargar el PDF o enviar por correo</span>}
                </div>

                <div className="row g-2 mb-3 small">
                    <div className="col-md-6">
                        <div className="border rounded bg-light p-2 h-100">
                            <div className="text-muted text-uppercase" style={{ fontSize: 10 }}>Quien solicita</div>
                            <div className="fw-bold">{empresa.comercializadora}</div>
                            <div><span className="text-muted">Dirección:</span> {empresa.direccion}</div>
                            <div><span className="text-muted">Teléfono:</span> {empresa.tel}</div>
                            <div><span className="text-muted">Correo:</span> {empresa.correo}</div>
                            <div className="mt-1"><span className="text-muted">Realiza:</span> {nombreUsuario} {correoUsuario && `(${correoUsuario})`}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="border rounded bg-light p-2 h-100">
                            <div className="text-muted text-uppercase" style={{ fontSize: 10 }}>Quien lo envía (proveedor)</div>
                            <div className="fw-bold">{datos.razon_social || nombreProveedor}</div>
                            <div><span className="text-muted">Dirección:</span> {datos.direccion || "—"}</div>
                            <div><span className="text-muted">Teléfono:</span> {datos.tel || "—"}</div>
                            <div>
                                <span className="text-muted">Correo:</span> {correoProveedor || <span className="text-danger">sin correo registrado</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <Table size="sm" bordered className="align-middle">
                    <thead className="table-light">
                        <tr>
                            {["Artículo", "Stock", "Objetivo", "Unid. por bulto", "Bultos", "Cantidad"].map((h) => (
                                <th key={h} className="text-custom-small text-center">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {lineas.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-3">Sin productos por reponer de este proveedor</td></tr>}
                        {lineas.map((f) => (
                            <tr key={f.consecutivo}>
                                <td className="text-custom-small">
                                    {f.nombre_proveedor || f.name}
                                    {f.nombre_proveedor
                                        ? <div className="text-muted" style={{ fontSize: 10 }}>{f.name}</div>
                                        : <div className="text-danger" style={{ fontSize: 10 }}>Sin «nombre del proveedor»: se usa el nombre interno</div>}
                                </td>
                                <td className="text-custom-small text-center">{num(f.stock)}</td>
                                <td className="text-custom-small text-center">{num(f.objetivo)}</td>
                                <td className="text-custom-small text-center">{num(f.bulto)}</td>
                                <td style={{ width: 100 }}>
                                    <Form.Control size="sm" type="number" min="0" step="1" className="text-center"
                                        value={bultos[f.consecutivo] ?? 0}
                                        onChange={(e) => setBultos((b) => ({ ...b, [f.consecutivo]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))} />
                                </td>
                                <td className="text-center fw-bold text-primary">{num(cantidad(f))}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <Form.Label className="small mb-0 text-muted">Observaciones (salen en el PDF y en el correo)</Form.Label>
                <Form.Control as="textarea" rows={2} size="sm" className="mb-1" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <Button variant="outline-secondary" size="sm" className="py-0" onClick={() => guardarPredeterminada("proveedor")}>
                        Guardar como predeterminada de este proveedor
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="py-0" onClick={() => guardarPredeterminada("general")}>
                        Guardar como general
                    </Button>
                    <span className="small text-muted">
                        {obsProveedor ? "Usando la del proveedor" : (observacionGeneral ? "Usando la general" : "Sin observación predeterminada")}
                    </span>
                </div>

                <p className="small text-muted mb-1">
                    Los bultos propuestos completan el objetivo, redondeados hacia arriba por unidades de bulto. Puedes ajustarlos antes de descargar o enviar.
                </p>
                <p className="small text-muted mb-0">
                    El correo se envía al proveedor ({correoProveedor || "sin correo"}) con copia a tu correo ({correoUsuario || "sin correo"}).
                </p>
                {resultado && <Alert variant={resultado.ok ? "success" : "danger"} className="py-1 px-2 small mt-2 mb-0">{resultado.mensaje}</Alert>}
            </Modal.Body>
            <Modal.Footer className="flex-wrap">
                <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
                <Button variant="outline-primary" size="sm" onClick={descargarTodos}>Excel de todos</Button>
                <Button variant="outline-success" size="sm" onClick={descargarProveedor} disabled={!conCantidad.length}>Excel de este proveedor</Button>
                <Button variant="outline-danger" size="sm" onClick={descargarPdf} disabled={!conCantidad.length || generando}>
                    <FaFilePdf className="me-1" />{generando ? "Generando..." : "Descargar PDF"}
                </Button>
                <Button variant="primary" size="sm" onClick={enviarPorCorreo} disabled={!conCantidad.length || enviando}>
                    <FaEnvelope className="me-1" />{enviando ? "Enviando..." : "Enviar por correo"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
