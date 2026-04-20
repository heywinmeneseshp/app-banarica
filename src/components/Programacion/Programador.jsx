import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import { paginarProgramaciones, eliminarProgramaciones, agregarProgramaciones, actualizarProgramaciones } from '@services/api/programaciones';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { listarEmbarques } from '@services/api/embarques';
import useAlert from '@hooks/useAlert';
import { buscarRutaPost } from '@services/api/rutas';
import { Button, Form } from 'react-bootstrap';

const MOVIMIENTOS = ['Local', 'Puerto', 'Contenedor', 'Transitorio', 'Otro'];
const COLUMN_STORAGE_KEY = 'programadorColumnConfig';
const COLUMN_OPTIONS = [
  { id: 'fecha', label: 'Fecha' },
  { id: 'semana', label: 'Sem' },
  { id: 'vehiculo', label: 'Vehiculo' },
  { id: 'bl', label: 'BL' },
  { id: 'conductor', label: 'Conductor' },
  { id: 'origen', label: 'Origen' },
  { id: 'llegada_origen', label: 'Llegada origen' },
  { id: 'salida_origen', label: 'Salida origen' },
  { id: 'destino', label: 'Destino' },
  { id: 'llegada_destino', label: 'Llegada destino' },
  { id: 'salida_destino', label: 'Salida destino' },
  { id: 'movimiento', label: 'Movimiento' },
  { id: 'contenedor', label: 'Contenedor' },
  { id: 'eliminar', label: 'Eliminar' },
];
const DEFAULT_VISIBLE_COLUMNS = COLUMN_OPTIONS.reduce((acc, column) => {
  acc[column.id] = true;
  return acc;
}, {});

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const getRowValue = (row, aliases) => {
  const normalizedEntries = Object.entries(row || {}).map(([key, value]) => [normalizeValue(key), value]);
  for (const alias of aliases) {
    const found = normalizedEntries.find(([key]) => key === normalizeValue(alias));
    if (found) {
      return found[1];
    }
  }
  return '';
};

const formatDateCell = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return '';
    }
    const month = String(parsed.m).padStart(2, '0');
    const day = String(parsed.d).padStart(2, '0');
    return `${parsed.y}-${month}-${day}`;
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

const formatTimeCell = (value) => {
  if (!value && value !== 0) {
    return '';
  }

  if (typeof value === 'number') {
    const totalSeconds = Math.round(value * 24 * 60 * 60);
    const hours = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const text = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(text)) {
    return text;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    return text.slice(0, 5);
  }

  return '';
};

