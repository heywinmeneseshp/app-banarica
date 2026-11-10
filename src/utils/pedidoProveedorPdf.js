import { jsPDF } from "jspdf";
import { LOGO_BANARICA } from "./logoBanarica";

const MARGEN = 15;
const ANCHO = 210;
const ALTO = 297;
const GRIS = [174, 182, 191];

const num = (v) => Number(v ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });

// PDF del pedido a un proveedor, con el mismo formato del documento de pedido de Almacen:
// logo y datos de quien solicita (comercializadora, direccion, telefono, correo), cuadro con el
// proveedor (con su direccion), fecha y codigo del pedido, tabla del detalle, "Realizado por"
// y observaciones.
//  empresa:     { comercializadora, direccion, tel, correo, esBanachica }   (quien solicita)
//  proveedor:   { razon_social, direccion, tel, email }                      (quien lo envia)
//  lineas:      [{ cod, nombre, bulto, bultos, cantidad }]
//  solicitante: { nombre, email }
export function crearPedidoPdf({ codigo = "", empresa = {}, proveedor = {}, lineas = [], solicitante = {}, observaciones = "", fecha = new Date() }) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const fechaTxt = fecha.toISOString().slice(0, 10);
    let y = 14;

    // ── Encabezado: quien solicita ──
    const xCentro = 62;
    if (!empresa.esBanachica) {
        try {
            doc.addImage(LOGO_BANARICA, "JPEG", xCentro - 22, y, 44, 24);
        } catch {
            // sin logo: el documento sigue igual
        }
    }
    let yEmp = y + (empresa.esBanachica ? 6 : 29);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(empresa.esBanachica ? 15 : 11);
    // El nombre puede ocupar dos lineas: se avanza segun las lineas para no pisar la direccion.
    const lineasNombre = doc.splitTextToSize(empresa.comercializadora || "", 84);
    lineasNombre.forEach((t) => {
        doc.text(t, xCentro, yEmp, { align: "center" });
        yEmp += empresa.esBanachica ? 7 : 5.2;
    });
    yEmp += 1.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    [empresa.direccion, empresa.tel, empresa.correo].filter(Boolean).forEach((t) => {
        doc.text(t, xCentro, yEmp, { align: "center", maxWidth: 80 });
        yEmp += 4.5;
    });

    // ── Cuadro de datos del pedido (derecha) ──
    const xCaja = 112;
    const anchoCaja = ANCHO - MARGEN - xCaja;
    const filasCaja = [
        ["Pedido:", codigo || "—"],
        ["Fecha:", fechaTxt],
        ["Proveedor:", proveedor.razon_social || ""],
        ["Dirección:", proveedor.direccion || "—"],
        ["Teléfono:", proveedor.tel || "—"],
        ["Correo:", proveedor.email || "—"],
    ];
    let yCaja = y + 2;
    doc.setFontSize(9);
    filasCaja.forEach(([k, v], i) => {
        const partes = doc.splitTextToSize(String(v), anchoCaja - 27);
        const alto = Math.max(7, partes.length * 4.2 + 3);
        doc.setFont("helvetica", "bold");
        doc.text(k, xCaja, yCaja + 4.5);
        doc.setFont("helvetica", k === "Proveedor:" ? "bold" : "normal");
        doc.text(partes, xCaja + 25, yCaja + 4.5);
        yCaja += alto;
        if (i < filasCaja.length - 1) {
            doc.setDrawColor(...GRIS);
            doc.line(xCaja, yCaja, ANCHO - MARGEN, yCaja);
        }
    });

    y = Math.max(yEmp, yCaja) + 8;

    // Nombre del proveedor bien visible antes del detalle.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Pedido para: ${proveedor.razon_social || ""}`, MARGEN + 2, y, { maxWidth: ANCHO - 2 * MARGEN - 4 });
    doc.setFont("helvetica", "normal");
    y += 9;

    // ── Tabla ──
    const col = {
        cod: { x: MARGEN + 2, align: "left" },
        art: { x: MARGEN + 30, align: "left" },
        bulto: { x: 140, align: "right" },
        bultos: { x: 162, align: "right" },
        cant: { x: ANCHO - MARGEN - 2, align: "right" },
    };
    const encabezado = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Cod", col.cod.x, y);
        doc.text("Artículo", col.art.x, y);
        doc.text("Unid. x bulto", col.bulto.x, y, { align: "right" });
        doc.text("Bultos", col.bultos.x, y, { align: "right" });
        doc.text("Cantidad", col.cant.x, y, { align: "right" });
        y += 2.5;
        doc.setDrawColor(...GRIS);
        doc.setLineWidth(0.6);
        doc.line(MARGEN, y, ANCHO - MARGEN, y);
        doc.setLineWidth(0.2);
        y += 5;
        doc.setFont("helvetica", "normal");
    };
    encabezado();

    let totalBultos = 0;
    let totalUnidades = 0;
    lineas.forEach((l) => {
        const partes = doc.splitTextToSize(String(l.nombre || ""), 85);
        const alto = Math.max(6, partes.length * 4.3 + 2);
        if (y + alto > ALTO - 55) {
            doc.addPage();
            y = MARGEN + 4;
            encabezado();
        }
        doc.setFontSize(9);
        doc.text(String(l.cod || ""), col.cod.x, y);
        doc.text(partes, col.art.x, y);
        doc.text(num(l.bulto), col.bulto.x, y, { align: "right" });
        doc.text(num(l.bultos), col.bultos.x, y, { align: "right" });
        doc.text(num(l.cantidad), col.cant.x, y, { align: "right" });
        totalBultos += Number(l.bultos) || 0;
        totalUnidades += Number(l.cantidad) || 0;
        y += alto;
        doc.setDrawColor(...GRIS);
        doc.line(MARGEN, y - 3.5, ANCHO - MARGEN, y - 3.5);
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total", col.art.x, y + 1);
    doc.text(num(totalBultos), col.bultos.x, y + 1, { align: "right" });
    doc.text(num(totalUnidades), col.cant.x, y + 1, { align: "right" });
    y += 12;

    if (y > ALTO - 45) {
        doc.addPage();
        y = MARGEN + 4;
    }

    // ── Autorizado por ──
    doc.setDrawColor(...GRIS);
    doc.rect(ANCHO - MARGEN - 100, y, 100, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Realizado por:", ANCHO - MARGEN - 96, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(solicitante.nombre || "", ANCHO - MARGEN - 50, y + 7, { align: "center", maxWidth: 52 });
    y += 18;

    // ── Observaciones ──
    doc.setLineWidth(0.6);
    doc.line(MARGEN, y, ANCHO - MARGEN, y);
    doc.setLineWidth(0.2);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", MARGEN + 2, y);
    doc.setFont("helvetica", "normal");
    const obs = doc.splitTextToSize(observaciones || "", ANCHO - 2 * MARGEN - 32);
    doc.text(obs, MARGEN + 30, y);
    if (solicitante.email) {
        y += Math.max(6, obs.length * 4.3 + 2);
        doc.setFontSize(8);
        doc.setTextColor(110);
        doc.text(`Solicitado por: ${solicitante.nombre || ""} (${solicitante.email})`, MARGEN + 2, y);
        doc.setTextColor(0);
    }

    return doc;
}

// Contenido del PDF en base64 (sin el prefijo data:), para adjuntarlo a un correo.
export function pdfABase64(doc) {
    return doc.output("datauristring").split(",")[1];
}
