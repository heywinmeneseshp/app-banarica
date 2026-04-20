import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Paginacion from '@components/shared/Tablas/Paginacion';
import Alertas from '@assets/Alertas';
import { listarConductores } from '@services/api/conductores';
import { paginarProgramaciones } from '@services/api/programaciones';
import { listarConsumoRutaVehiculo } from '@services/api/consumoRutaVehiculo';
import { consultarTanqueos } from '@services/api/tanqueo';
import { liquidarRutaDia, previewLiquidacionRuta, listarRecord_consumo } from '@services/api/record_consumo';
import useAlert from '@hooks/useAlert';
import { Button } from 'react-bootstrap';

export default function HistoricoConsumoRuta() {
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(100);
  const [itemList, setItemsList] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [consumosRuta, setConsumosRuta] = useState([]);
  const [tanqueos, setTanqueos] = useState([]);
  const [rangoFecha, setRangoFecha] = useState();
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [liquidating, setLiquidating] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(0);
  const [recordConsumos, setRecordConsumos] = useState([]);
  const formRef = useRef();
  const { alert, setAlert, toogleAlert } = useAlert();

  useEffect(() => {
    setRangoFecha({
      inicio: '',
      fin: '',
    });
  }, []);

  useEffect(() => {
    listar();
  }, [pagination]);

  const getRouteLabel = (ruta) => {
    const origen = ruta?.ubicacion_1?.ubicacion || ruta?.origen || ruta?.ubicacion1 || 'Origen';
    const destino = ruta?.ubicacion_2?.ubicacion || ruta?.destino || ruta?.ubicacion2 || 'Destino';
    return `${origen} - ${destino}`;
  };

  const isMovimientoPendiente = (movimiento = {}) => {
    if (typeof movimiento?.activo === 'boolean') {
      return movimiento.activo;
    }

    if (typeof movimiento?.liquidado === 'boolean') {
      return !movimiento.liquidado;
    }

    const estadoLiquidacion = String(
      movimiento?.liquidacion ??
      movimiento?.estadoLiquidacion ??
      movimiento?.estado_liquidacion ??
      ''
    ).trim().toLowerCase();

    if (estadoLiquidacion) {
      return estadoLiquidacion !== 'liquidada';
    }

    return !movimiento?.alreadyLiquidated;
  };

  const vehicleHasPendingMovements = (vehiclePreview = {}) => {
    if (Array.isArray(vehiclePreview?.movimientos) && vehiclePreview.movimientos.length > 0) {
      return vehiclePreview.movimientos.some(isMovimientoPendiente);
    }

    return !vehiclePreview?.alreadyLiquidated;
  };

  const listar = async () => {
    try {
      setPreview(null);
      const formData = new FormData(formRef.current);
      const body = {
        semana: formData.get('semana') || '',
        vehiculo: formData.get('vehiculo') || '',
        conductor: formData.get('conductor') || '',
        fecha: formData.get('fecha') || '',
        movimiento: formData.get('movimiento') || '',
      };

      const fechaFin = formData.get('fecha_fin');
      if (fechaFin) {
        body.fechaFin = fechaFin;
      }

      const [programaciones, conductoresData, consumosData, tanqueosData, recordConsumosData] = await Promise.all([
        paginarProgramaciones(pagination, limit, body),
        listarConductores(),
        listarConsumoRutaVehiculo(),
        consultarTanqueos({
          fecha: body.fecha,
          fechaFin: body.fechaFin || '',
          vehiculo: body.vehiculo,
        }),
        listarRecord_consumo(),
      ]);

      setItemsList(programaciones?.data || []);
      setTotal(programaciones?.total || 0);
      setConductores(conductoresData || []);
      setConsumosRuta(consumosData || []);
      setTanqueos(tanqueosData || []);
      setRecordConsumos(recordConsumosData || []);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible cargar el historico por ruta.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const rows = useMemo(() => {
    const runningBalances = {};
    const getEntryVariation = (entry) => {
      const galones = Number(entry?.galones || 0);
      return entry?.rowType === 'load' ? galones : -galones;
    };
    const isEntryLiquidated = (entry) => (
      entry?.rowType === 'load'
        ? Boolean(entry?.record_consumo_id)
        : entry?.activo === false
    );

    const vehicleIds = [...new Set([
      ...itemList.map((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '')),
      ...tanqueos.map((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '')),
    ])].filter(Boolean).sort((a, b) => a.localeCompare(b));

    const tracedRows = [];

    vehicleIds.forEach((vehiculoId) => {
      const balanceKey = vehiculoId;
      const routeEntries = itemList
        .filter((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '') === vehiculoId)
        .map((item) => {
          const rutaId = item?.ruta_id || item?.ruta?.id;
          const consumoAsignado = consumosRuta.find(
            (consumo) => String(consumo.ruta_id) === String(rutaId) && String(consumo.vehiculo_id) === String(vehiculoId)
          );

          return {
            ...item,
            rowType: 'route',
            sortDate: String(item?.fecha || ''),
            rutaLabel: getRouteLabel(item?.ruta),
            galones: Number(consumoAsignado?.consumo_por_km || 0),
            consumoConfigurado: Boolean(consumoAsignado),
          };
        });

      const loadEntries = tanqueos
        .filter((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '') === vehiculoId)
        .map((item) => ({
          ...item,
          rowType: 'load',
          sortDate: String(item?.fecha || ''),
          fecha: String(item?.fecha || '').slice(0, 10),
          semana: '',
          rutaLabel: item?.factura ? `Factura ${item.factura}` : 'Sin factura',
          movimiento: 'Cargue',
          galones: Number(item?.tanqueo || 0),
          consumoConfigurado: true,
          isSyntheticLoadRow: true,
        }));

      const timeline = [...routeEntries, ...loadEntries].sort((a, b) => {
        const dateCompare = String(a.sortDate || '').localeCompare(String(b.sortDate || ''));
        if (dateCompare !== 0) {
          return dateCompare;
        }

        if (a.rowType !== b.rowType) {
          return a.rowType === 'load' ? -1 : 1;
        }

        return Number(a?.id || 0) - Number(b?.id || 0);
      });

      const vehiculoActual = (
        routeEntries.find((item) => item?.vehiculo?.combustible != null)?.vehiculo ||
        loadEntries.find((item) => item?.vehiculo?.combustible != null)?.vehiculo ||
        null
      );

      const saldoOperativoActual = Number(vehiculoActual?.combustible || 0);
      const latestLiquidatedRecord = recordConsumos
        .filter((item) => String(item?.vehiculo_id || '') === vehiculoId && item?.liquidado)
        .sort((a, b) => {
          const dateCompare = String(a?.fecha || '').localeCompare(String(b?.fecha || ''));
          if (dateCompare !== 0) {
            return dateCompare;
          }
          return Number(a?.id || 0) - Number(b?.id || 0);
        })
        .pop();

      const latestLiquidatedStock = latestLiquidatedRecord
        ? Number(
          latestLiquidatedRecord?.stock_real ??
          latestLiquidatedRecord?.stock_final ??
          Number.NaN
        )
        : Number.NaN;
      const lastLiquidatedIndex = timeline.reduce((lastIndex, entry, index) => (
        isEntryLiquidated(entry) ? index : lastIndex
      ), -1);

      if (lastLiquidatedIndex >= 0 && !Number.isNaN(latestLiquidatedStock)) {
        const liquidatedRows = [];
        let rollingFinal = latestLiquidatedStock;

        for (let index = lastLiquidatedIndex; index >= 0; index -= 1) {
          const entry = timeline[index];
          const variation = getEntryVariation(entry);
          const saldoDespues = rollingFinal;
          const saldoAntes = saldoDespues - variation;
          liquidatedRows.unshift({
            entry,
            saldoAntes,
            saldoDespues,
          });
          rollingFinal = saldoAntes;
        }

        liquidatedRows.forEach(({ entry, saldoAntes, saldoDespues }) => {
          if (entry.rowType === 'load') {
            tracedRows.push({
              ...entry,
              vehiculo_id: vehiculoId,
              vehiculo: entry?.vehiculo || null,
              conductor: null,
              conductor_id: '',
              saldoAnteriorPeriodo: saldoAntes,
              saldoFinalPeriodo: saldoDespues,
              liquidacionLabel: entry?.record_consumo_id ? 'Liquidada' : 'Pendiente',
              estadoLabel: '',
            });
            return;
          }

          tracedRows.push({
            ...entry,
            galonesConsumidos: entry.galones,
            saldoAnteriorPeriodo: saldoAntes,
            saldoFinalPeriodo: saldoDespues,
            liquidacionLabel: entry?.activo === false ? 'Liquidada' : 'Pendiente',
            estadoLabel: entry.consumoConfigurado ? 'OK' : 'Falta config.',
            isSyntheticLoadRow: false,
          });
        });

        runningBalances[balanceKey] = latestLiquidatedStock;

        timeline.slice(lastLiquidatedIndex + 1).forEach((entry) => {
          if (entry.rowType === 'load') {
            const saldoAntes = Number(runningBalances[balanceKey] || 0);
            const saldoDespues = saldoAntes + Number(entry.galones || 0);
            runningBalances[balanceKey] = saldoDespues;

            tracedRows.push({
              ...entry,
              vehiculo_id: vehiculoId,
              vehiculo: entry?.vehiculo || null,
              conductor: null,
              conductor_id: '',
              saldoAnteriorPeriodo: saldoAntes,
              saldoFinalPeriodo: saldoDespues,
              liquidacionLabel: entry?.record_consumo_id ? 'Liquidada' : 'Pendiente',
              estadoLabel: '',
            });

            return;
          }

          const saldoAntes = Number(runningBalances[balanceKey] || 0);
          const saldoDespues = saldoAntes - Number(entry.galones || 0);
          runningBalances[balanceKey] = saldoDespues;

          tracedRows.push({
            ...entry,
            galonesConsumidos: entry.galones,
            saldoAnteriorPeriodo: saldoAntes,
            saldoFinalPeriodo: saldoDespues,
            liquidacionLabel: entry?.activo === false ? 'Liquidada' : 'Pendiente',
            estadoLabel: entry.consumoConfigurado ? 'OK' : 'Falta config.',
            isSyntheticLoadRow: false,
          });
        });
      } else {
        const variacionVisible = timeline.reduce((sum, entry) => sum + getEntryVariation(entry), 0);
        runningBalances[balanceKey] = saldoOperativoActual - variacionVisible;
        timeline.forEach((entry) => {
          if (entry.rowType === 'load') {
            const saldoAntes = Number(runningBalances[balanceKey] || 0);
            const saldoDespues = saldoAntes + Number(entry.galones || 0);
            runningBalances[balanceKey] = saldoDespues;

            tracedRows.push({
              ...entry,
              vehiculo_id: vehiculoId,
              vehiculo: entry?.vehiculo || null,
              conductor: null,
              conductor_id: '',
              saldoAnteriorPeriodo: saldoAntes,
              saldoFinalPeriodo: saldoDespues,
              liquidacionLabel: entry?.record_consumo_id ? 'Liquidada' : 'Pendiente',
              estadoLabel: '',
            });

            return;
          }

          const saldoAntes = Number(runningBalances[balanceKey] || 0);
          const saldoDespues = saldoAntes - Number(entry.galones || 0);
          runningBalances[balanceKey] = saldoDespues;

          tracedRows.push({
            ...entry,
            galonesConsumidos: entry.galones,
            saldoAnteriorPeriodo: saldoAntes,
            saldoFinalPeriodo: saldoDespues,
            liquidacionLabel: entry?.activo === false ? 'Liquidada' : 'Pendiente',
            estadoLabel: entry.consumoConfigurado ? 'OK' : 'Falta config.',
            isSyntheticLoadRow: false,
          });
        });
      }
    });

    return tracedRows.reverse();
  }, [itemList, consumosRuta, tanqueos, recordConsumos]);

  const totalGalones = useMemo(() => {
    return rows
      .filter((item) => item.rowType === 'route')
      .reduce((sum, item) => sum + Number(item.galones || 0), 0);
  }, [rows]);

  const totalCargado = useMemo(() => {
    return rows
      .filter((item) => item.rowType === 'load')
      .reduce((sum, item) => sum + Number(item.galones || 0), 0);
  }, [rows]);

  const currentBalanceByVehicle = useMemo(() => {
    const balances = {};
    rows.forEach((item) => {
      const vehiculoId = String(item?.vehiculo_id || item?.vehiculo?.id || '');
      if (!vehiculoId || balances[vehiculoId] != null) {
        return;
      }

      const combustibleActual = item?.vehiculo?.combustible;
      if (combustibleActual != null && combustibleActual !== '') {
        balances[vehiculoId] = Number(combustibleActual);
      }
    });
    return balances;
  }, [rows]);

  const lastRowIndexByVehicle = useMemo(() => {
    const indexes = {};
    rows.forEach((item, index) => {
      const vehiculoId = String(item?.vehiculo_id || item?.vehiculo?.id || '');
      if (vehiculoId) {
        indexes[vehiculoId] = index;
      }
    });
    return indexes;
  }, [rows]);

  const lastLiquidatedRowIndexByVehicle = useMemo(() => {
    const indexes = {};
    rows.forEach((item, index) => {
      const vehiculoId = String(item?.vehiculo_id || item?.vehiculo?.id || '');
      if (vehiculoId && item.liquidacionLabel === 'Liquidada') {
        indexes[vehiculoId] = index;
      }
    });
    return indexes;
  }, [rows]);

  const getLiquidationFilters = () => {
    const formData = new FormData(formRef.current);
    const fecha = formData.get('fecha') || '';
    const fechaFin = formData.get('fecha_fin') || '';
    const vehiculoTexto = formData.get('vehiculo') || '';

    const vehicleIds = [...new Set(rows.map((item) => String(item?.vehiculo_id || item?.vehiculo?.id || '')))].filter(Boolean);

    return {
      fecha,
      fechaFin,
      vehiculo: vehiculoTexto,
      vehiculo_id: vehicleIds.length === 1 ? vehicleIds[0] : '',
    };
  };

  const handlePreviewLiquidacion = async () => {
    try {
      const body = getLiquidationFilters();
      setPreviewLoading(true);
      const data = await previewLiquidacionRuta(body);
      setPreview(data);
      setExpandedVehicle(0);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible calcular la preliquidacion.',
        color: 'warning',
        autoClose: true,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLiquidar = async (vehiculoId = '', liquidarTodos = false) => {
    if (!preview) {
      return;
    }

    try {
      setLiquidating(true);
      const data = await liquidarRutaDia({
        fecha: preview.fechaInicio,
        fechaFin: preview.fechaFin,
        vehiculo: new FormData(formRef.current).get('vehiculo') || '',
        vehiculo_id: vehiculoId,
        liquidarTodos,
      });
      setPreview(data);
      await listar();
      setAlert({
        active: true,
        mensaje: liquidarTodos
          ? `Se liquidaron todos los vehiculos del rango ${preview.fechaInicio} al ${preview.fechaFin}.`
          : 'Se liquido el vehiculo seleccionado para el rango indicado.',
        color: 'success',
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible liquidar el dia.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setLiquidating(false);
    }
  };

  const descargarExcel = () => {
    const data = rows.map((item) => ({
      Fecha: item.fecha,
      Semana: item.semana,
      Vehiculo: item?.vehiculo?.placa || item.vehiculo_id,
      Conductor: item.isSyntheticLoadRow ? 'N/A' : (item?.conductor?.conductor || item?.conductore?.conductor || item.conductor_id),
      Ruta: item.rutaLabel,
      Movimiento: item.movimiento,
      Galones: Number(item.galones || 0).toFixed(2),
      'Saldo anterior periodo': Number(item.saldoAnteriorPeriodo || 0).toFixed(2),
      'Saldo final periodo': Number(item.saldoFinalPeriodo || 0).toFixed(2),
      Liquidacion: item.liquidacionLabel,
      Estado: item.estadoLabel,
    }));

    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(book, sheet, 'HistoricoRuta');
    XLSX.writeFile(book, 'Historico consumo por ruta.xlsx');
  };

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <div className="container-fluid px-3 px-lg-4">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Historico Ruta Vehiculo</h5>
        </div>
        <div className="card-body">
      <form ref={formRef} className="container-fluid px-0">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="semana" className="form-label mb-1">Semana</label>
            <input
              type="text"
              id="semana"
              name="semana"
              onChange={listar}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              onChange={listar}
              defaultValue={rangoFecha?.inicio}
              placeholder="Sin filtro"
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="fecha_fin" className="form-label mb-1">Fecha final</label>
            <input
              type="date"
              id="fecha_fin"
              name="fecha_fin"
              defaultValue={rangoFecha?.fin}
              onChange={listar}
              placeholder="Sin filtro"
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
            <input
              type="text"
              id="vehiculo"
              name="vehiculo"
              onChange={listar}
              className="form-control form-control-sm"
            />
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="conductor">Conductor</label>
            <input
              id="conductor"
              name="conductor"
              type="text"
              list="conductorItemsRuta"
              className="form-control form-control-sm"
              onChange={listar}
            />
            <datalist id="conductorItemsRuta" name="conductorItemsRuta">
              <option value="" />
              {conductores.map((item, index) => (
                <option key={index} value={item.conductor} />
              ))}
            </datalist>
          </div>

          <div className="col-12 col-md-6 col-lg-2">
            <label htmlFor="movimiento" className="form-label mb-1">Movimiento</label>
            <input
              id="movimiento"
              name="movimiento"
              type="text"
              list="movimientoListRuta"
              className="form-control form-control-sm"
              onChange={listar}
            />
            <datalist id="movimientoListRuta" name="movimientoListRuta">
              <option value="Local" />
              <option value="Puerto" />
              <option value="Contenedor" />
              <option value="Transitorio" />
              <option value="Otro" />
            </datalist>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <Button type="button" onClick={descargarExcel} className="w-100 mt-0 mt-md-4" variant="success" size="sm">
              Descargar Excel
            </Button>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <Button type="button" onClick={handlePreviewLiquidacion} className="w-100 mt-0 mt-md-4" variant="primary" size="sm" disabled={previewLoading}>
              {previewLoading ? 'Calculando...' : 'Revisar pendientes / liquidacion'}
            </Button>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <div className="w-100 mt-0 mt-md-4 p-2 border rounded bg-light text-center">
              <strong>Total galones:</strong> {totalGalones.toFixed(2)}
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-3">
            <div className="w-100 mt-0 mt-md-4 p-2 border rounded bg-light text-center">
              <strong>Total cargado:</strong> {totalCargado.toFixed(2)}
            </div>
          </div>
        </div>
      </form>

      {preview && (
        <div className="card border-primary mt-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <span>Preliquidacion del periodo</span>
            <span>{preview.fechaInicio} al {preview.fechaFin}</span>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="border rounded p-2 h-100 text-center">
                  <strong>Saldo actual total</strong>
                  <div>{Number(preview.totalSaldoActual || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="border rounded p-2 h-100 text-center">
                  <strong>Total cargado</strong>
                  <div>{Number(preview.totalCargado || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="border rounded p-2 h-100 text-center">
                  <strong>Total consumido</strong>
                  <div>{Number(preview.totalConsumido || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="border rounded p-2 h-100 text-center">
                  <strong>Saldo proyectado total</strong>
                  <div>{Number(preview.totalSaldoProyectado || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="alert alert-info text-center" role="alert">
              Puedes revisar y liquidar solo las lineas pendientes. Si no pones rango de fechas, se toman todos los movimientos pendientes del filtro actual.
            </div>

            <div className="d-flex justify-content-end gap-2 mb-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleLiquidar('', true)}
                disabled={
                  liquidating ||
                  !preview.vehicles?.length ||
                  preview.vehicles.every((item) => !vehicleHasPendingMovements(item))
                }
              >
                {liquidating ? 'Liquidando...' : 'Liquidar todos'}
              </Button>
            </div>

            <div className="d-flex flex-column gap-3">
              {preview.vehicles.map((vehiclePreview, index) => {
                const hasPendingMovements = vehicleHasPendingMovements(vehiclePreview);

                return (
                <div className="card border-secondary" key={vehiclePreview.vehiculo?.id || index}>
                  <div className="card-header p-0">
                    <button
                      className={`btn w-100 text-start d-flex justify-content-between align-items-center ${expandedVehicle === index ? 'btn-secondary' : 'btn-outline-secondary'}`}
                      type="button"
                      onClick={() => setExpandedVehicle(expandedVehicle === index ? -1 : index)}
                    >
                      <span>
                      {vehiclePreview.vehiculo?.placa} - Consumo: {Number(vehiclePreview.totalConsumido || 0).toFixed(2)} - Saldo proyectado: {Number(vehiclePreview.saldoProyectado || 0).toFixed(2)}
                      </span>
                      <span>{expandedVehicle === index ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </div>
                  {expandedVehicle === index && (
                    <div className="card-body">
                      <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6 col-lg-3">
                          <div className="border rounded p-2 h-100 text-center">
                            <strong>Saldo actual</strong>
                            <div>{Number(vehiclePreview.saldoActual || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                          <div className="border rounded p-2 h-100 text-center">
                            <strong>Total cargado</strong>
                            <div>{Number(vehiclePreview.totalCargado || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                          <div className="border rounded p-2 h-100 text-center">
                            <strong>Total consumido</strong>
                            <div>{Number(vehiclePreview.totalConsumido || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                          <div className="border rounded p-2 h-100 text-center">
                            <strong>Saldo proyectado</strong>
                            <div>{Number(vehiclePreview.saldoProyectado || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-4">
                        <div className="col-12 col-xl-7">
                          <h6 className="text-center">Rutas del periodo</h6>
                          <div className="table-responsive">
                            <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
                              <thead>
                                <tr>
                                  <th className="text-center align-middle">Fecha</th>
                                  <th className="text-center align-middle">Ruta</th>
                                  <th className="text-center align-middle">Movimiento</th>
                                  <th className="text-center align-middle">Conductor</th>
                                  <th className="text-center align-middle">Galones</th>
                                  <th className="text-center align-middle">Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vehiclePreview.movimientos.map((item) => (
                                  <tr key={item.id}>
                                    <td className="text-center align-middle">{item.fecha}</td>
                                    <td className="text-center align-middle">{item.ruta}</td>
                                    <td className="text-center align-middle">{item.movimiento}</td>
                                    <td className="text-center align-middle">{item.conductor || 'N/A'}</td>
                                    <td className="text-center align-middle">{Number(item.galones_consumidos || 0).toFixed(2)}</td>
                                    <td className="text-center align-middle">{item.configurado ? 'Configurado' : 'Falta configurar'}</td>
                                  </tr>
                                ))}
                                {vehiclePreview.movimientos.length === 0 && (
                                  <tr>
                                    <td colSpan="6" className="text-center align-middle py-3">No hay rutas del periodo.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="col-12 col-xl-5">
                          <h6 className="text-center">Cargues del periodo</h6>
                          <div className="table-responsive">
                            <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
                              <thead>
                                <tr>
                                  <th className="text-center align-middle">Fecha</th>
                                  <th className="text-center align-middle">Factura</th>
                                  <th className="text-center align-middle">Galones</th>
                                  <th className="text-center align-middle">Costo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vehiclePreview.tanqueos.map((item) => (
                                  <tr key={item.id}>
                                    <td className="text-center align-middle">{String(item.fecha).slice(0, 10)}</td>
                                    <td className="text-center align-middle">{item.factura || 'N/A'}</td>
                                    <td className="text-center align-middle">{Number(item.tanqueo || 0).toFixed(2)}</td>
                                    <td className="text-center align-middle">{Number(item.costo || 0).toFixed(2)}</td>
                                  </tr>
                                ))}
                                {vehiclePreview.tanqueos.length === 0 && (
                                  <tr>
                                    <td colSpan="4" className="text-center align-middle py-3">No hay cargues registrados en el periodo.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          type="button"
                          variant={hasPendingMovements ? 'danger' : 'secondary'}
                          onClick={() => handleLiquidar(vehiclePreview.vehiculo?.id, false)}
                          disabled={liquidating || !hasPendingMovements}
                        >
                          {!hasPendingMovements ? 'Vehiculo ya liquidado' : (liquidating ? 'Liquidando...' : 'Liquidar vehiculo')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive mt-4">
        <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
          <thead>
              <tr>
                <th className="text-center">Fecha</th>
                <th className="text-center">Sem</th>
                <th className="text-center">Vehiculo</th>
                <th className="text-center">Conductor</th>
                <th className="text-center">Ruta</th>
                <th className="text-center">Movimiento</th>
                <th className="text-center">Galones</th>
                <th className="text-center">Saldo anterior</th>
                <th className="text-center">Saldo final</th>
                <th className="text-center">Liquidacion</th>
                <th className="text-center">Estado</th>
              </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr
                key={index}
                className={item.isSyntheticLoadRow ? 'table-warning' : undefined}
              >
                {(() => {
                  const vehiculoId = String(item?.vehiculo_id || item?.vehiculo?.id || '');
                  const isCurrentBalanceRow = lastRowIndexByVehicle[vehiculoId] === index;
                  const isLastLiquidatedRow = lastLiquidatedRowIndexByVehicle[vehiculoId] === index;
                  return (
                    <>
                <td className="text-center">{item.fecha}</td>
                <td className="text-center">{item.semana}</td>
                <td className="text-center">{item?.vehiculo?.placa || item.vehiculo_id}</td>
                <td className="text-center">{item.isSyntheticLoadRow ? 'N/A' : (item?.conductor?.conductor || item?.conductore?.conductor || item.conductor_id)}</td>
                <td className="text-center">{item.rutaLabel}</td>
                <td className="text-center">{item.movimiento}</td>
                <td className={`text-center ${item.isSyntheticLoadRow ? 'table-success' : 'table-danger'}`}>
                  {Number(item.galones || 0).toFixed(2)}
                </td>
                <td className="text-center">{Number(item.saldoAnteriorPeriodo || 0).toFixed(2)}</td>
                <td className={`text-center ${
                  isCurrentBalanceRow &&
                  Math.abs(
                    Number(item.saldoFinalPeriodo || 0) -
                    Number(currentBalanceByVehicle[vehiculoId] ?? Number.NaN)
                  ) < 0.0001
                    ? 'table-primary fw-bold'
                    : ''
                }`}>
                  {Number(item.saldoFinalPeriodo || 0).toFixed(2)}
                </td>
                <td className={`text-center ${isLastLiquidatedRow ? 'fw-bold text-decoration-underline' : ''}`}>
                  {item.liquidacionLabel}
                </td>
                <td className="text-center">
                  {item.estadoLabel}
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center py-3">
                  No hay movimientos para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 d-flex justify-content-center">
        <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
      </div>
      </div>
      </div>
      </div>
    </>
  );
}
