import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import endPoints from "@services/api";
import { Form, Row, Col, Button } from "react-bootstrap";
import Paginacion from "@components/shared/Tablas/Paginacion";
import CargueMasivo from "@assets/Seguridad/Listado/CargueMasivo";
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import styles from "@styles/Seguridad.module.css";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Brush, ReferenceLine
} from "recharts";

function formatDate() {
    const date = new Date();
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
}

function formatFechaLarga(fecha, hora) {
    if (!fecha) return '';
    const d = new Date(`${fecha}T${hora || '00:00:00'}`);
    if (isNaN(d.getTime())) return `${fecha} ${hora || ''}`.trim();
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} · ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

/* ─── Tooltip Power BI ─── */
function TempTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: "#1f2937", border: "1px solid #374151", borderRadius: 6,
            padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
        }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                {formatFechaLarga(d.fecha, d.hora)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#f87171", lineHeight: 1 }}>
                    {Number(d.temp).toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: "#f87171" }}>°C</span>
            </div>
        </div>
    );
}

/* ─── Tarjeta KPI estilo Power BI ─── */
function KpiCard({ label, value, color }) {
    return (
        <div style={{
            flex: 1, minWidth: 120, background: "#1f2937",
            borderRadius: 8, padding: "14px 18px",
            borderLeft: `4px solid ${color}`
        }}>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
                {label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
                {value !== null && value !== undefined ? `${Number(value).toFixed(1)}°C` : "—"}
            </div>
        </div>
    );
}

/* ─── Modal gráfica ─── */
function GraficaTemperatura({ idSerialArticulo, serial, onClose }) {
    const [data, setData] = useState([]);
    const [contexto, setContexto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomRange, setZoomRange] = useState({ start: 0, end: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [lecturasRes, contextoRes] = await Promise.all([
                    axios.get(endPoints.registroTemperatura.grafica(idSerialArticulo)),
                    axios.get(endPoints.registroTemperatura.contexto(idSerialArticulo))
                ]);
                const rows = (lecturasRes.data || []).map((r, i) => ({
                    ...r, idx: i,
                    fechaHora: `${r.fecha} ${r.hora}`,
                    temp: r.temperatura
                }));
                setData(rows);
                setZoomRange({ start: 0, end: rows.length - 1 });
                setContexto(contextoRes.data);
            } catch {
                alert("Error al cargar datos de la gráfica");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [idSerialArticulo]);

    const handleBrush = (e) => {
        if (e?.startIndex !== undefined && e?.endIndex !== undefined)
            setZoomRange({ start: e.startIndex, end: e.endIndex });
    };

    const visibleData = data.slice(zoomRange.start, zoomRange.end + 1);
    const tempValues = visibleData.map((d) => d.temp).filter((v) => v !== null && !isNaN(v));
    const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : null;
    const minTemp = tempValues.length > 0 ? Math.min(...tempValues) : null;
    const maxTemp = tempValues.length > 0 ? Math.max(...tempValues) : null;

    const listados = contexto?.contenedor?.Listados || [];
    const embarque = listados.find((l) => l.Embarque)?.Embarque;
    const productoRows = listados.map((l, i) => ({
        key: i,
        producto: l.combo?.nombre || '-',
        cajas: l.cajas_unidades ?? '-',
        lugar: l.almacen?.nombre || '-',
        fecha: l.fecha || '-'
    }));
    const inspecciones = contexto?.contenedor?.inspecciones || [];
    const tuvoInspeccion = inspecciones.length > 0;
    const isZoomed = data.length > 0 && (zoomRange.start > 0 || zoomRange.end < data.length - 1);

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{ background: "#111827", zIndex: 1060 }}>

            {/* ── Header oscuro ── */}
            <div style={{ background: "#1f2937", borderBottom: "1px solid #374151", padding: "12px 20px" }}>
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                            Termógrafo
                        </div>
                        <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: 18 }}>
                            Serial: {serial}
                            <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 13, marginLeft: 12 }}>
                                {contexto?.contenedor?.contenedor ? `· Contenedor: ${contexto.contenedor.contenedor}` : ''}
                            </span>
                        </div>

                        {/* Info embarque en una línea */}
                        <div className="d-flex flex-wrap gap-3 mt-1" style={{ fontSize: 12, color: "#d1d5db" }}>
                            {embarque?.Buque?.buque && <span><span style={{ color: "#6b7280" }}>Buque:</span> {embarque.Buque.buque}</span>}
                            {embarque?.Naviera?.navieras && <span><span style={{ color: "#6b7280" }}>Naviera:</span> {embarque.Naviera.navieras}</span>}
                            {embarque?.Destino?.destino && <span><span style={{ color: "#6b7280" }}>Destino:</span> {embarque.Destino.destino}</span>}
                            {embarque?.booking && <span><span style={{ color: "#6b7280" }}>Booking:</span> {embarque.booking}</span>}
                            {(embarque?.cliente?.razon_social || embarque?.cliente?.cod) && <span><span style={{ color: "#6b7280" }}>Cliente:</span> {embarque?.cliente?.razon_social || embarque?.cliente?.cod}</span>}
                            {embarque?.fecha_zarpe && <span><span style={{ color: "#6b7280" }}>Zarpe:</span> {new Date(embarque.fecha_zarpe).toLocaleDateString('es-CO')}</span>}
                            {embarque?.fecha_arribo && <span><span style={{ color: "#6b7280" }}>Arribo:</span> {new Date(embarque.fecha_arribo).toLocaleDateString('es-CO')}</span>}
                        </div>

                        {/* Productos */}
                        {productoRows.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-1">
                                {productoRows.map((p) => (
                                    <span key={p.key} style={{
                                        background: "#064e3b", color: "#6ee7b7",
                                        borderRadius: 4, padding: "2px 8px", fontSize: 11
                                    }}>
                                        {p.producto} · {p.cajas} cajas · {p.lugar}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Inspecciones */}
                        <div className="d-flex flex-wrap gap-2 mt-1 align-items-center">
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>Insp. antinarcóticos:</span>
                            {tuvoInspeccion ? (
                                <>
                                    <span style={{
                                        background: "#065f46", color: "#6ee7b7",
                                        borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600
                                    }}>
                                        ✓ Sí — {inspecciones.length} inspección{inspecciones.length > 1 ? 'es' : ''}
                                    </span>
                                    {inspecciones.map((insp, i) => (
                                        <span key={i} style={{
                                            background: "#1f2937", border: "1px solid #374151",
                                            color: "#d1d5db", borderRadius: 4, padding: "2px 8px", fontSize: 11
                                        }}>
                                            #{i + 1} {new Date(insp.fecha_inspeccion).toLocaleDateString('es-CO')}
                                            {insp.hora_inicio ? ` · ${insp.hora_inicio}${insp.hora_fin ? `–${insp.hora_fin}` : ''}` : ''}
                                            {insp.agente ? ` · ${insp.agente}` : ''}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <span style={{
                                    background: "#7f1d1d", color: "#fca5a5",
                                    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600
                                }}>
                                    ✗ No registrada
                                </span>
                            )}
                        </div>
                    </div>

                    <button type="button" onClick={onClose} style={{
                        background: "#374151", border: "none", borderRadius: 6,
                        color: "#9ca3af", width: 32, height: 32, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, flexShrink: 0
                    }}>✕</button>
                </div>
            </div>

            {/* ── Cuerpo ── */}
            <div className="d-flex flex-column flex-grow-1 p-3" style={{ minHeight: 0, gap: 12 }}>
                {loading ? (
                    <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{ color: "#9ca3af" }}>
                        Cargando lecturas...
                    </div>
                ) : data.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{ color: "#6b7280" }}>
                        Sin datos de temperatura para este serial
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="d-flex gap-2 flex-wrap">
                            <div style={{
                                flex: 1, minWidth: 120, background: "#1f2937",
                                borderRadius: 8, padding: "14px 18px", borderLeft: "4px solid #4b5563"
                            }}>
                                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>Lecturas</div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: "#e5e7eb", lineHeight: 1 }}>{data.length}</div>
                            </div>
                            <KpiCard label="Promedio" value={avgTemp} color="#60a5fa" />
                            <KpiCard label="Mínima" value={minTemp} color="#34d399" />
                            <KpiCard label="Máxima" value={maxTemp} color="#f87171" />
                            {isZoomed && (
                                <button
                                    onClick={() => setZoomRange({ start: 0, end: data.length - 1 })}
                                    style={{
                                        background: "#374151", border: "1px solid #4b5563",
                                        borderRadius: 8, color: "#d1d5db", padding: "0 16px",
                                        cursor: "pointer", fontSize: 12, alignSelf: "stretch"
                                    }}
                                >
                                    ↺ Ver todo
                                </button>
                            )}
                        </div>

                        {/* Gráfica */}
                        <div style={{
                            flex: 1, minHeight: 0, background: "#1f2937",
                            borderRadius: 8, padding: "16px 12px 8px"
                        }}>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, paddingLeft: 8 }}>
                                Temperatura °C — {data.length} lecturas
                                {avgTemp !== null && <span style={{ marginLeft: 16, color: "#60a5fa" }}>Prom: {avgTemp.toFixed(1)}°C</span>}
                            </div>
                            <div style={{ height: "calc(100% - 28px)" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 8 }}>
                                        <defs>
                                            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f87171" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="idx"
                                            type="number"
                                            domain={[zoomRange.start, zoomRange.end]}
                                            tickFormatter={(v) => {
                                                const r = data[v];
                                                if (!r) return '';
                                                const d = new Date(`${r.fecha}T${r.hora || '00:00:00'}`);
                                                if (isNaN(d.getTime())) return r.fecha || '';
                                                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                                return `${d.getDate()} ${meses[d.getMonth()]}`;
                                            }}
                                            tick={{ fontSize: 10, fill: "#6b7280" }}
                                            axisLine={{ stroke: "#374151" }}
                                            tickLine={false}
                                            height={28}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#6b7280" }}
                                            domain={["auto", "auto"]}
                                            tickFormatter={(v) => `${v}°`}
                                            width={44}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<TempTooltip />} />
                                        {avgTemp !== null && (
                                            <ReferenceLine
                                                y={avgTemp}
                                                stroke="#60a5fa"
                                                strokeDasharray="6 4"
                                                strokeWidth={1.5}
                                                label={{ value: `${avgTemp.toFixed(1)}°C`, position: "right", fontSize: 11, fill: "#60a5fa", fontWeight: 600 }}
                                            />
                                        )}
                                        <Area
                                            type="monotone"
                                            dataKey="temp"
                                            stroke="#f87171"
                                            strokeWidth={2}
                                            fill="url(#tempGrad)"
                                            dot={false}
                                            activeDot={{ r: 5, fill: "#f87171", stroke: "#111827", strokeWidth: 2 }}
                                            isAnimationActive={false}
                                        />
                                        <Brush
                                            dataKey="idx"
                                            height={28}
                                            stroke="#374151"
                                            fill="#111827"
                                            travellerWidth={8}
                                            travellerStyle={{ fill: "#f87171", stroke: "none", cursor: "col-resize" }}
                                            onChange={handleBrush}
                                            startIndex={zoomRange.start}
                                            endIndex={zoomRange.end}
                                            tickFormatter={() => ""}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Modal carga Excel ─── */
