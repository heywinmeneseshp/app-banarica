import React, { useEffect, useRef, useState } from 'react';

import Tabla from '@components/shared/Tablas/Tabla';
import exportToExcel from '@hooks/useExcel';
import { listarConsumoRutaVehiculo } from '@services/api/consumoRutaVehiculo';
import { paginarProgramaciones } from '@services/api/programaciones';
import { listarRecord_consumo } from '@services/api/record_consumo';
import { consultarTanqueos } from '@services/api/tanqueo';
import Bars from './Bars';
import BarHorizontar from './BarsHorizonal';

const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMonthStart = (dateString) => {
    const [year, month] = dateString.split('-');
    return `${year}-${month}-01`;
};

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value, decimals = 2) => toNumber(value).toFixed(decimals);

const getRouteLabel = (ruta) => {
    const origen = ruta?.ubicacion_1?.ubicacion || ruta?.origen || ruta?.ubicacion1 || 'Origen';
    const destino = ruta?.ubicacion_2?.ubicacion || ruta?.destino || ruta?.ubicacion2 || 'Destino';
    return `${origen} - ${destino}`;
};

export default function Reportes() {
    const today = getToday();
    const formRef = useRef(null);

    const [dataTable, setDataTable] = useState([]);
    const [resTotal, setResTotal] = useState(null);
    const [differenceChart, setDifferenceChart] = useState([]);
    const [dailyChart, setDailyChart] = useState([]);
    const [initialDate, setInitialDate] = useState(getMonthStart(today));
    const [finalDate, setFinalDate] = useState(today);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        listar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const listar = async () => {
        if (!formRef.current) {
            return;
        }

        const formData = new FormData(formRef.current);
        const fechaInicial = formData.get('fecha') || getMonthStart(today);
        const fechaFin = formData.get('fecha_fin') || today;
        const semana = formData.get('semana') || '';
        const vehiculo = formData.get('vehiculo') || '';
        const conductor = formData.get('conductor') || '';
        const movimiento = formData.get('movimiento') || '';

        setInitialDate(fechaInicial);
        setFinalDate(fechaFin);

        try {
            setIsLoading(true);
            setStatusMessage('');

            const [programaciones, configuracionesRuta, tanqueos, recordConsumos] = await Promise.all([
                paginarProgramaciones(1, 1000, {
                    semana,
                    vehiculo,
                    conductor,
                    fecha: fechaInicial,
                    fechaFin,
                    movimiento,
                }),
                listarConsumoRutaVehiculo(),
                consultarTanqueos({
                    fecha: fechaInicial,
                    fechaFin,
                    vehiculo,
                }),
                listarRecord_consumo(),
            ]);

            const rutas = Array.isArray(programaciones?.data) ? programaciones.data : [];
            const consumosRuta = Array.isArray(configuracionesRuta) ? configuracionesRuta : [];
            const cargues = Array.isArray(tanqueos) ? tanqueos : [];
            const records = Array.isArray(recordConsumos) ? recordConsumos : [];

            const resumenVehiculo = {};
            const resumenDiario = {};

            const ensureVehicle = (placa) => {
                if (!resumenVehiculo[placa]) {
                    resumenVehiculo[placa] = {
                        cargado: 0,
                        consumido: 0,
                        movimientosRuta: 0,
                        facturaCount: 0,
                    };
                }

                return resumenVehiculo[placa];
            };

            const vehicleIds = [...new Set([
                ...rutas.map((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '')),
                ...cargues.map((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '')),
            ])].filter(Boolean).sort((a, b) => a.localeCompare(b));

            const rows = [];

            vehicleIds.forEach((vehiculoId) => {
                const routeEntries = rutas
                    .filter((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '') === vehiculoId)
                    .map((item) => {
                        const rutaId = item?.ruta_id || item?.ruta?.id;
                        const consumoAsignado = consumosRuta.find(
                            (consumo) =>
                                String(consumo?.ruta_id || '') === String(rutaId) &&
                                String(consumo?.vehiculo_id || '') === vehiculoId,
                        );

                        return {
                            ...item,
                            rowType: 'route',
                            fecha: String(item?.fecha || '').slice(0, 10),
                            rutaLabel: getRouteLabel(item?.ruta),
                            galones: Number(consumoAsignado?.consumo_por_km || 0),
                            consumoConfigurado: Boolean(consumoAsignado),
                            liquidacionLabel: item?.activo === false ? 'Liquidada' : 'Pendiente',
                        };
                    });

                const loadEntries = cargues
                    .filter((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '') === vehiculoId)
                    .map((item) => ({
                        ...item,
                        rowType: 'load',
                        fecha: String(item?.fecha || '').slice(0, 10),
                        rutaLabel: item?.factura ? `Factura ${item.factura}` : 'Sin factura',
                        movimiento: 'Cargue',
                        galones: Number(item?.tanqueo || 0),
                        liquidacionLabel: item?.record_consumo_id ? 'Liquidada' : 'Pendiente',
                    }));

                const latestLiquidatedRecord = records
                    .filter((item) => String(item?.vehiculo_id || '') === vehiculoId && item?.liquidado)
                    .sort((a, b) => {
                        const dateCompare = String(a?.fecha || '').localeCompare(String(b?.fecha || ''));
                        if (dateCompare !== 0) {
                            return dateCompare;
                        }

                        return Number(a?.id || 0) - Number(b?.id || 0);
                    })
                    .pop();

                const timeline = [...routeEntries, ...loadEntries].sort((a, b) => {
                    const dateCompare = String(a?.fecha || '').localeCompare(String(b?.fecha || ''));
                    if (dateCompare !== 0) {
                        return dateCompare;
                    }

                    if (a.rowType !== b.rowType) {
                        return a.rowType === 'load' ? -1 : 1;
                    }

                    return Number(a?.id || 0) - Number(b?.id || 0);
                });

                const latestLiquidatedStock = latestLiquidatedRecord
                    ? Number(
                        latestLiquidatedRecord?.stock_real ??
                        latestLiquidatedRecord?.stock_final ??
                        Number.NaN,
                    )
                    : Number.NaN;

                let runningBalance = Number.isNaN(latestLiquidatedStock)
                    ? Number(
                        routeEntries.find((item) => item?.vehiculo?.combustible != null)?.vehiculo?.combustible ||
                        loadEntries.find((item) => item?.vehiculo?.combustible != null)?.vehiculo?.combustible ||
                        0,
                    ) -
                        timeline.reduce(
                            (sum, entry) => sum + (entry.rowType === 'load' ? Number(entry.galones || 0) : -Number(entry.galones || 0)),
                            0,
                        )
                    : latestLiquidatedStock;

                timeline.forEach((entry) => {
                    const saldoAnterior = runningBalance;
                    const variacion = entry.rowType === 'load'
                        ? Number(entry.galones || 0)
                        : -Number(entry.galones || 0);
                    const saldoFinal = saldoAnterior + variacion;
                    runningBalance = saldoFinal;

                    rows.push({
                        ...entry,
                        saldoAnteriorPeriodo: saldoAnterior,
                        saldoFinalPeriodo: saldoFinal,
                    });
                });
            });

            rows.forEach((item) => {
                const placa = item?.vehiculo?.placa || item?.vehiculo_id || 'Sin placa';
                const fecha = String(item?.fecha || '').slice(0, 10) || 'Sin fecha';
                const target = ensureVehicle(placa);

                if (!resumenDiario[fecha]) {
                    resumenDiario[fecha] = { Fecha: fecha, Cargado: 0, Consumido: 0, Recorrido: 0 };
                }

                if (item.rowType === 'load') {
                    target.cargado += toNumber(item.galones);
                    target.facturaCount += item?.factura ? 1 : 0;
                    resumenDiario[fecha].Cargado += toNumber(item.galones);
                    return;
                }

                target.consumido += toNumber(item.galones);
                target.movimientosRuta += 1;
                resumenDiario[fecha].Consumido += toNumber(item.galones);
            });

            const tabla = Object.entries(resumenVehiculo)
                .map(([placa, valores]) => {
                    const diferencia = valores.cargado - valores.consumido;
                    const eficiencia = valores.cargado > 0
                        ? (valores.consumido / valores.cargado) * 100
                        : 0;

                    return {
                        Item: placa,
                        'Cargado combustible': formatNumber(valores.cargado),
                        'Consumo por rutas': formatNumber(valores.consumido),
                        Diferencia: formatNumber(diferencia),
                        'Movimientos ruta': String(valores.movimientosRuta),
                        Facturas: String(valores.facturaCount),
                        'Eficiencia %': formatNumber(eficiencia),
                    };
                })
                .sort(
                    (a, b) =>
                        toNumber(b['Consumo por rutas']) - toNumber(a['Consumo por rutas']),
                );

            const totalCargado = tabla.reduce(
                (acc, item) => acc + toNumber(item['Cargado combustible']),
                0,
            );
            const totalConsumido = tabla.reduce(
                (acc, item) => acc + toNumber(item['Consumo por rutas']),
                0,
            );
            const totalMovimientos = tabla.reduce(
                (acc, item) => acc + toNumber(item['Movimientos ruta']),
                0,
            );
            const totalFacturas = tabla.reduce((acc, item) => acc + toNumber(item.Facturas), 0);
            const diferenciaTotal = totalCargado - totalConsumido;
            const eficienciaTotal = totalCargado > 0 ? (totalConsumido / totalCargado) * 100 : 0;

            const total = {
                Item: 'Total',
                'Cargado combustible': formatNumber(totalCargado),
                'Consumo por rutas': formatNumber(totalConsumido),
                Diferencia: formatNumber(diferenciaTotal),
                'Movimientos ruta': String(totalMovimientos),
                Facturas: String(totalFacturas),
                'Eficiencia %': formatNumber(eficienciaTotal),
            };

            const diario = Object.values(resumenDiario)
                .map((item) => ({
                    ...item,
                    Cargado: toNumber(formatNumber(item.Cargado)),
                    Consumido: toNumber(formatNumber(item.Consumido)),
                    Recorrido: toNumber(formatNumber(item.Cargado - item.Consumido)),
                }))
                .sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

            setDataTable(tabla);
            setResTotal(total);
            setDifferenceChart(tabla);
            setDailyChart(diario);

            if (!tabla.length) {
                setStatusMessage('No hay cargues ni consumos por ruta con los filtros seleccionados.');
            }
        } catch (error) {
            console.error('Error al cargar reporte consolidado:', error);
            setDataTable([]);
            setResTotal(null);
            setDifferenceChart([]);
            setDailyChart([]);
            setStatusMessage('No fue posible cargar el reporte consolidado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (!dataTable.length) {
            return;
        }

        exportToExcel([...dataTable, resTotal], 'ReporteConsumo', 'Reporte combustible y rutas');
    };

    return (
        <>
            <form ref={formRef} style={{ minWidth: '90vw' }} className="container">
                <div className="row g-3">
                    <div className="col-md-2">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                            type="text"
                            id="semana"
                            name="semana"
                            onChange={listar}
                            className="form-control form-control-sm"
                        />
                    </div>

                    <div className="col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
                        <input
                            type="date"
                            id="fecha"
                            name="fecha"
                            onChange={listar}
                            value={initialDate}
                            className="form-control form-control-sm"
                        />
                    </div>

                    <div className="col-md-2">
                        <label htmlFor="fecha_fin" className="form-label mb-1">Fecha final</label>
                        <input
                            type="date"
                            id="fecha_fin"
                            name="fecha_fin"
                            onChange={listar}
                            value={finalDate}
                            className="form-control form-control-sm"
                        />
                    </div>

                    <div className="col-md-2">
                        <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
                        <input
                            type="text"
                            id="vehiculo"
                            name="vehiculo"
                            onChange={listar}
                            className="form-control form-control-sm"
                        />
                    </div>

                    <div className="col-md-2">
                        <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                        <input
                            id="conductor"
                            name="conductor"
                            type="text"
                            className="form-control form-control-sm"
                            onChange={listar}
                        />
                    </div>

                    <div className="col-md-2">
                        <label htmlFor="movimiento" className="form-label mb-1">Movimiento</label>
                        <input
                            id="movimiento"
                            name="movimiento"
                            type="text"
                            className="form-control form-control-sm"
                            onChange={listar}
                        />
                    </div>

                    <div className="col-md-2 d-flex align-items-end">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={handleExport}
                            disabled={!dataTable.length || isLoading}
                        >
                            Exportar
                        </button>
                    </div>
                </div>
            </form>

            <section className="mt-4 container-fluid">
                <div className="row g-3 mb-3">
                    <div className="col-md-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="text-muted small">Combustible cargado</div>
                                <div className="fs-5 fw-bold">
                                    {resTotal ? resTotal['Cargado combustible'] : '0.00'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="text-muted small">Consumo por rutas</div>
                                <div className="fs-5 fw-bold">
                                    {resTotal ? resTotal['Consumo por rutas'] : '0.00'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="text-muted small">Diferencia neta</div>
                                <div className="fs-5 fw-bold">
                                    {resTotal ? resTotal.Diferencia : '0.00'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="text-muted small">Eficiencia total</div>
                                <div className="fs-5 fw-bold">
                                    {resTotal ? `${resTotal['Eficiencia %']}%` : '0.00%'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {statusMessage && (
                    <div className={`alert ${dataTable.length ? 'alert-warning' : 'alert-info'} py-2`}>
                        {statusMessage}
                    </div>
                )}

                {isLoading ? (
                    <div className="alert alert-secondary py-2">Cargando reporte...</div>
                ) : (
                    <div className="row g-4">
                        <div className="col-xl-8">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Resumen por vehiculo</h5>
                                        <span className="text-muted small">
                                            {dataTable.length} vehiculos
                                        </span>
                                    </div>
                                    <Tabla data={dataTable} total={resTotal} />
                                </div>
                            </div>

                            <div className="card shadow-sm mt-4">
                                <div className="card-body">
                                    <h5 className="mb-3">Diferencia neta por vehiculo</h5>
                                    <div style={{ minHeight: '320px' }}>
                                        {differenceChart.length ? (
                                            <Bars data={differenceChart} />
                                        ) : (
                                            <div className="text-muted small">
                                                No hay datos para graficar diferencias.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="mb-3">Balance diario de cargues y consumo</h5>
                                    <div style={{ minHeight: '520px' }}>
                                        {dailyChart.length ? (
                                            <BarHorizontar data={dailyChart} />
                                        ) : (
                                            <div className="text-muted small">
                                                No hay datos diarios para mostrar.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}
