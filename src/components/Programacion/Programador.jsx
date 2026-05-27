import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import { paginarProgramaciones, eliminarProgramaciones, agregarProgramaciones, actualizarProgramaciones, listarProgramaciones } from '@services/api/programaciones';
import { agregarProductosViaje, actualizarProductosViaje } from '@services/api/productos_viaje';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { paginarEmbarques } from '@services/api/embarques';
import { listarCombos } from '@services/api/combos';
import { listartipoMovimientoVehiculos } from '@services/api/tipoMovimientoVehiculos';
import useAlert from '@hooks/useAlert';
import { agregarRutas, buscarRutaPost } from '@services/api/rutas';
import { encontrarModulo } from '@services/api/configuracion';
import { Button, Form, Modal } from 'react-bootstrap';
const COLUMN_STORAGE_KEY = 'programadorColumnConfig';
const COLUMN_OPTIONS = [
  { id: 'semana', label: 'Sem' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'origen', label: 'Origen' },
  { id: 'destino', label: 'Destino' },
  { id: 'productos', label: 'Producto' },
  { id: 'cantidad_productos', label: 'Cantidad' },
  { id: 'linea', label: 'Linea' },
  { id: 'destino_embarque', label: 'Destino embarque' },
  { id: 'buque', label: 'Buque' },
  { id: 'bl', label: 'BL' },
  { id: 'vehiculo', label: 'Vehiculo' },
  { id: 'conductor', label: 'Conductor' },
  { id: 'llegada_origen', label: 'Ingreso origen' },
  { id: 'salida_origen', label: 'Salida origen' },
  { id: 'llegada_destino', label: 'Ingreso destino' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'salida_destino', label: 'Salida destino' },
  { id: 'movimiento', label: 'Movimiento' },
  { id: 'contenedor', label: 'Contenedor' },
  { id: 'eliminar', label: 'Eliminar' },
];
const DEFAULT_VISIBLE_COLUMNS = COLUMN_OPTIONS.reduce((acc, column) => {
  acc[column.id] = true;
  return acc;
}, {});

const READONLY_PROGRAMADOR_COLUMNS = new Set([
  'semana',
  'linea',
  'destino_embarque',
  'buque',
]);

const parseVehiculosSinCombustible = (configRows) => {
  try {
    const [config = {}] = configRows || [];
    const parsed = JSON.parse(config?.detalles || '{}');
    return Array.isArray(parsed?.vehiculosSinCombustible)
      ? parsed.vehiculosSinCombustible.map((item) => String(item))
      : [];
  } catch (error) {
    console.warn('No se pudo leer la configuracion de Programador_combustible:', error);
    return [];
  }
};

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

const findEmbarqueByReferencia = (catalog = [], reference) => {
  const normalizedReference = normalizeValue(reference);
  if (!normalizedReference) {
    return null;
  }

  return catalog.find((item) => (
    normalizeValue(item?.bl) === normalizedReference
    || normalizeValue(item?.booking) === normalizedReference
  )) || null;
};

