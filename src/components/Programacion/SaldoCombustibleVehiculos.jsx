import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Alertas from '@assets/Alertas';
import useAlert from '@hooks/useAlert';
import { encontrarModulo } from '@services/api/configuracion';
import { listarSemanas } from '@services/api/semanas';
import { listarVehiculo } from '@services/api/vehiculos';
import { ajustarSaldoCombustible, cargarCombustible } from '@services/api/tanqueo';
import HistoricoCarguesCombustible from '@components/Programacion/HistoricoCarguesCombustible';

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();

export default function SaldoCombustibleVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [semanas, setSemanas] = useState([]);
  const [semanaActual, setSemanaActual] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeView, setActiveView] = useState('saldo');
  const [massFileName, setMassFileName] = useState('');
  const [massRows, setMassRows] = useState([]);
  const [massLoading, setMassLoading] = useState(false);
  const [form, setForm] = useState({
    semana: '',
    fecha: getToday(),
    galones: '',
    factura: '',
    costo: '',
    observacion: '',
  });
  const [adjustForm, setAdjustForm] = useState({
    fecha: getToday(),
    nuevoSaldo: '',
    observacion: '',
  });
  const [loading, setLoading] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      const [vehiculosData, semanasData, moduloSemana] = await Promise.all([
        listarVehiculo(),
        listarSemanas(),
        encontrarModulo('Semana'),
      ]);
      const semanaActual = moduloSemana?.[0]
        ? `S${moduloSemana[0].semana_actual}-${moduloSemana[0].anho_actual}`
        : '';
      const semanasOrdenadas = [...(semanasData || [])].sort(
        (a, b) => Number(a?.id || 0) - Number(b?.id || 0),
      );
      const currentIndex = semanasOrdenadas.findIndex(
        (item) => String(item?.consecutivo || '') === String(semanaActual),
      );
      const semanasVisibles = currentIndex >= 0
        ? semanasOrdenadas.slice(Math.max(0, currentIndex - 5), currentIndex + 6)
        : semanasOrdenadas.slice(0, 11);

      setVehiculos(vehiculosData || []);
      setSemanas(semanasVisibles);
      setSemanaActual(semanaActual);
      if (!selectedId && vehiculosData?.length) {
        setSelectedId(String(vehiculosData[0].id));
      }
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible cargar los vehiculos.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const vehiculosByPlaca = useMemo(() => {
    const map = new Map();
    vehiculos.forEach((item) => {
      map.set(String(item.placa || '').trim().toUpperCase(), item);
    });
    return map;
  }, [vehiculos]);

  const selectedVehiculo = useMemo(() => {
    return vehiculos.find((item) => String(item.id) === String(selectedId)) || null;
  }, [vehiculos, selectedId]);

  const formatGalones = (value) => Number(value || 0).toFixed(2);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdjustChange = (event) => {
    const { name, value } = event.target;
    setAdjustForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      semana: '',
      fecha: getToday(),
      galones: '',
      factura: '',
      costo: '',
      observacion: '',
    });
  };

  const resetAdjustForm = () => {
    setAdjustForm({
      fecha: getToday(),
      nuevoSaldo: selectedVehiculo ? String(Number(selectedVehiculo.combustible || 0)) : '',
      observacion: '',
    });
  };

  useEffect(() => {
    setAdjustForm((prev) => ({
      ...prev,
      nuevoSaldo: selectedVehiculo ? String(Number(selectedVehiculo.combustible || 0)) : '',
    }));
  }, [selectedVehiculo]);

  const handleCargar = async () => {
    const galonesNumericos = Number(form.galones);

    if (!selectedVehiculo) {
      setAlert({
        active: true,
        mensaje: 'Selecciona un vehiculo.',
        color: 'danger',
        autoClose: true,
      });
      return;
    }

    if (Number.isNaN(galonesNumericos) || galonesNumericos <= 0) {
      setAlert({
        active: true,
        mensaje: 'Ingresa una cantidad valida de galones.',
        color: 'danger',
        autoClose: true,
      });
      return;
    }

    try {
      setLoading(true);

      const result = await cargarCombustible({
        vehiculo_id: selectedVehiculo.id,
        semana: form.semana || null,
        fecha: form.fecha,
        tanqueo: galonesNumericos,
        factura: form.factura || null,
        costo: form.costo || null,
        observacion: form.observacion || null,
        activo: true,
      });

      setAlert({
        active: true,
        mensaje: `Se cargaron ${galonesNumericos.toFixed(2)} galones al vehiculo ${selectedVehiculo.placa}. Nuevo saldo: ${formatGalones(result?.saldo_nuevo || 0)} gal.`,
        color: 'success',
        autoClose: true,
      });
      resetForm();
      await cargarVehiculos();
      setActiveView('historico');
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el saldo de combustible.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAjustarSaldo = async () => {
    const nuevoSaldo = Number(adjustForm.nuevoSaldo);

    if (!selectedVehiculo) {
      setAlert({
        active: true,
        mensaje: 'Selecciona un vehiculo.',
        color: 'danger',
        autoClose: true,
      });
      return;
    }

    if (Number.isNaN(nuevoSaldo) || nuevoSaldo < 0) {
      setAlert({
        active: true,
        mensaje: 'Ingresa un saldo valido mayor o igual a cero.',
        color: 'danger',
        autoClose: true,
      });
      return;
    }

    try {
      setAdjustLoading(true);
      const result = await ajustarSaldoCombustible({
        vehiculo_id: selectedVehiculo.id,
        semana: semanaActual || null,
        fecha: adjustForm.fecha,
        nuevo_saldo: nuevoSaldo,
        observacion: adjustForm.observacion || null,
        activo: true,
      });

      setAlert({
        active: true,
        mensaje: `Se ajusto el saldo del vehiculo ${selectedVehiculo.placa} de ${formatGalones(result?.saldo_anterior || 0)} a ${formatGalones(result?.saldo_nuevo || 0)} gal.`,
        color: 'success',
        autoClose: true,
      });
      await cargarVehiculos();
      resetAdjustForm();
      setActiveView('historico');
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible ajustar el saldo del vehiculo.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleMassFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMassRows([]);
      setMassFileName('');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const parsedRows = rawRows.map((row, index) => {
        const entries = Object.entries(row).reduce((acc, [key, value]) => {
          acc[normalizeHeader(key)] = value;
          return acc;
        }, {});

        return {
          fila: index + 2,
          placa: String(entries.placa || '').trim(),
          semana: String(entries.semana || '').trim(),
          fecha: String(entries.fecha || getToday()).trim() || getToday(),
          galones: entries.galones,
          factura: String(entries.factura || '').trim(),
          costo: entries.costo,
          observacion: String(entries.observacion || '').trim(),
        };
      }).filter((row) => row.placa || row.semana || row.galones || row.factura || row.costo || row.observacion);

      setMassRows(parsedRows);
      setMassFileName(file.name);
      setAlert({
        active: true,
        mensaje: `Se cargaron ${parsedRows.length} filas desde el archivo ${file.name}.`,
        color: 'info',
        autoClose: true,
      });
    } catch (error) {
      setMassRows([]);
      setMassFileName('');
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible leer el archivo de Excel.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const descargarPlantilla = () => {
    const data = [
      {
        placa: 'PRE-000',
        semana: 'S16-2026',
        fecha: getToday(),
        galones: 20,
        factura: 'FAC-001',
        costo: 250000,
        observacion: 'Cargue inicial',
      },
    ];

    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    sheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(book, sheet, 'Cargues');
    XLSX.writeFile(book, 'Plantilla cargues combustible.xlsx');
  };

  const procesarCargueMasivo = async () => {
    if (!massRows.length) {
      setAlert({
        active: true,
        mensaje: 'Primero selecciona un archivo de Excel con cargues.',
        color: 'warning',
        autoClose: true,
      });
      return;
    }

    setMassLoading(true);
    let successCount = 0;
    const errors = [];

    for (const row of massRows) {
      try {
        const vehiculo = vehiculosByPlaca.get(String(row.placa || '').trim().toUpperCase());
        if (!vehiculo) {
          throw new Error(`No existe un vehiculo con la placa ${row.placa}`);
        }

        const galonesNumericos = Number(row.galones);
        if (Number.isNaN(galonesNumericos) || galonesNumericos <= 0) {
          throw new Error('Los galones deben ser mayores a cero');
        }

        await cargarCombustible({
          vehiculo_id: vehiculo.id,
          semana: row.semana || null,
          fecha: row.fecha || getToday(),
          tanqueo: galonesNumericos,
          factura: row.factura || null,
          costo: row.costo === '' ? null : Number(row.costo || 0),
          observacion: row.observacion || null,
          activo: true,
        });

        successCount += 1;
      } catch (error) {
        errors.push(`Fila ${row.fila}: ${error.message}`);
      }
    }

    await cargarVehiculos();

    const message = [
      `Cargues procesados: ${successCount}.`,
      errors.length ? `Errores: ${errors.length}.` : 'Sin errores.',
      errors.length ? errors.slice(0, 5).join(' | ') : '',
    ].filter(Boolean).join(' ');

    setAlert({
      active: true,
      mensaje: message,
      color: errors.length ? 'warning' : 'success',
      autoClose: true,
    });

    if (!errors.length) {
      setMassRows([]);
      setMassFileName('');
      setActiveView('historico');
    }

    setMassLoading(false);
  };

  return (
    <div className="container-fluid px-3 px-lg-4 mt-4">
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${activeView === 'saldo' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveView('saldo')}
            >
              Saldo por vehiculo
            </button>
            <button
              type="button"
              className={`btn ${activeView === 'historico' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveView('historico')}
            >
              Historico de cargues
            </button>
            <button
              type="button"
              className={`btn ${activeView === 'masivo' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setActiveView('masivo')}
            >
              Cargue masivo Excel
            </button>
          </div>
        </div>
      </div>

      {activeView === 'saldo' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-xl-7">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">Saldo de combustible por vehiculo</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="saldo-vehiculo">Vehiculo</label>
                      <select
                        id="saldo-vehiculo"
                        className="form-select"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        <option value="">Seleccione vehiculo</option>
                        {vehiculos.map((vehiculo) => (
                          <option key={vehiculo.id} value={vehiculo.id}>
                            {vehiculo.placa} - {vehiculo.vehiculo || 'Vehiculo'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label" htmlFor="saldo-semana">Semana</label>
                      <select
                        id="saldo-semana"
                        className="form-select"
                        name="semana"
                        value={form.semana}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione una semana</option>
                        {semanas.map((semana) => (
                          <option key={semana.id || semana.consecutivo} value={semana.consecutivo}>
                            {semana.consecutivo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label" htmlFor="saldo-actual">Saldo actual</label>
                      <input
                        id="saldo-actual"
                        className="form-control"
                        value={selectedVehiculo ? formatGalones(selectedVehiculo.combustible) : ''}
                        readOnly
                      />
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label" htmlFor="saldo-fecha">Fecha</label>
                      <input
                        id="saldo-fecha"
                        type="date"
                        className="form-control"
                        name="fecha"
                        value={form.fecha}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="saldo-galones">Galones a cargar</label>
                      <input
                        id="saldo-galones"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        name="galones"
                        value={form.galones}
                        onChange={handleChange}
                        placeholder="Galones"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="saldo-factura">Factura</label>
                      <input
                        id="saldo-factura"
                        type="text"
                        className="form-control"
                        name="factura"
                        value={form.factura}
                        onChange={handleChange}
                        placeholder="Numero de factura"
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="saldo-costo">Costo</label>
                      <input
                        id="saldo-costo"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        name="costo"
                        value={form.costo}
                        onChange={handleChange}
                        placeholder="Costo total"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="saldo-observacion">Observacion</label>
                      <input
                        id="saldo-observacion"
                        type="text"
                        className="form-control"
                        name="observacion"
                        value={form.observacion}
                        onChange={handleChange}
                        placeholder="Detalle del cargue"
                      />
                    </div>
                  </div>

                  <div className="row g-3 align-items-end mt-1">
                    <div className="col-12 col-md-8">
                      <div className="alert alert-info mb-0" role="alert">
                        Cada cargue actualiza el saldo del vehiculo y queda guardado en el historico de cargues.
                      </div>
                    </div>
                    <div className="col-12 col-md-4 d-grid">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleCargar}
                        disabled={loading}
                      >
                        {loading ? 'Guardando...' : 'Cargar combustible'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-5">
              <div className="card shadow-sm mb-3">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">Resumen</h6>
                </div>
                <div className="card-body">
                  <p className="mb-2"><strong>Vehiculo:</strong> {selectedVehiculo?.placa || 'Sin seleccionar'}</p>
                  <p className="mb-2"><strong>Tipo:</strong> {selectedVehiculo?.vehiculo || 'N/A'}</p>
                  <p className="mb-2"><strong>Modelo:</strong> {selectedVehiculo?.modelo || 'N/A'}</p>
                  <p className="mb-0"><strong>Saldo disponible:</strong> {selectedVehiculo ? formatGalones(selectedVehiculo.combustible) : '0.00'} gal</p>
                </div>
              </div>

              <div className="card shadow-sm h-100">
                <div className="card-header bg-warning">
                  <h6 className="mb-0">Ajuste de saldo</h6>
                </div>
                <div className="card-body">
                  <div className="alert alert-warning py-2" role="alert">
                    Usa este ajuste solo para conciliar diferencias entre el saldo actual y el ultimo saldo liquidado. El movimiento queda registrado en el historico.
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="ajuste-fecha">Fecha ajuste</label>
                      <input
                        id="ajuste-fecha"
                        type="date"
                        className="form-control"
                        name="fecha"
                        value={adjustForm.fecha}
                        onChange={handleAdjustChange}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="ajuste-saldo">Nuevo saldo</label>
                      <input
                        id="ajuste-saldo"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        name="nuevoSaldo"
                        value={adjustForm.nuevoSaldo}
                        onChange={handleAdjustChange}
                        placeholder="Saldo real"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="ajuste-observacion">Motivo del ajuste</label>
                      <input
                        id="ajuste-observacion"
                        type="text"
                        className="form-control"
                        name="observacion"
                        value={adjustForm.observacion}
                        onChange={handleAdjustChange}
                        placeholder="Explica la conciliacion realizada"
                      />
                    </div>

                    <div className="col-12 d-grid">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={handleAjustarSaldo}
                        disabled={adjustLoading}
                      >
                        {adjustLoading ? 'Ajustando...' : 'Ajustar saldo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">
              <h6 className="mb-0">Saldos por vehiculo</h6>
            </div>
          <div className="card-body table-responsive">
              <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th className="text-center align-middle">Placa</th>
                    <th className="text-center align-middle">Vehiculo</th>
                    <th className="text-center align-middle">Modelo</th>
                    <th className="text-center align-middle">Combustible actual</th>
                    <th className="text-center align-middle">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((vehiculo) => (
                    <tr key={vehiculo.id}>
                      <td className="text-center align-middle">{vehiculo.placa}</td>
                      <td className="text-center align-middle">{vehiculo.vehiculo}</td>
                      <td className="text-center align-middle">{vehiculo.modelo}</td>
                      <td className="text-center align-middle">{formatGalones(vehiculo.combustible)} gal</td>
                      <td className="text-center align-middle">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedId(String(vehiculo.id))}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vehiculos.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-3 text-center align-middle">
                        No hay vehiculos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'historico' && <HistoricoCarguesCombustible embedded />}

      {activeView === 'masivo' && (
        <div className="card shadow-sm">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Cargue masivo desde Excel</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-lg-8">
                <div className="alert alert-info mb-0" role="alert">
                  El archivo debe tener estas columnas: <strong>placa</strong>, <strong>semana</strong>, <strong>fecha</strong>, <strong>galones</strong>, <strong>factura</strong>, <strong>costo</strong>, <strong>observacion</strong>.
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-2 d-grid">
                <button type="button" className="btn btn-outline-success" onClick={descargarPlantilla}>
                  Descargar plantilla
                </button>
              </div>
              <div className="col-12 col-md-6 col-lg-2 d-grid">
                <button type="button" className="btn btn-success" onClick={procesarCargueMasivo} disabled={massLoading}>
                  {massLoading ? 'Procesando...' : 'Procesar cargues'}
                </button>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="cargue-masivo-archivo">Archivo Excel</label>
                <input
                  id="cargue-masivo-archivo"
                  type="file"
                  className="form-control"
                  accept=".xlsx,.xls"
                  onChange={handleMassFile}
                />
                {massFileName && (
                  <div className="form-text">
                    Archivo cargado: {massFileName}. Filas detectadas: {massRows.length}.
                  </div>
                )}
              </div>
            </div>

            <div className="table-responsive mt-4">
              <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th className="text-center align-middle">Fila</th>
                    <th className="text-center align-middle">Placa</th>
                    <th className="text-center align-middle">Semana</th>
                    <th className="text-center align-middle">Fecha</th>
                    <th className="text-center align-middle">Galones</th>
                    <th className="text-center align-middle">Factura</th>
                    <th className="text-center align-middle">Costo</th>
                    <th className="text-center align-middle">Observacion</th>
                  </tr>
                </thead>
                <tbody>
                  {massRows.map((row) => (
                    <tr key={row.fila}>
                      <td className="text-center align-middle">{row.fila}</td>
                      <td className="text-center align-middle">{row.placa}</td>
                      <td className="text-center align-middle">{row.semana || 'N/A'}</td>
                      <td className="text-center align-middle">{row.fecha}</td>
                      <td className="text-center align-middle">{row.galones}</td>
                      <td className="text-center align-middle">{row.factura || 'N/A'}</td>
                      <td className="text-center align-middle">{row.costo || '0'}</td>
                      <td className="text-center align-middle">{row.observacion || 'N/A'}</td>
                    </tr>
                  ))}
                  {massRows.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-3 text-center align-middle">
                        No hay filas cargadas todavia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