export default function Programador() {
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [itemList, setItemsList] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [semanas, setSemanas] = useState([]);
  const [embarques, setEmbarques] = useState([]);
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();
  const formRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedConfig = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!savedConfig) {
      setShowColumnConfig(true);
      return;
    }

    try {
      setVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(savedConfig) });
    } catch {
      setShowColumnConfig(true);
    }
  }, []);

  useEffect(() => {
    listar();
  }, [pagination, reloadKey, alert]);

  const listar = async () => {
    try {
      setLoading(true);
      const formData = new FormData(formRef.current);
      const body = {
        ubicacion1: formData.get('origen') || '',
        ubicacion2: formData.get('destino') || '',
        semana: formData.get('semana') || '',
        bl: formData.get('bl') || '',
        vehiculo: formData.get('vehiculo') || '',
        conductor: formData.get('conductor') || '',
        fecha: formData.get('fecha') || '',
        movimiento: formData.get('movimiento') || '',
      };

      const fechaFin = formData.get('fecha_fin');
      if (fechaFin) {
        body.fechaFin = fechaFin;
      }

      const [newUbicaciones, newConductores, newVehiculos, newSemanas, newEmbarques, res] = await Promise.all([
        listarUbicaciones(),
        listarConductores(),
        listarVehiculo(),
        filtrarSemanaRangoMes(1, 1),
        listarEmbarques(),
        paginarProgramaciones(pagination, limit, body),
      ]);

      setUbicaciones(newUbicaciones || []);
      setConductores(newConductores || []);
      setVehiculos(newVehiculos || []);
      setSemanas(newSemanas || []);
      setEmbarques(newEmbarques || []);
      setItemsList(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible cargar el programador.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    return itemList.map((item) => ({
      ...item,
      origen: item?.ruta?.ubicacion_1?.ubicacion || '',
      origenId: item?.ruta?.ubicacion_1?.id || '',
      destino: item?.ruta?.ubicacion_2?.ubicacion || '',
      destinoId: item?.ruta?.ubicacion_2?.id || '',
      conductorLabel: item?.conductor?.conductor || '',
      vehiculoLabel: item?.vehiculo?.placa || '',
      contenedorLabel: item?.contenedor || '',
      semanaLabel: item?.semana || '',
      blLabel: item?.bl || '',
    }));
  }, [itemList]);

  const descargarExcel = async () => {
    try {
      const formData = new FormData(formRef.current);
      const body = {
        ubicacion1: formData.get('origen') || '',
        ubicacion2: formData.get('destino') || '',
        semana: formData.get('semana') || '',
        bl: formData.get('bl') || '',
        vehiculo: formData.get('vehiculo') || '',
        conductor: formData.get('conductor') || '',
        fecha: formData.get('fecha') || '',
        movimiento: formData.get('movimiento') || '',
      };
      const fechaFin = formData.get('fecha_fin');
      if (fechaFin) {
        body.fechaFin = fechaFin;
      }

      const { data } = await paginarProgramaciones('', '', body);
      const exportRows = (data || []).map((item) => ({
        Fecha: item?.fecha || '',
        Semana: item?.semana || '',
        Vehiculo: item?.vehiculo?.placa || '',
        Conductor: item?.conductor?.conductor || '',
        BL: item?.bl || '',
        Origen: item?.ruta?.ubicacion_1?.ubicacion || '',
        Destino: item?.ruta?.ubicacion_2?.ubicacion || '',
        Movimiento: item?.movimiento || '',
        Contenedor: item?.contenedor || '',
        'Llegada origen': item?.llegada_origen || '',
        'Salida origen': item?.salida_origen || '',
        'Llegada destino': item?.llegada_destino || '',
        'Salida destino': item?.salida_destino || '',
        Observaciones: item?.detalles || '',
      }));

      const book = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(book, sheet, 'Programador');
      XLSX.writeFile(book, 'Programador.xlsx');
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible descargar el Excel.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const descargarPlantilla = () => {
    const sampleRows = [{
      Fecha: '2026-04-19',
      Semana: '16',
      Vehiculo: 'PRE-000',
      Conductor: 'Conductor predeterminado',
      BL: '',
      Origen: 'Ubicacion 2',
      Destino: 'Predeterminado',
      Movimiento: 'Contenedor',
      Contenedor: 'MSCU1234567',
      'Llegada origen': '08:00',
      'Salida origen': '08:30',
      'Llegada destino': '10:00',
      'Salida destino': '10:30',
      Observaciones: '',
    }];

    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(book, sheet, 'Plantilla');
    XLSX.writeFile(book, 'Plantilla programador.xlsx');
  };

  const eliminar = async (id) => {
    try {
      await eliminarProgramaciones(id);
      setReloadKey((prev) => prev + 1);
      setAlert({
        active: true,
        mensaje: 'El movimiento fue eliminado.',
        color: 'success',
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible eliminar el movimiento.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const ensureRoute = async (origenId, destinoId) => {
    const route = await buscarRutaPost({ ubicacion1: origenId, ubicacion2: destinoId });
    return route?.data?.id;
  };

  const saveColumnConfig = (nextConfig) => {
    setVisibleColumns(nextConfig);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(nextConfig));
    }
    setShowColumnConfig(false);
  };

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const updateLocalRow = (id, updater) => {
    setItemsList((prev) => prev.map((row) => (
      row.id === id ? updater(row) : row
    )));
  };

  const handleCellEdit = async (id, field, value) => {
    try {
      updateLocalRow(id, (row) => ({ ...row, [field]: value }));
      await actualizarProgramaciones(id, { [field]: value });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el movimiento.',
        color: 'danger',
        autoClose: true,
      });
      setReloadKey((prev) => prev + 1);
    }
  };

  const handleLookupEdit = async (row, field, value) => {
    try {
      if (field === 'vehiculo_id') {
        const vehiculo = vehiculos.find((item) => String(item.id) === String(value));
        if (!vehiculo) return;
        updateLocalRow(row.id, (current) => ({
          ...current,
          vehiculo_id: vehiculo.id,
          vehiculo: { ...(current.vehiculo || {}), id: vehiculo.id, placa: vehiculo.placa },
        }));
        await actualizarProgramaciones(row.id, { vehiculo_id: vehiculo.id });
        return;
      }

      if (field === 'conductor_id') {
        const conductor = conductores.find((item) => String(item.id) === String(value));
        if (!conductor) return;
        updateLocalRow(row.id, (current) => ({
          ...current,
          conductor_id: conductor.id,
          conductor: { ...(current.conductor || {}), id: conductor.id, conductor: conductor.conductor },
        }));
        await actualizarProgramaciones(row.id, { conductor_id: conductor.id });
        return;
      }

      if (field === 'movimiento') {
        updateLocalRow(row.id, (current) => ({ ...current, movimiento: value }));
        await actualizarProgramaciones(row.id, { movimiento: value });
        return;
      }

      if (field === 'ruta') {
        const origenId = value.origenId ?? row?.ruta?.ubicacion_1?.id;
        const destinoId = value.destinoId ?? row?.ruta?.ubicacion_2?.id;
        if (!origenId || !destinoId || String(origenId) === String(destinoId)) {
          return;
        }
        const rutaId = await ensureRoute(origenId, destinoId);
        const origen = ubicaciones.find((item) => String(item.id) === String(origenId));
        const destino = ubicaciones.find((item) => String(item.id) === String(destinoId));

        updateLocalRow(row.id, (current) => ({
          ...current,
          ruta_id: rutaId,
          ruta: {
            ...(current.ruta || {}),
            id: rutaId,
            ubicacion_1: origen ? { ...origen } : current?.ruta?.ubicacion_1,
            ubicacion_2: destino ? { ...destino } : current?.ruta?.ubicacion_2,
          },
        }));
        await actualizarProgramaciones(row.id, { ruta_id: rutaId });
      }
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el movimiento.',
        color: 'danger',
        autoClose: true,
      });
      setReloadKey((prev) => prev + 1);
    }
  };

  const handleLookupTextEdit = async (row, field, value) => {
    const text = String(value || '').trim();
    if (!text && field === 'bl') {
      await handleCellEdit(row.id, 'bl', '');
      return;
    }
    if (!text) {
      return;
    }

    try {
      if (field === 'semana') {
        const semana = semanas.find((item) => String(item?.consecutivo) === text);
        if (!semana) {
          throw new Error(`La semana "${text}" no existe.`);
        }
        await handleCellEdit(row.id, 'semana', semana.consecutivo);
        return;
      }

      if (field === 'vehiculo') {
        const vehiculo = vehiculos.find((item) => normalizeValue(item?.placa) === normalizeValue(text));
        if (!vehiculo) {
          throw new Error(`El vehiculo "${text}" no existe.`);
        }
        await handleLookupEdit(row, 'vehiculo_id', vehiculo.id);
        return;
      }

      if (field === 'conductor') {
        const conductor = conductores.find((item) => normalizeValue(item?.conductor) === normalizeValue(text));
        if (!conductor) {
          throw new Error(`El conductor "${text}" no existe.`);
        }
        await handleLookupEdit(row, 'conductor_id', conductor.id);
        return;
      }

      if (field === 'bl') {
        const bl = embarques.find((item) => normalizeValue(item?.bl) === normalizeValue(text));
        if (!bl) {
          throw new Error(`El BL "${text}" no existe en embarques.`);
        }
        await handleCellEdit(row.id, 'bl', bl.bl);
        return;
      }

      if (field === 'movimiento') {
        const movimiento = MOVIMIENTOS.find((item) => normalizeValue(item) === normalizeValue(text));
        if (!movimiento) {
          throw new Error(`El movimiento "${text}" no existe.`);
        }
        await handleLookupEdit(row, 'movimiento', movimiento);
        return;
      }

      if (field === 'origen' || field === 'destino') {
        const ubicacion = ubicaciones.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(text));
        if (!ubicacion) {
          throw new Error(`La ubicacion "${text}" no existe.`);
        }
        await handleLookupEdit(row, 'ruta', {
          origenId: field === 'origen' ? ubicacion.id : row.destinoId,
          destinoId: field === 'destino' ? ubicacion.id : row.origenId,
        });
      }
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el movimiento.',
        color: 'warning',
        autoClose: true,
      });
      setReloadKey((prev) => prev + 1);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsedRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!parsedRows.length) {
        throw new Error('El archivo no tiene filas para importar.');
      }

      const ubicacionesList = ubicaciones.length ? ubicaciones : await listarUbicaciones();
      const conductoresList = conductores.length ? conductores : await listarConductores();
      const vehiculosList = vehiculos.length ? vehiculos : await listarVehiculo();
      const semanasList = semanas.length ? semanas : await filtrarSemanaRangoMes(1, 1);

      const errors = [];
      let created = 0;

      for (let index = 0; index < parsedRows.length; index += 1) {
        const row = parsedRows[index];
        const fecha = formatDateCell(getRowValue(row, ['Fecha']));
        const semana = String(getRowValue(row, ['Semana'])).trim();
        const vehiculoText = String(getRowValue(row, ['Vehiculo', 'Vehículo', 'Placa'])).trim();
        const conductorText = String(getRowValue(row, ['Conductor'])).trim();
        const blText = String(getRowValue(row, ['BL', 'Bl', 'Bill of Loading'])).trim();
        const origenText = String(getRowValue(row, ['Origen'])).trim();
        const destinoText = String(getRowValue(row, ['Destino'])).trim();
        const movimientoText = String(getRowValue(row, ['Movimiento'])).trim() || 'Local';
        const contenedorText = String(getRowValue(row, ['Contenedor', 'Numero contenedor', 'Número contenedor'])).trim();
        const detallesText = String(getRowValue(row, ['Observaciones', 'Detalle', 'Detalles'])).trim();
        const llegadaOrigen = formatTimeCell(getRowValue(row, ['Llegada origen']));
        const salidaOrigen = formatTimeCell(getRowValue(row, ['Salida origen']));
        const llegadaDestino = formatTimeCell(getRowValue(row, ['Llegada destino']));
        const salidaDestino = formatTimeCell(getRowValue(row, ['Salida destino']));

        if (!fecha || !semana || !vehiculoText || !conductorText || !origenText || !destinoText) {
          errors.push(`Fila ${index + 2}: faltan columnas obligatorias.`);
          continue;
        }

        const semanaExiste = semanasList.find((item) => String(item?.consecutivo) === semana);
        if (!semanaExiste) {
          errors.push(`Fila ${index + 2}: semana "${semana}" no existe en la tabla de semanas.`);
          continue;
        }

        const vehiculo = vehiculosList.find((item) => normalizeValue(item?.placa) === normalizeValue(vehiculoText));
        const conductor = conductoresList.find((item) => normalizeValue(item?.conductor) === normalizeValue(conductorText));
        const origen = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(origenText));
        const destino = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(destinoText));

        if (!vehiculo) {
          errors.push(`Fila ${index + 2}: vehiculo "${vehiculoText}" no encontrado.`);
          continue;
        }
        if (!conductor) {
          errors.push(`Fila ${index + 2}: conductor "${conductorText}" no encontrado.`);
          continue;
        }
        if (!origen) {
          errors.push(`Fila ${index + 2}: origen "${origenText}" no encontrado.`);
          continue;
        }
        if (!destino) {
          errors.push(`Fila ${index + 2}: destino "${destinoText}" no encontrado.`);
          continue;
        }
        if (origen.id === destino.id) {
          errors.push(`Fila ${index + 2}: origen y destino no pueden ser iguales.`);
          continue;
        }

        const movimiento = MOVIMIENTOS.find((item) => normalizeValue(item) === normalizeValue(movimientoText)) || 'Local';
        if (movimiento === 'Contenedor' && !contenedorText) {
          errors.push(`Fila ${index + 2}: el movimiento Contenedor requiere numero de contenedor.`);
          continue;
        }

        try {
          const rutaId = await ensureRoute(origen.id, destino.id);
          await agregarProgramaciones({
            ruta_id: rutaId,
            cobrar: false,
            id_pagador_flete: '',
            activo: true,
            movimiento,
            conductor_id: conductor.id,
            vehiculo_id: vehiculo.id,
            contenedor: contenedorText || null,
            bl: blText || null,
            semana,
            fecha,
            detalles: detallesText,
            llegada_origen: llegadaOrigen,
            salida_origen: salidaOrigen,
            llegada_destino: llegadaDestino,
            salida_destino: salidaDestino,
          });
          created += 1;
        } catch (error) {
          errors.push(`Fila ${index + 2}: ${error.message || 'no se pudo crear la programacion.'}`);
        }
      }

      setReloadKey((prev) => prev + 1);
      setAlert({
        active: true,
        mensaje: errors.length
          ? `Se importaron ${created} filas. ${errors.length} filas quedaron con error.`
          : `Se importaron ${created} filas correctamente.`,
        color: errors.length ? 'warning' : 'success',
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible importar el Excel.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      if (event.target) {
        event.target.value = '';
      }
      setImporting(false);
    }
  };

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div className="container-fluid px-3 px-lg-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Programador</h5>
          </div>

          <div className="card-body">
            <form ref={formRef} className="container-fluid px-0">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="semana" className="form-label mb-1">Semana</label>
                  <input id="semana" name="semana" type="text" onChange={listar} className="form-control form-control-sm" />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
                  <input id="fecha" name="fecha" type="date" onChange={listar} className="form-control form-control-sm" />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="fecha_fin" className="form-label mb-1">Fecha final</label>
                  <input id="fecha_fin" name="fecha_fin" type="date" onChange={listar} className="form-control form-control-sm" />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
                  <input id="vehiculo" name="vehiculo" type="text" onChange={listar} className="form-control form-control-sm" />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="bl" className="form-label mb-1">BL</label>
                  <input id="bl" name="bl" type="text" onChange={listar} className="form-control form-control-sm" />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                  <input id="conductor" name="conductor" type="text" list="conductorItems" onChange={listar} className="form-control form-control-sm" />
                  <datalist id="conductorItems">
                    <option value="" />
                    {conductores.map((item) => (
                      <option key={item.id} value={item.conductor} />
                    ))}
                  </datalist>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="movimiento" className="form-label mb-1">Movimiento</label>
                  <input id="movimiento" name="movimiento" type="text" list="movimientoList" onChange={listar} className="form-control form-control-sm" />
                  <datalist id="movimientoList">
                    <option value="" />
                    {MOVIMIENTOS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="origen" className="form-label mb-1">Origen</label>
                  <select id="origen" name="origen" className="form-select form-select-sm" onChange={listar}>
                    <option value="" />
                    {ubicaciones.map((item) => (
                      <option key={item.id} value={item.id}>{item.ubicacion}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <label htmlFor="destino" className="form-label mb-1">Destino</label>
                  <select id="destino" name="destino" className="form-select form-select-sm" onChange={listar}>
                    <option value="" />
                    {ubicaciones.map((item) => (
                      <option key={item.id} value={item.id}>{item.ubicacion}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setOpen(true)} className="w-100 mt-0 mt-md-4" variant="primary" size="sm">
                    Nuevo movimiento
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setIsEditable((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant={isEditable ? 'success' : 'warning'} size="sm">
                    {isEditable ? 'Edicion activa' : 'Permitir edicion'}
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={descargarExcel} className="w-100 mt-0 mt-md-4" variant="success" size="sm">
                    Descargar Excel
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={descargarPlantilla} className="w-100 mt-0 mt-md-4" variant="outline-secondary" size="sm">
                    Descargar plantilla
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => importRef.current?.click()} className="w-100 mt-0 mt-md-4" variant="outline-primary" size="sm" disabled={importing}>
                    {importing ? 'Importando...' : 'Importar Excel'}
                  </Button>
                  <Form.Control
                    ref={importRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="d-none"
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setShowColumnConfig((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant="outline-dark" size="sm">
                    Configurar columnas
                  </Button>
                </div>
              </div>
            </form>

            {showColumnConfig && (
              <div className="card border-secondary mt-4">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <strong>Columnas visibles</strong>
                  <Button type="button" variant="outline-secondary" size="sm" onClick={() => saveColumnConfig(visibleColumns)}>
                    Guardar
                  </Button>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {COLUMN_OPTIONS.map((column) => (
                      <div className="col-12 col-md-4 col-lg-3" key={column.id}>
                        <Form.Check
                          type="checkbox"
                          id={`column-${column.id}`}
                          label={column.label}
                          checked={Boolean(visibleColumns[column.id])}
                          onChange={() => toggleColumn(column.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="table-responsive mt-4">
              <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
                <thead>
                  <tr>
                    {visibleColumns.fecha && <th>Fecha</th>}
                    {visibleColumns.semana && <th>Sem</th>}
                    {visibleColumns.vehiculo && <th>Vehiculo</th>}
                    {visibleColumns.bl && <th>BL</th>}
                    {visibleColumns.conductor && <th>Conductor</th>}
                    {visibleColumns.origen && <th>Origen</th>}
                    {visibleColumns.llegada_origen && <th>Llegada</th>}
                    {visibleColumns.salida_origen && <th>Salida</th>}
                    {visibleColumns.destino && <th>Destino</th>}
                    {visibleColumns.llegada_destino && <th>Llegada</th>}
                    {visibleColumns.salida_destino && <th>Salida</th>}
                    {visibleColumns.movimiento && <th>Movimiento</th>}
                    {visibleColumns.contenedor && <th>Contenedor</th>}
                    {visibleColumns.eliminar && <th>Eliminar</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      {visibleColumns.fecha && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="date"
                            defaultValue={item.fecha || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'fecha', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.fecha}</div>
                        )}
                      </td>}
                      {visibleColumns.semana && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`semana-${item.id}`}
                              defaultValue={item.semana || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'semana', e.target.value)}
                            />
                            <datalist id={`semana-${item.id}`}>
                              {semanas.map((semana) => (
                                <option key={semana.id || semana.consecutivo} value={semana.consecutivo} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.semanaLabel}</div>
                        )}
                      </td>}
                      {visibleColumns.vehiculo && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`vehiculo-${item.id}`}
                              defaultValue={item.vehiculoLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'vehiculo', e.target.value)}
                            />
                            <datalist id={`vehiculo-${item.id}`}>
                              {vehiculos.map((vehiculo) => (
                                <option key={vehiculo.id} value={vehiculo.placa} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.vehiculoLabel}</div>
                        )}
                      </td>}
                      {visibleColumns.bl && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`bl-${item.id}`}
                              defaultValue={item.blLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'bl', e.target.value)}
                            />
                            <datalist id={`bl-${item.id}`}>
                              {embarques.map((embarque) => (
                                <option key={embarque.id} value={embarque.bl} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.blLabel || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.conductor && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`conductor-${item.id}`}
                              defaultValue={item.conductorLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'conductor', e.target.value)}
                            />
                            <datalist id={`conductor-${item.id}`}>
                              {conductores.map((conductor) => (
                                <option key={conductor.id} value={conductor.conductor} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.conductorLabel}</div>
                        )}
                      </td>}
                      {visibleColumns.origen && <td className="table-success text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`origen-${item.id}`}
                              defaultValue={item.origen || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'origen', e.target.value)}
                            />
                            <datalist id={`origen-${item.id}`}>
                              {ubicaciones.map((ubicacion) => (
                                <option key={ubicacion.id} value={ubicacion.ubicacion} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.origen}</div>
                        )}
                      </td>}
                      {visibleColumns.llegada_origen && <td className="table-success text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="time"
                            defaultValue={item.llegada_origen || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'llegada_origen', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.llegada_origen || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.salida_origen && <td className="table-success text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="time"
                            defaultValue={item.salida_origen || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'salida_origen', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.salida_origen || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.destino && <td className="table-primary text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`destino-${item.id}`}
                              defaultValue={item.destino || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'destino', e.target.value)}
                            />
                            <datalist id={`destino-${item.id}`}>
                              {ubicaciones.map((ubicacion) => (
                                <option key={ubicacion.id} value={ubicacion.ubicacion} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.destino}</div>
                        )}
                      </td>}
                      {visibleColumns.llegada_destino && <td className="table-primary text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="time"
                            defaultValue={item.llegada_destino || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'llegada_destino', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.llegada_destino || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.salida_destino && <td className="table-primary text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="time"
                            defaultValue={item.salida_destino || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'salida_destino', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.salida_destino || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.movimiento && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <>
                            <input
                              list={`movimiento-${item.id}`}
                              defaultValue={item.movimiento || 'Local'}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'movimiento', e.target.value)}
                            />
                            <datalist id={`movimiento-${item.id}`}>
                              {MOVIMIENTOS.map((movimiento) => (
                                <option key={movimiento} value={movimiento} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.movimiento}</div>
                        )}
                      </td>}
                      {visibleColumns.contenedor && <td className="text-center align-middle p-0">
                        {isEditable ? (
                          <input
                            type="text"
                            defaultValue={item.contenedorLabel || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'contenedor', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.contenedorLabel || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.eliminar && <td className="text-center align-middle">
                        <button type="button" className="btn btn-sm btn-danger px-2 py-1" onClick={() => eliminar(item.id)}>
                          X
                        </button>
                      </td>}
                    </tr>
                  ))}

                  {!rows.length && (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 1} className="py-3 text-center">
                        {loading ? 'Cargando...' : 'No hay movimientos para los filtros seleccionados.'}
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

      {open && <FormulariosProgramacion setOpen={setOpen} setAlert={setAlert} />}
    </>
  );
}
