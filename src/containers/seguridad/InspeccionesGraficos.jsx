import React, { useEffect, useMemo, useState } from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Label,
    LabelList,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { estadisticasInspecciones } from "@services/api/inspecciones";

const DIMENSION_OPTIONS = [
    { id: "destino", label: "Destino" },
    { id: "naviera", label: "Naviera" },
    { id: "cliente", label: "Cliente" },
];

const buildLabel = (row, dimensiones) => (
    dimensiones.map((dim) => row[dim] || "Sin dato").join(" / ") || "Total"
);

// Extrae el numero de semana de un consecutivo tipo "S18-2026" para poder
// ordenar de menor a mayor (S1, S2, ... S52), sin depender del orden del backend.
const numeroDeSemana = (consecutivo) => {
    const match = String(consecutivo || "").match(/(\d+)/);
    return match ? Number(match[1]) : 0;
};

const anioActual = new Date().getFullYear();

export default function InspeccionesGraficos() {
    // Solo se usa para poblar los selectores de año (no se muestra ningun grafico con esto).
    const [porAnio, setPorAnio] = useState([]);

    const [anioSemanal, setAnioSemanal] = useState(String(anioActual));
    const [porSemana, setPorSemana] = useState([]);
    const [cargandoSemana, setCargandoSemana] = useState(false);

    const [dimensionesDesglose, setDimensionesDesglose] = useState(["destino"]);
    const [anioDesglose, setAnioDesglose] = useState(String(anioActual));
    const [desglose, setDesglose] = useState([]);
    const [cargandoDesglose, setCargandoDesglose] = useState(false);

    useEffect(() => {
        let cancelado = false;
        estadisticasInspecciones(["anio"])
            .then((res) => { if (!cancelado) setPorAnio(res?.data || []); })
            .catch(() => { if (!cancelado) setPorAnio([]); });
        return () => { cancelado = true; };
    }, []);

    useEffect(() => {
        let cancelado = false;
        setCargandoSemana(true);
        estadisticasInspecciones(["semana"], anioSemanal || undefined)
            .then((res) => { if (!cancelado) setPorSemana(res?.data || []); })
            .catch(() => { if (!cancelado) setPorSemana([]); })
            .finally(() => { if (!cancelado) setCargandoSemana(false); });
        return () => { cancelado = true; };
    }, [anioSemanal]);

    useEffect(() => {
        if (dimensionesDesglose.length === 0) {
            setDesglose([]);
            return undefined;
        }

        let cancelado = false;
        setCargandoDesglose(true);
        estadisticasInspecciones(dimensionesDesglose, anioDesglose || undefined)
            .then((res) => { if (!cancelado) setDesglose(res?.data || []); })
            .catch(() => { if (!cancelado) setDesglose([]); })
            .finally(() => { if (!cancelado) setCargandoDesglose(false); });
        return () => { cancelado = true; };
    }, [dimensionesDesglose, anioDesglose]);

    const toggleDimension = (dim) => {
        setDimensionesDesglose((prev) => (
            prev.includes(dim) ? prev.filter((item) => item !== dim) : [...prev, dim]
        ));
    };

    const datosDesglose = useMemo(() => (
        desglose
            .map((item) => ({ ...item, etiqueta: buildLabel(item, dimensionesDesglose) }))
            .sort((a, b) => b.exportados - a.exportados)
    ), [desglose, dimensionesDesglose]);

    const aniosDisponibles = useMemo(() => (
        [...new Set([...porAnio.map((item) => item.anio), anioActual])]
            .filter(Boolean)
            .sort((a, b) => b - a)
    ), [porAnio]);

    const totalesSemana = useMemo(() => {
        const exportados = porSemana.reduce((acc, item) => acc + (item.exportados || 0), 0);
        const inspeccionados = porSemana.reduce((acc, item) => acc + (item.inspeccionados || 0), 0);
        const porcentaje = exportados > 0 ? Number(((inspeccionados / exportados) * 100).toFixed(1)) : 0;
        return { exportados, inspeccionados, porcentaje };
    }, [porSemana]);

    const datosPorSemana = useMemo(() => (
        [...porSemana]
            .sort((a, b) => numeroDeSemana(a.semana) - numeroDeSemana(b.semana))
            .map((item) => ({ ...item, etiqueta: item.semana || "Sin semana" }))
    ), [porSemana]);

    return (
        <div className="mt-3">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-dark text-white py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span className="fw-bold">Inspeccionados vs Exportados, semana a semana</span>
                    <div className="d-flex align-items-center gap-2">
                        <label htmlFor="anio-semanal" className="small mb-0">Año:</label>
                        <select
                            id="anio-semanal"
                            className="form-select form-select-sm"
                            style={{ width: 120 }}
                            value={anioSemanal}
                            onChange={(e) => setAnioSemanal(e.target.value)}
                        >
                            {aniosDisponibles.map((anio) => (
                                <option key={anio} value={anio}>{anio}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="card-body">
                    <div className="row g-3 mb-3">
                        <div className="col-6 col-md-4">
                            <div className="border rounded p-3 text-center h-100">
                                <div className="text-muted small">Exportados</div>
                                <div className="fs-4 fw-bold text-primary">{totalesSemana.exportados}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-4">
                            <div className="border rounded p-3 text-center h-100">
                                <div className="text-muted small">Inspeccionados</div>
                                <div className="fs-4 fw-bold text-success">{totalesSemana.inspeccionados}</div>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="border rounded p-3 text-center h-100">
                                <div className="text-muted small">% Inspeccionado</div>
                                <div className="fs-4 fw-bold text-warning">{totalesSemana.porcentaje}%</div>
                            </div>
                        </div>
                    </div>

                    {cargandoSemana ? (
                        <div className="text-center text-muted py-4">Cargando...</div>
                    ) : datosPorSemana.length === 0 ? (
                        <div className="text-center text-muted py-4">No hay datos para el año seleccionado.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={340}>
                            <ComposedChart data={datosPorSemana}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="etiqueta" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="cantidad" allowDecimals={false} />
                                <YAxis yAxisId="porcentaje" orientation="right" domain={[0, 100]}>
                                    <Label value="%" position="insideRight" />
                                </YAxis>
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="cantidad" dataKey="exportados" name="Exportados" fill="#0d6efd" />
                                <Bar yAxisId="cantidad" dataKey="inspeccionados" name="Inspeccionados" fill="#198754" />
                                <Line yAxisId="porcentaje" type="monotone" dataKey="porcentaje" name="% Inspeccionado" stroke="#f0ad4e" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header bg-dark text-white py-2 fw-bold">
                    Desglose de inspeccionados
                </div>
                <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                        <span className="fw-semibold small">Agrupar por:</span>
                        {DIMENSION_OPTIONS.map((opt) => (
                            <div className="form-check form-check-inline" key={opt.id}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`dim-${opt.id}`}
                                    checked={dimensionesDesglose.includes(opt.id)}
                                    onChange={() => toggleDimension(opt.id)}
                                />
                                <label className="form-check-label" htmlFor={`dim-${opt.id}`}>{opt.label}</label>
                            </div>
                        ))}

                        <div className="d-flex align-items-center gap-2 ms-auto">
                            <label htmlFor="anio-desglose" className="small text-muted mb-0">Año:</label>
                            <select
                                id="anio-desglose"
                                className="form-select form-select-sm"
                                style={{ width: 120 }}
                                value={anioDesglose}
                                onChange={(e) => setAnioDesglose(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {aniosDisponibles.map((anio) => (
                                    <option key={anio} value={anio}>{anio}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {dimensionesDesglose.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            Selecciona al menos una dimension (Destino, Naviera o Cliente) para ver el desglose.
                        </div>
                    ) : cargandoDesglose ? (
                        <div className="text-center text-muted py-4">Cargando...</div>
                    ) : datosDesglose.length === 0 ? (
                        <div className="text-center text-muted py-4">No hay datos para mostrar.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(320, datosDesglose.length * 40)}>
                            <ComposedChart data={datosDesglose} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="etiqueta" width={180} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="exportados" name="Exportados" fill="#0d6efd" />
                                <Bar dataKey="inspeccionados" name="Inspeccionados" fill="#198754">
                                    <LabelList dataKey="porcentaje" position="right" formatter={(value) => `${value}%`} />
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