const compactCellStyle = {
  whiteSpace: 'nowrap',
  width: '1%',
  padding: '0.3rem 0.4rem',
  fontSize: '0.8rem',
  verticalAlign: 'middle',
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
  const [combos, setCombos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updatingMass, setUpdatingMass] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [openMasivo, setOpenMasivo] = useState(false);
  const [openActualizarMasivo, setOpenActualizarMasivo] = useState(false);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const { alert, setAlert, toogleAlert } = useAlert();
  const formRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedConfig = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!savedConfig) {
      return;
    }

    try {
      setVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(savedConfig) });
    } catch {
      setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    }
  }, []);

  const listar = useCallback(async () => {
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

      const [newUbicaciones, newConductores, newVehiculos, newSemanas, embarquesRes, newCombos, newTiposMovimiento, configProgramador, res] = await Promise.all([
        listarUbicaciones(),
        listarConductores(),
        listarVehiculo(),
        filtrarSemanaRangoMes(1, 1),
        paginarEmbarques(1, 5000, {}),
        listarCombos(),
        listartipoMovimientoVehiculos(),
        encontrarModulo('Programador_combustible'),
        paginarProgramaciones(pagination, limit, body),
      ]);

      setUbicaciones(newUbicaciones || []);
      setConductores(newConductores || []);
      setVehiculos(newVehiculos || []);
      setSemanas(newSemanas || []);
      setEmbarques(embarquesRes?.data || []);
      setCombos(newCombos || []);
      setTiposMovimiento(newTiposMovimiento || []);
      setVehiculosSinCombustible(parseVehiculosSinCombustible(configProgramador));
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
  }, [limit, pagination, setAlert]);

  useEffect(() => {
    listar();
  }, [pagination, reloadKey, alert, listar]);

  const embarqueCatalog = useMemo(() => (
    (embarques || []).map((item) => ({
      raw: item,
      id: item?.id,
      bl: item?.bl || '',
      booking: item?.booking || '',
      semana: item?.semanas?.consecutivo || item?.semana?.consecutivo || '',
      clienteId: String(item?.id_cliente || item?.clientes?.id || item?.cliente?.id || ''),
      clienteLabel: item?.clientes?.cod || item?.cliente?.cod || '',
      lineaLabel: item?.Naviera?.cod || item?.naviera?.cod || item?.Naviera?.navieras || item?.naviera?.navieras || '',
      buqueLabel: item?.Buque?.buque || item?.buque?.buque || '',
      destinoLabel: item?.Destino?.cod || item?.destino?.cod || item?.Destino?.destino || item?.destino?.destino || '',
    }))
  ), [embarques]);

  const combosActivos = useMemo(
    () => (combos || []).filter((item) => item?.isBlock !== true),
    [combos]
  );

  const rows = useMemo(() => {
    const comboMap = new Map((combos || []).map((item) => [String(item?.id || ''), item]));

    return [...itemList]
      .sort((a, b) => {
        const fechaCompare = String(b?.fecha || '').localeCompare(String(a?.fecha || ''));
        if (fechaCompare !== 0) return fechaCompare;

        const blCompare = String(a?.bl || '').localeCompare(String(b?.bl || ''));
        if (blCompare !== 0) return blCompare;

        const contenedorCompare = String(a?.contenedor || '').localeCompare(String(b?.contenedor || ''));
        if (contenedorCompare !== 0) return contenedorCompare;

        return Number(a?.id || 0) - Number(b?.id || 0);
      })
      .map((item, index, list) => {
        const embarque = findEmbarqueByReferencia(embarqueCatalog, item?.bl);
        const key = `${item?.fecha || ''}__${item?.bl || ''}__${item?.contenedor || ''}`;
        const prev = list[index - 1];
        const prevKey = prev ? `${prev?.fecha || ''}__${prev?.bl || ''}__${prev?.contenedor || ''}` : '';
        const productoPrincipal = (item?.productos_viajes || [])[0] || null;
        const comboPrincipal = comboMap.get(String(productoPrincipal?.producto_id || ''));

        return {
          ...item,
          groupKey: key,
          groupStart: key !== prevKey,
          origen: item?.ruta?.ubicacion_1?.ubicacion || '',
          origenId: item?.ruta?.ubicacion_1?.id || '',
          destino: item?.ruta?.ubicacion_2?.ubicacion || '',
          destinoId: item?.ruta?.ubicacion_2?.id || '',
          conductorLabel: item?.conductor?.conductor || '',
          vehiculoLabel: item?.vehiculo?.placa || '',
          contenedorLabel: item?.contenedor || '',
          semanaLabel: item?.semana || '',
          blLabel: item?.bl || '',
          lineaLabel: embarque?.lineaLabel || '',
          buqueLabel: embarque?.buqueLabel || '',
          embarqueDestinoLabel: embarque?.destinoLabel || '',
          embarqueClienteId: embarque?.clienteId || '',
          embarqueClienteLabel: embarque?.clienteLabel || '',
          productoLabel: comboPrincipal?.nombre || '',
          productoComboId: comboPrincipal?.id || '',
          productoClienteId: String(comboPrincipal?.id_cliente || ''),
          productoViajeId: productoPrincipal?.id || '',
          cantidadProductosLabel: productoPrincipal?.cantidad ?? '',
        };
      });
  }, [combos, embarqueCatalog, itemList]);

  const movimientoOptions = useMemo(
    () => (tiposMovimiento || []).filter((item) => item?.activo !== false),
    [tiposMovimiento]
  );

  const findTipoMovimiento = useCallback((text) => (
    movimientoOptions.find((item) => normalizeValue(item?.movimiento) === normalizeValue(text))
  ), [movimientoOptions]);

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
      const exportRows = (data || []).map((item) => {
        const embarque = findEmbarqueByReferencia(embarqueCatalog, item?.bl);
        return {
          Semana: item?.semana || '',
          Fecha: item?.fecha || '',
          Origen: item?.ruta?.ubicacion_1?.ubicacion || '',
          Destino: item?.ruta?.ubicacion_2?.ubicacion || '',
          Producto: combos.find((combo) => String(combo?.id || '') === String(item?.productos_viajes?.[0]?.producto_id || ''))?.nombre || '',
          Cantidad: item?.productos_viajes?.[0]?.cantidad || '',
          Linea: embarque?.lineaLabel || '',
          'Destino embarque': embarque?.destinoLabel || '',
          Buque: embarque?.buqueLabel || '',
          BL: item?.bl || '',
          Vehiculo: item?.vehiculo?.placa || '',
          Conductor: item?.conductor?.conductor || '',
          Movimiento: item?.movimiento || '',
          Contenedor: item?.contenedor || '',
          'Llegada origen': item?.llegada_origen || '',
          'Salida origen': item?.salida_origen || '',
          'Llegada destino': item?.llegada_destino || '',
          Cierre: item?.cierre || '',
          'Salida destino': item?.salida_destino || '',
          Observaciones: item?.detalles || '',
        };
      });

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

  const ensureRoute = async (origenId, destinoId, options = {}) => {
    const { vehiculoId = '', allowCreateIfExempt = false } = options;
    try {
      const route = await buscarRutaPost({ ubicacion1: origenId, ubicacion2: destinoId });
      return route?.data?.id;
    } catch (error) {
      if (allowCreateIfExempt && vehiculosSinCombustible.includes(String(vehiculoId || ''))) {
        const nuevaRuta = await agregarRutas({ ubicacion1: origenId, ubicacion2: destinoId });
        return nuevaRuta?.data?.id;
      }
      throw error;
    }
  };

  const saveColumnConfig = (nextConfig) => {
    setVisibleColumns(nextConfig);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(nextConfig));
    }
  };

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const getComboByText = useCallback((text) => {
    const normalized = normalizeValue(text);
    return (combosActivos || []).find((item) => (
      normalizeValue(item?.nombre) === normalized
      || normalizeValue(item?.consecutivo) === normalized
      || String(item?.id || '') === String(text || '').trim()
    ));
  }, [combosActivos]);

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

  const applyProgramacionChanges = async (row, changes) => {
    try {
      updateLocalRow(row.id, (current) => ({ ...current, ...changes }));
      await actualizarProgramaciones(row.id, changes);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el movimiento.',
        color: 'danger',
        autoClose: true,
      });
      setReloadKey((prev) => prev + 1);
      throw error;
    }
  };

  const applyEmbarqueSelection = async (row, embarque) => {
    if (!embarque?.bl) {
      return;
    }

    const nextChanges = {
      bl: embarque.bl,
      semana: embarque.semana || row.semana || '',
    };

    if (embarque.clienteId) {
      nextChanges.id_pagador_flete = embarque.clienteId;
    }

    await applyProgramacionChanges(row, nextChanges);
  };

  const upsertProductoViaje = async (row, changes = {}) => {
    const existing = row?.productos_viajes?.[0];

    if (existing?.id) {
      await actualizarProductosViaje(existing.id, changes);
      return existing.id;
    }

    const created = await agregarProductosViaje({
      programacion_id: row.id,
      unidad_de_medida: '',
      activo: true,
      cantidad: 0,
      ...changes,
    });

    return created?.id || '';
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
      await applyProgramacionChanges(row, { bl: '', id_pagador_flete: '' });
      return;
    }
    if (!text) {
      return;
    }

    try {
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
        const match = embarqueCatalog.find((item) => (
          normalizeValue(item?.bl) === normalizeValue(text)
          || normalizeValue(item?.booking) === normalizeValue(text)
        ));
        if (!match) {
          throw new Error(`El BL o booking "${text}" no existe en embarques.`);
        }
        await applyEmbarqueSelection(row, match);
        return;
      }

      if (field === 'producto') {
        const combo = getComboByText(text);
        if (!combo) {
          throw new Error(`El producto "${text}" no existe.`);
        }

        const productoViajeId = await upsertProductoViaje(row, { producto_id: combo.id });
        updateLocalRow(row.id, (current) => ({
          ...current,
          productos_viajes: current?.productos_viajes?.length
            ? current.productos_viajes.map((productoViaje, index) => (
              index === 0 ? { ...productoViaje, producto_id: combo.id, id: productoViaje.id || productoViajeId } : productoViaje
            ))
            : [{ id: productoViajeId, producto_id: combo.id, cantidad: Number(current?.cantidadProductosLabel || 0) || 0 }],
        }));
        setReloadKey((prev) => prev + 1);
        return;
      }

      if (field === 'cantidad') {
        const amount = Number(text);
        if (Number.isNaN(amount) || amount < 0) {
          throw new Error('La cantidad debe ser un numero valido.');
        }

        const currentComboId = row?.productos_viajes?.[0]?.producto_id;
        if (!currentComboId) {
          throw new Error('Selecciona primero un producto.');
        }

        const productoViajeId = await upsertProductoViaje(row, {
          producto_id: currentComboId,
          cantidad: amount,
        });
        updateLocalRow(row.id, (current) => ({
          ...current,
          productos_viajes: current?.productos_viajes?.length
            ? current.productos_viajes.map((productoViaje, index) => (
              index === 0 ? { ...productoViaje, cantidad: amount, id: productoViaje.id || productoViajeId } : productoViaje
            ))
            : [{ id: productoViajeId, producto_id: currentComboId, cantidad: amount }],
        }));
        setReloadKey((prev) => prev + 1);
        return;
      }

      if (field === 'movimiento') {
        const movimiento = findTipoMovimiento(text);
        if (!movimiento) {
          throw new Error(`El movimiento "${text}" no existe.`);
        }
        await handleLookupEdit(row, 'movimiento', movimiento.movimiento);
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

  const renderProgramadorHeader = (columnId, label) => (
    <th
      className={`text-custom-small text-center ${READONLY_PROGRAMADOR_COLUMNS.has(columnId) ? 'text-white bg-secondary' : ''}`}
      style={compactCellStyle}
    >
      {label}
    </th>
  );

  const resolveImportPayload = async (row, catalogs) => {
    const { ubicacionesList, conductoresList, vehiculosList, semanasList, tiposMovimientoList } = catalogs;

    const fecha = formatDateCell(getRowValue(row, ['Fecha']));
    const semana = String(getRowValue(row, ['Semana'])).trim();
    const vehiculoText = String(getRowValue(row, ['Vehiculo', 'Vehículo', 'Placa'])).trim();
    const conductorText = String(getRowValue(row, ['Conductor'])).trim();
    const blText = String(getRowValue(row, ['BL', 'Bl', 'Bill of Loading'])).trim();
    const origenText = String(getRowValue(row, ['Origen', 'Ubicacion 1', 'Ubicación 1'])).trim();
    const destinoText = String(getRowValue(row, ['Destino', 'Ubicacion 2', 'Ubicación 2'])).trim();
    const movimientoText = String(getRowValue(row, ['Movimiento'])).trim() || 'Local';
    const contenedorText = String(getRowValue(row, ['Contenedor', 'Numero contenedor', 'Número contenedor'])).trim();
    const detallesText = String(getRowValue(row, ['Observaciones', 'Detalle', 'Detalles'])).trim();
    const llegadaOrigen = formatTimeCell(getRowValue(row, ['Llegada origen']));
    const salidaOrigen = formatTimeCell(getRowValue(row, ['Salida origen']));
    const llegadaDestino = formatTimeCell(getRowValue(row, ['Llegada destino']));
    const cierre = formatTimeCell(getRowValue(row, ['Cierre']));
    const salidaDestino = formatTimeCell(getRowValue(row, ['Salida destino']));
    const idText = String(getRowValue(row, ['Id', 'ID', 'Programacion ID', 'Programación ID'])).trim();

    if (!fecha || !semana || !vehiculoText || !conductorText || !origenText) {
      throw new Error('faltan columnas obligatorias.');
    }

    const semanaExiste = semanasList.find((item) => String(item?.consecutivo) === semana);
    if (!semanaExiste) {
      throw new Error(`semana "${semana}" no existe en la tabla de semanas.`);
    }

    const vehiculo = vehiculosList.find((item) => normalizeValue(item?.placa) === normalizeValue(vehiculoText));
    const conductor = conductoresList.find((item) => normalizeValue(item?.conductor) === normalizeValue(conductorText));
    const origen = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(origenText));
    const destino = destinoText
      ? ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(destinoText))
      : origen;

    if (!vehiculo) throw new Error(`vehiculo "${vehiculoText}" no encontrado.`);
    if (!conductor) throw new Error(`conductor "${conductorText}" no encontrado.`);
    if (!origen) throw new Error(`origen "${origenText}" no encontrado.`);
    if (!destino) throw new Error(`destino "${destinoText}" no encontrado.`);

    const movimiento =
      tiposMovimientoList.find((item) => normalizeValue(item?.movimiento) === normalizeValue(movimientoText))
      || tiposMovimientoList.find((item) => normalizeValue(item?.movimiento) === normalizeValue('Local'));

    if (!movimiento) {
      throw new Error(`el movimiento "${movimientoText || 'Local'}" no existe.`);
    }

    if (movimiento?.requiere_contenedor && !contenedorText) {
      throw new Error(`el movimiento ${movimiento.movimiento} requiere numero de contenedor.`);
    }

    const vehiculoExento = vehiculosSinCombustible.includes(String(vehiculo.id));
    if (!vehiculoExento && String(origen.id) === String(destino.id)) {
      throw new Error('origen y destino no pueden ser iguales.');
    }

    const rutaId = await ensureRoute(origen.id, destino.id, {
      vehiculoId: vehiculo.id,
      allowCreateIfExempt: true,
    });

    return {
      idText,
      match: {
        fecha,
        semana,
        vehiculoId: String(vehiculo.id),
        rutaId: String(rutaId),
        bl: blText,
        movimiento: movimiento.movimiento,
      },
      payload: {
        ruta_id: rutaId,
        cobrar: false,
        id_pagador_flete: '',
        activo: true,
        movimiento: movimiento.movimiento,
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
        cierre,
        salida_destino: salidaDestino,
      },
    };
  };

  const findExistingProgramacion = (existingRows, resolved) => {
    if (resolved.idText) {
      return existingRows.find((item) => String(item?.id || '') === String(resolved.idText));
    }

    return existingRows.find((item) => (
      String(item?.fecha || '') === String(resolved.match.fecha)
      && String(item?.semana || '') === String(resolved.match.semana)
      && String(item?.vehiculo_id || '') === String(resolved.match.vehiculoId)
      && String(item?.ruta_id || '') === String(resolved.match.rutaId)
      && normalizeValue(item?.movimiento) === normalizeValue(resolved.match.movimiento)
      && normalizeValue(item?.bl) === normalizeValue(resolved.match.bl)
    ));
  };

  const processProgramacionRows = async (parsedRows = [], mode = 'create') => {
    const isUpdate = mode === 'update';
    const setBusy = isUpdate ? setUpdatingMass : setImporting;

    try {
      setBusy(true);
      if (!parsedRows.length) {
        throw new Error('El archivo no tiene filas para procesar.');
      }

      const ubicacionesList = ubicaciones.length ? ubicaciones : await listarUbicaciones();
      const conductoresList = conductores.length ? conductores : await listarConductores();
      const vehiculosList = vehiculos.length ? vehiculos : await listarVehiculo();
      const semanasList = semanas.length ? semanas : await filtrarSemanaRangoMes(1, 1);
      const tiposMovimientoList = tiposMovimiento.length ? tiposMovimiento : await listartipoMovimientoVehiculos();
      const existingRows = isUpdate ? await listarProgramaciones() : [];

      let processed = 0;
      const errors = [];

      for (let index = 0; index < parsedRows.length; index += 1) {
        try {
          const resolved = await resolveImportPayload(parsedRows[index], {
            ubicacionesList,
            conductoresList,
            vehiculosList,
            semanasList,
            tiposMovimientoList,
          });

          if (isUpdate) {
            const existing = findExistingProgramacion(existingRows, resolved);
            if (!existing?.id) {
              throw new Error('no se encontro una programacion existente para actualizar.');
            }
            await actualizarProgramaciones(existing.id, resolved.payload);
          } else {
            await agregarProgramaciones(resolved.payload);
          }

          processed += 1;
        } catch (error) {
          errors.push(`Fila ${index + 2}: ${error.message || 'no se pudo procesar.'}`);
        }
      }

      setReloadKey((prev) => prev + 1);
      setAlert({
        active: true,
        mensaje: errors.length
          ? `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas. ${errors.length} filas quedaron con error.`
          : `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas correctamente.`,
        color: errors.length ? 'warning' : 'success',
        autoClose: true,
      });
      return {
        message: errors.length
          ? `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas. ${errors.length} filas quedaron con error.`
          : `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas correctamente.`,
      };
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || `No fue posible ${isUpdate ? 'actualizar' : 'importar'} el Excel.`,
        color: 'danger',
        autoClose: true,
      });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div
        className="container-fluid px-0"
        style={{
          width: '95vw',
          maxWidth: '95vw',
          marginLeft: 'calc(50% - 47.5vw)',
          marginRight: 'calc(50% - 47.5vw)',
        }}
      >
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
                    {movimientoOptions.map((item) => (
                      <option key={item.id || item.movimiento} value={item.movimiento} />
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
                  <Button type="button" onClick={() => setOpenMasivo(true)} className="w-100 mt-0 mt-md-4" variant="outline-primary" size="sm" disabled={importing || updatingMass}>
                    {importing ? 'Cargando...' : 'Cargue masivo'}
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setOpenActualizarMasivo(true)} className="w-100 mt-0 mt-md-4" variant="outline-secondary" size="sm" disabled={importing || updatingMass}>
                    {updatingMass ? 'Actualizando...' : 'Actualizacion masiva'}
                  </Button>
                </div>

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setShowColumnConfig((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant="outline-dark" size="sm">
                    Configurar columnas
                  </Button>
                </div>
              </div>
            </form>

            <div className="table-responsive mt-4" style={{ overflowX: 'auto' }}>
              <table
                className="table table-striped table-bordered table-sm mt-2 text-center align-middle mb-0 programador-table"
                style={{ minWidth: '1600px', tableLayout: 'auto', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
              >
                <thead className="align-middle" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                  <tr>
                    {visibleColumns.semana && renderProgramadorHeader('semana', 'Sem')}
                    {visibleColumns.fecha && renderProgramadorHeader('fecha', 'Fecha')}
                    {visibleColumns.origen && renderProgramadorHeader('origen', 'Origen')}
                    {visibleColumns.destino && renderProgramadorHeader('destino', 'Destino L')}
                    {visibleColumns.productos && renderProgramadorHeader('productos', 'Producto')}
                    {visibleColumns.cantidad_productos && renderProgramadorHeader('cantidad_productos', 'Cantidad')}
                    {visibleColumns.linea && renderProgramadorHeader('linea', 'Linea')}
                    {visibleColumns.destino_embarque && renderProgramadorHeader('destino_embarque', 'Destino')}
                    {visibleColumns.buque && renderProgramadorHeader('buque', 'Buque')}
                    {visibleColumns.bl && renderProgramadorHeader('bl', 'BL')}
                    {visibleColumns.vehiculo && renderProgramadorHeader('vehiculo', 'Vehiculos')}
                    {visibleColumns.conductor && renderProgramadorHeader('conductor', 'Conductor')}
                    {visibleColumns.llegada_origen && renderProgramadorHeader('llegada_origen', 'Ingreso origen')}
                    {visibleColumns.salida_origen && renderProgramadorHeader('salida_origen', 'Salida origen')}
                    {visibleColumns.llegada_destino && renderProgramadorHeader('llegada_destino', 'Ingreso destino')}
                    {visibleColumns.cierre && renderProgramadorHeader('cierre', 'Cierre')}
                    {visibleColumns.salida_destino && renderProgramadorHeader('salida_destino', 'Salida destino')}
                    {visibleColumns.movimiento && renderProgramadorHeader('movimiento', 'Movimiento')}
                    {visibleColumns.contenedor && renderProgramadorHeader('contenedor', 'Contenedor')}
                    {visibleColumns.eliminar && renderProgramadorHeader('eliminar', 'Eliminar')}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={item.id}
                      style={item.groupStart ? { borderTop: '2px solid #356854' } : undefined}
                    >
                      {visibleColumns.semana && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        <div className="py-2 px-1 text-center">{item.semanaLabel}</div>
                      </td>}
                      {visibleColumns.fecha && <td className="text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.origen && <td className="table-success text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.destino && <td className="table-primary text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.productos && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        {isEditable ? (
                          <>
                            <input
                              list={`producto-${item.id}`}
                              defaultValue={item.productoLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'producto', e.target.value)}
                            />
                            <datalist id={`producto-${item.id}`}>
                              {combosActivos.map((combo) => (
                                <option key={combo.id} value={combo.nombre} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.productoLabel || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.cantidad_productos && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        {isEditable ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            defaultValue={item.cantidadProductosLabel || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleLookupTextEdit(item, 'cantidad', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.cantidadProductosLabel || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.linea && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        <div className="py-2 px-1 text-center">{item.lineaLabel || ''}</div>
                      </td>}
                      {visibleColumns.destino_embarque && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        <div className="py-2 px-1 text-center">{item.embarqueDestinoLabel || ''}</div>
                      </td>}
                      {visibleColumns.buque && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        <div className="py-2 px-1 text-center">{item.buqueLabel || ''}</div>
                      </td>}
                      {visibleColumns.bl && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        {isEditable ? (
                          <>
                            <input
                              list={`bl-${item.id}`}
                              defaultValue={item.blLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'bl', e.target.value)}
                            />
                            <datalist id={`bl-${item.id}`}>
                              {embarqueCatalog.flatMap((embarque) => {
                                const options = [];
                                if (embarque.bl) {
                                  options.push(
                                    <option key={`${embarque.id || embarque.bl}-bl`} value={embarque.bl} />
                                  );
                                }
                                if (embarque.booking) {
                                  options.push(
                                    <option key={`${embarque.id || embarque.booking}-booking`} value={embarque.booking} />
                                  );
                                }
                                return options;
                              })}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.blLabel || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.vehiculo && <td className="text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.conductor && <td className="text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.llegada_origen && <td className="table-success text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.salida_origen && <td className="table-success text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.llegada_destino && <td className="table-primary text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.cierre && <td className="table-primary text-center align-middle p-0" style={compactCellStyle}>
                        {isEditable ? (
                          <input
                            type="time"
                            defaultValue={item.cierre || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleCellEdit(item.id, 'cierre', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center">{item.cierre || ''}</div>
                        )}
                      </td>}
                      {visibleColumns.salida_destino && <td className="table-primary text-center align-middle p-0" style={compactCellStyle}>
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
                      {visibleColumns.movimiento && <td className="text-center align-middle p-0" style={compactCellStyle}>
                        {isEditable ? (
                          <>
                            <input
                              list={`movimiento-${item.id}`}
                              defaultValue={item.movimiento || 'Local'}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              onBlur={(e) => handleLookupTextEdit(item, 'movimiento', e.target.value)}
                            />
                            <datalist id={`movimiento-${item.id}`}>
                              {movimientoOptions.map((movimiento) => (
                                <option key={movimiento.id || movimiento.movimiento} value={movimiento.movimiento} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <div className="py-2 px-1 text-center">{item.movimiento}</div>
                        )}
                      </td>}
                      {visibleColumns.contenedor && <td className="text-center align-middle p-0" style={compactCellStyle}>
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

      <Modal show={showColumnConfig} onHide={() => setShowColumnConfig(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Columnas visibles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-2">
            {COLUMN_OPTIONS.map((column) => (
              <div className="col-12 col-md-6" key={column.id}>
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
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={() => setShowColumnConfig(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              saveColumnConfig(visibleColumns);
              setShowColumnConfig(false);
            }}
          >
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {open && (
        <FormulariosProgramacion
          setOpen={setOpen}
          setAlert={setAlert}
          onSaved={() => setReloadKey((prev) => prev + 1)}
          onOpenMassCreate={() => setOpenMasivo(true)}
          onOpenMassUpdate={() => setOpenActualizarMasivo(true)}
          massActionLoading={importing || updatingMass}
        />
      )}

      {openMasivo && (
        <CargueMasivo
          setOpenMasivo={setOpenMasivo}
          titulo="Cargar programaciones"
          encabezados={{
            fecha: null,
            semana: null,
            vehiculo: null,
            conductor: null,
            bl: null,
            origen: null,
            destino: null,
            movimiento: null,
            contenedor: null,
            "llegada origen": null,
            "salida origen": null,
            "llegada destino": null,
            cierre: null,
            "salida destino": null,
            observaciones: null,
          }}
          onProcessRows={(rows) => processProgramacionRows(rows, 'create')}
        />
      )}

      {openActualizarMasivo && (
        <CargueMasivo
          setOpenMasivo={setOpenActualizarMasivo}
          titulo="Actualizar programaciones"
          encabezados={{
            id: null,
            fecha: null,
            semana: null,
            vehiculo: null,
            conductor: null,
            bl: null,
            origen: null,
            destino: null,
            movimiento: null,
            contenedor: null,
            "llegada origen": null,
            "salida origen": null,
            "llegada destino": null,
            cierre: null,
            "salida destino": null,
            observaciones: null,
          }}
          onProcessRows={(rows) => processProgramacionRows(rows, 'update')}
        />
      )}

    </>
  );
}