function CargarTemperaturaExcel({ setOpenMasivo, onSuccess }) {
    const [modo, setModo] = useState("termografo");
    const [serial, setSerial] = useState("");
    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [archivo, setArchivo] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmacion, setConfirmacion] = useState(null);
    const timeoutRef = useRef(null);

    const buscarSeriales = useCallback((texto) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!texto.trim()) { setSugerencias([]); setMostrarSugerencias(false); return; }
        timeoutRef.current = setTimeout(async () => {
            try {
                const res = await axios.post(endPoints.seguridad.listarSeriales, {
                    data: { serial: texto.trim() },
                    pagination: { offset: 1, limit: 10 }
                });
                setSugerencias(res.data?.data || []);
                setMostrarSugerencias(true);
            } catch { setSugerencias([]); }
        }, 300);
    }, []);

    const seleccionarSerial = (s) => {
        setSerial(s.serial);
        setMostrarSugerencias(false);
        setSugerencias([]);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setArchivo(file);
        if (!file) { setPreview([]); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            setPreview(XLSX.utils.sheet_to_json(sheet).slice(0, 20));
        };
        reader.readAsArrayBuffer(file);
    };

    const descargarPlantilla = () => {
        const plantilla = modo === "termografo"
            ? [{ "Date/Time": "5/16/2026 12:33:09", "Temperature": 36.78 }, { "Date/Time": "5/16/2026 13:18:09", "Temperature": 34.33 }]
            : [{ "serial": "AA2R38418", "Date/Time": "5/16/2026 12:33:09", "Temperature": 36.78 }, { "serial": "BB3S49529", "Date/Time": "5/16/2026 13:18:09", "Temperature": 34.33 }];
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(plantilla), "Plantilla");
        XLSX.writeFile(book, `plantilla_temperatura_${modo}.xlsx`);
    };

    const parseAndSend = async (allowOverwrite = false) => {
        if (!archivo) { alert("Selecciona un archivo Excel."); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const payload = { rows: json, allowOverwrite };
            if (modo === "termografo") {
                if (!serial.trim()) { alert("Debes ingresar un serial."); return; }
                payload.serial = serial.trim();
            }
            setLoading(true);
            try {
                const res = await axios.post(endPoints.registroTemperatura.cargarMasivo, payload);
                if (res.data.requiresConfirmation) { setConfirmacion(res.data); return; }
                alert(res.data?.message || "Carga exitosa");
                setOpenMasivo(false);
                if (typeof onSuccess === "function") onSuccess();
            } catch (error) {
                alert("Error: " + (error?.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(archivo);
    };

    return (
        <div className={styles2.fondo}>
            <div className={styles2.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Cargar registros de temperatura</span>
                        <button type="button" onClick={() => setOpenMasivo(false)} className="btn-close" />
                    </div>
                    <div className="card-body">
                        {confirmacion ? (
                            <>
                                <div className="alert alert-warning">
                                    <strong>Registros existentes</strong>
                                    <p className="mb-1 mt-2">{confirmacion.message}</p>
                                    <ul className="mb-0 small">
                                        {confirmacion.serialesConDatos?.map((item, i) => (
                                            <li key={i}><strong>{item.serial}</strong>: {item.registrosExistentes} existente(s), {item.registrosNuevos} nuevo(s)</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <Button variant="secondary" onClick={() => setConfirmacion(null)} disabled={loading}>Cancelar</Button>
                                    <Button variant="warning" onClick={() => parseAndSend(true)} disabled={loading}>
                                        {loading ? "Reemplazando..." : "Sí, reemplazar datos"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <fieldset className="mb-3">
                                    <legend className="form-label fw-bold mb-2" style={{ fontSize: 'inherit' }}>Modo de carga</legend>
                                    <div className="d-flex gap-3">
                                        <label className="d-flex align-items-center gap-1">
                                            <input type="radio" checked={modo === "termografo"} onChange={() => setModo("termografo")} />
                                            Termógrafo (un serial para todo el archivo)
                                        </label>
                                        <label className="d-flex align-items-center gap-1">
                                            <input type="radio" checked={modo === "masivo"} onChange={() => setModo("masivo")} />
                                            Masivo (cada fila tiene su propio serial)
                                        </label>
                                    </div>
                                </fieldset>

                                {modo === "termografo" && (
                                    <div className="mb-3" style={{ position: "relative" }}>
                                        <label className="form-label fw-bold" htmlFor="serial-articulo">Serial del artículo</label>
                                        <input
                                            id="serial-articulo" type="text" className="form-control"
                                            placeholder="Escribe para buscar un serial"
                                            value={serial}
                                            onChange={(e) => { setSerial(e.target.value); buscarSeriales(e.target.value); }}
                                            onFocus={() => sugerencias.length > 0 && setMostrarSugerencias(true)}
                                            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                                            disabled={loading}
                                        />
                                        {mostrarSugerencias && sugerencias.length > 0 && (
                                            <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                                                {sugerencias.map((s, i) => (
                                                    <li key={s.id || i} role="option" aria-selected={false}
                                                        className="list-group-item list-group-item-action py-1 px-2 small"
                                                        style={{ cursor: "pointer" }}
                                                        onMouseDown={() => seleccionarSerial(s)}
                                                    >
                                                        <strong>{s.serial}</strong>
                                                        <span className="text-muted ms-2">{s.producto?.name || s.cons_producto || ""}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label fw-bold" htmlFor="archivo-excel">Archivo Excel</label>
                                    <input id="archivo-excel" type="file" accept=".xlsx,.xls" className="form-control" onChange={handleFileChange} disabled={loading} />
                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <span className="text-muted small">
                                            {modo === "termografo" ? "Columnas: Date/Time, Temperature" : "Columnas: serial, Date/Time, Temperature"}
                                        </span>
                                        <button type="button" className="btn btn-link btn-sm p-0" onClick={descargarPlantilla}>Descargar plantilla</button>
                                    </div>
                                </div>

                                {preview.length > 0 && (
                                    <div className="mb-3">
                                        <div className="fw-bold mb-1 small">Vista previa ({preview.length} filas)</div>
                                        <div className="table-responsive" style={{ maxHeight: "180px" }}>
                                            <table className="table table-sm table-bordered mb-0">
                                                <thead><tr>{Object.keys(preview[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
                                                <tbody>{preview.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? "")}</td>)}</tr>)}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between">
                                    <Button variant="secondary" onClick={() => setOpenMasivo(false)} disabled={loading}>Cancelar</Button>
                                    <Button variant="primary" onClick={() => parseAndSend(false)} disabled={loading || (modo === "termografo" && !serial.trim()) || !archivo}>
                                        {loading ? "Cargando..." : "Cargar"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Helpers fecha ─── */
function parseDate(fechaStr) {
    if (!fechaStr) return null;
    let date = new Date(fechaStr);
    if (!isNaN(date.getTime())) return date;
    const parts = fechaStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (parts) {
        date = new Date(+parts[3], +parts[2] - 1, +parts[1]);
        if (!isNaN(date.getTime())) return date;
        date = new Date(+parts[3], +parts[1] - 1, +parts[2]);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

function formatFechaListado(fechaStr) {
    const date = parseDate(fechaStr);
    if (!date) return fechaStr || '-';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${date.getUTCFullYear()}-${month}-${day}`;
}

function getWeekNumber(fechaStr) {
    const date = parseDate(fechaStr);
    if (!date) return '-';
    const year = date.getUTCFullYear();
    const startOfYear = Date.UTC(year, 0, 1);
    const dayOfYear = Math.floor((Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - startOfYear) / 86400000);
    return Math.ceil((dayOfYear + 1) / 7);
}

/* ─── Página principal ─── */
export default function InfoTemperatura() {
    const [registros, setRegistros] = useState([]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [openMasivo, setOpenMasivo] = useState(false);
    const [openActualizarMasivo, setOpenActualizarMasivo] = useState(false);
    const [grafica, setGrafica] = useState(null);
    const limit = 20;

    const [filtroSerial, setFiltroSerial] = useState("");
    const [filtroContenedor, setFiltroContenedor] = useState("");

    const listar = useCallback(async () => {
        try {
            const body = {};
            if (filtroSerial) body.serial = filtroSerial;
            const hasContenedorFilter = !!filtroContenedor;
            const fetchOffset = hasContenedorFilter ? 1 : pagination;
            const fetchLimit = hasContenedorFilter ? 100000 : limit;

            const res = await axios.post(
                `${endPoints.registroTemperatura.resumen}?offset=${fetchOffset}&limit=${fetchLimit}`, body
            );

            let rows = res.data.data || [];
            let totalCount = res.data.total || 0;

            if (hasContenedorFilter) {
                const q = filtroContenedor.toLowerCase();
                rows = rows.filter((item) => item.contenedor_nombre?.toLowerCase().includes(q));
                totalCount = rows.length;
                rows = rows.slice((pagination - 1) * limit, (pagination - 1) * limit + limit);
            }

            setTotal(totalCount);

            const enriched = await Promise.all(rows.map(async (item) => {
                try {
                    const ctx = await axios.get(endPoints.registroTemperatura.contexto(item.id_serial_articulo));
                    const listados = ctx.data?.contenedor?.Listados || [];
                    const embarque = listados.find((l) => l.Embarque)?.Embarque;
                    return { ...item, buque: embarque?.Buque?.buque || null, destino: embarque?.Destino?.destino || null };
                } catch { return item; }
            }));

            setRegistros(enriched);
        } catch (error) {
            console.error("Error al listar resumen de temperatura:", error);
        }
    }, [pagination, filtroSerial, filtroContenedor, limit]);

    useEffect(() => { listar(); }, [listar]);

    const onBuscar = () => { setPagination(1); listar(); };

    const onDescargarExcel = () => {
        const newData = registros.map((item) => ({
            Fecha: formatFechaListado(item.fecha_llenado),
            Contenedor: item.contenedor_nombre || "",
            Semana: String(getWeekNumber(item.fecha_llenado)),
            Buque: item.buque || "",
            Destino: item.destino || "",
            Serial: item.serial || "",
            "Lugar de llenado": item.lugar_llenado || "",
            Lecturas: item.lecturas || 0
        }));
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(newData), "Temperatura");
        XLSX.writeFile(book, `Registro_Temperatura_${formatDate()}.xlsx`);
    };

    return (
        <>
            <h2>Termógrafos</h2>
            <div className="line"></div>

            <Form>
                <Row xs={1} sm={2} md={3} lg={6}>
                    <Col>
                        <Form.Group className="mb-0">
                            <Form.Label className='mt-1 mb-1'>Serial</Form.Label>
                            <Form.Control className='form-control-sm' type="text" value={filtroSerial}
                                onChange={(e) => setFiltroSerial(e.target.value)} placeholder="Ingrese el serial" />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-0">
                            <Form.Label className='mt-1 mb-1'>Contenedor</Form.Label>
                            <Form.Control className='form-control-sm' type="text" value={filtroContenedor}
                                onChange={(e) => setFiltroContenedor(e.target.value)} placeholder="Ingrese el contenedor" />
                        </Form.Group>
                    </Col>
                    <Col><button type='button' onClick={onBuscar} className='btn mt-30px w-100 btn-sm btn-primary'>Buscar</button></Col>
                    <Col><button type='button' onClick={onDescargarExcel} className='btn mt-30px w-100 btn-sm btn-success'>Descargar Excel</button></Col>
                    <Col><button type='button' onClick={() => setOpenMasivo(true)} className='btn mt-30px w-100 btn-sm btn-info'>Cargar Excel</button></Col>
                    <Col><button type='button' onClick={() => setOpenActualizarMasivo(true)} className='btn mt-30px w-100 btn-sm btn-warning'>Actualizar masivo</button></Col>
                </Row>
            </Form>

            <span className={styles.tabla_text}>
                <table className="table table-striped table-bordered table-sm mb-1">
                    <thead>
                        <tr>
                            <th className="text-custom-small text-center">Fecha</th>
                            <th className="text-custom-small text-center">Contenedor</th>
                            <th className="text-custom-small text-center">Semana</th>
                            <th className="text-custom-small text-center">Buque</th>
                            <th className="text-custom-small text-center">Destino</th>
                            <th className="text-custom-small text-center">Serial</th>
                            <th className="text-custom-small text-center">Lugar de llenado</th>
                            <th className="text-custom-small text-center">Lecturas</th>
                            <th className="text-custom-small text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((item, index) => (
                            <tr key={item.id_serial_articulo || index}>
                                <td className="text-custom-small text-center">{formatFechaListado(item.fecha_llenado)}</td>
                                <td className="text-custom-small text-center">{item.contenedor_nombre || "-"}</td>
                                <td className="text-custom-small text-center">{getWeekNumber(item.fecha_llenado || item.fecha)}</td>
                                <td className="text-custom-small text-center">{item.buque || "-"}</td>
                                <td className="text-custom-small text-center">{item.destino || "-"}</td>
                                <td className="text-custom-small text-center">{item.serial || "-"}</td>
                                <td className="text-custom-small text-center">{item.lugar_llenado || "-"}</td>
                                <td className="text-custom-small text-center">{item.lecturas || 0}</td>
                                <td className="text-custom-small text-center">
                                    <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() => setGrafica({ id: item.id_serial_articulo, serial: item.serial })}
                                        style={{ border: 'none', background: 'none', padding: '4px 8px' }}
                                        title="Ver gráfica"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M1 14h14v1H1zm1-2h2V7H2zm4 0h2V4H6zm4 0h2V1h-2z" />
                                        </svg>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center text-muted text-custom-small">
                                    No hay registros de temperatura
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </span>

            <div className="d-flex justify-content-center mt-3">
                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>

            {openMasivo && (
                <CargarTemperaturaExcel setOpenMasivo={setOpenMasivo} onSuccess={() => { setPagination(1); listar(); }} />
            )}

            {openActualizarMasivo && (
                <CargueMasivo
                    setOpenMasivo={setOpenActualizarMasivo}
                    endPointCargueMasivo={endPoints.registroTemperatura.actualizarMasivo}
                    encabezados={{ serial: null, fecha: null, hora: null, temperatura: null }}
                    titulo="Actualizar Temperatura"
                    supportPartialResolution={true}
                    onSuccess={() => { setPagination(1); listar(); }}
                />
            )}

            {grafica && (
                <GraficaTemperatura
                    idSerialArticulo={grafica.id}
                    serial={grafica.serial}
                    onClose={() => setGrafica(null)}
                />
            )}
        </>
    );
}
