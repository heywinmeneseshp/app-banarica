import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alertas from '@components/shared/Alertas';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import CargueMasivo from '@components/seguridad/Listado/CargueMasivo';
import InsumoConfig from '@components/shared/InsumoConfig';
import { paginarProgramaciones, eliminarProgramaciones, actualizarProgramaciones } from '@services/api/programaciones';
import { agregarProductosViaje, actualizarProductosViaje, eliminarProductosViaje } from '@services/api/productos_viaje';
import { agregarRutas, buscarRutaPost } from '@services/api/rutas';
import useAlert from '@hooks/useAlert';
import ProgramadorColumnModal from './ProgramadorColumnModal';
import ProgramadorPendingSyncModal from './ProgramadorPendingSyncModal';
import ProgramadorEvidenceModal from './ProgramadorEvidenceModal';
import ProgramadorSerialesModal from './ProgramadorSerialesModal';
import ProgramadorFilters from './ProgramadorFilters';
import ProgramadorTable from './ProgramadorTable';
import { useProgramadorCatalogos } from './hooks/useProgramadorCatalogos';
import { useListadoSync } from './hooks/useListadoSync';
import { useProgramadorImport } from './hooks/useProgramadorImport';
import { useEvidencias } from './hooks/useEvidencias';
import {
  PAGE_LIMIT,
  COLUMN_STORAGE_KEY,
  COLUMN_OPTIONS,
  DEFAULT_VISIBLE_COLUMNS,
  INSUMOS_PROGRAMADOR_MODULE_PREFIX,
  ESTADO_LISTADO_PENDIENTE,
  ESTADO_LISTADO_ACTUALIZADO,
  normalizeValue,
  getTransportadoraLabel,
  buildFilterBody,
} from './programadorUtils';

export default function Programador() {
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const [distinctContenedores, setDistinctContenedores] = useState(0);
  const [itemList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [masivoMode, setMasivoMode] = useState(null); // null | 'create' | 'update'
  const [isEditable, setIsEditable] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showSerialesModal, setShowSerialesModal] = useState(false);
  const [selectedSerialProgramacion, setSelectedSerialProgramacion] = useState(null);
  const [showInsumoConfig, setShowInsumoConfig] = useState(false);
  const [transportadoraFiltro, setTransportadoraFiltro] = useState('');
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);

  const { alert, setAlert, toogleAlert } = useAlert();
  const formRef = useRef(null);

  // Load saved column config from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedConfig = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!savedConfig) return;
    try {
      setVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(savedConfig) });
    } catch {
      setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    }
  }, []);

  const {
    catalogsReady,
    ubicaciones,
    conductores,
    vehiculos,
    embarques,
    combos,
    tiposMovimiento,
    vehiculosSinCombustible,
    configuracionInsumos,
    evidenciasDriveFolderId,
    isSuperAdmin,
    canActualizarPendientes,
    canEditarProgramador,
    transportadoras,
    currentUsername,
  } = useProgramadorCatalogos({ setAlert });

  // Pagination fetch — runs on page/filter change after catalogs are ready
  const listar = useCallback(async () => {
    if (!formRef.current) return;
    try {
      setLoading(true);
      const superAdmin = isSuperAdmin;

      const transportadoraIdsPermitidas = transportadoras
        .map((item) => item?.id)
        .filter((item) => item !== null && item !== undefined && item !== '');

      const body = buildFilterBody(formRef.current);

      if (transportadoraFiltro && superAdmin) {
        body.transportadoraId = transportadoraFiltro;
      }
      if (!superAdmin) {
        if (transportadoraFiltro) {
          body.transportadoraIds = [transportadoraFiltro];
        } else if (transportadoraIdsPermitidas.length) {
          body.transportadoraIds = transportadoraIdsPermitidas;
        }
      }

      const res = await paginarProgramaciones(pagination, pageLimit, body);
      setItemsList(res?.data || []);
      setTotal(res?.total || 0);
      setDistinctContenedores(res?.distinctContenedores ?? 0);
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
  }, [pagination, setAlert, transportadoraFiltro, transportadoras, isSuperAdmin, pageLimit]);

  useEffect(() => {
    if (!catalogsReady) return;
    listar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, reloadKey, transportadoraFiltro, transportadoras, isSuperAdmin, catalogsReady, pageLimit]);

  // Derived catalog structures
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

  const embarqueMap = useMemo(() => {
    const map = new Map();
    for (const item of embarqueCatalog) {
      if (item.bl) map.set(normalizeValue(item.bl), item);
      if (item.booking) map.set(normalizeValue(item.booking), item);
    }
    return map;
  }, [embarqueCatalog]);

  const combosActivos = useMemo(
    () => (combos || []).filter((item) => item?.isBlock !== true),
    [combos]
  );

  const movimientoOptions = useMemo(
    () => (tiposMovimiento || []).filter((item) => item?.activo !== false),
    [tiposMovimiento]
  );

  const findTipoMovimiento = useCallback((text) => (
    movimientoOptions.find((item) => normalizeValue(item?.movimiento) === normalizeValue(text))
  ), [movimientoOptions]);

  const getComboByText = useCallback((text) => {
    const normalized = normalizeValue(text);
    return (combosActivos || []).find((item) => (
      normalizeValue(item?.nombre) === normalized
      || normalizeValue(item?.consecutivo) === normalized
      || String(item?.id || '') === String(text || '').trim()
    ));
  }, [combosActivos]);

  const getVisibleSerialesProgramador = useCallback((row) => {
    const seriales = Array.isArray(row?.serialesProgramador) ? row.serialesProgramador : [];
    if (!configuracionInsumos.length) return seriales;
    const visibles = new Set(configuracionInsumos.map((item) => String(item?.consecutivo || '')));
    return seriales.filter((item) => {
      const consProducto = item?.serial_articulo?.cons_producto || item?.cons_producto;
      return visibles.has(String(consProducto || ''));
    });
  }, [configuracionInsumos]);

  const formatSerialArticuloLabel = useCallback((row) => (
    getVisibleSerialesProgramador(row)
      .map((item) => item?.serial_articulo?.producto?.name || item?.producto?.name || item?.serial_articulo?.cons_producto || item?.cons_producto)
      .filter(Boolean)
      .join(', ')
  ), [getVisibleSerialesProgramador]);

  const formatSerialLabel = useCallback((row) => (
    getVisibleSerialesProgramador(row)
      .map((item) => item?.serial_articulo?.bag_pack || item?.serial_articulo?.serial || item?.bag_pack || item?.serial)
      .filter(Boolean)
      .join(', ')
  ), [getVisibleSerialesProgramador]);

  // Row data derived from API items + catalog lookups
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
        const embarque = embarqueMap.get(normalizeValue(item?.bl)) || null;
        const key = `${item?.fecha || ''}__${item?.bl || ''}__${item?.contenedor || ''}`;
        const prev = list[index - 1];
        const prevKey = prev ? `${prev?.fecha || ''}__${prev?.bl || ''}__${prev?.contenedor || ''}` : '';
        const productoPrincipal = (item?.productos_viajes || [])[0] || null;
        const comboPrincipal = comboMap.get(String(productoPrincipal?.producto_id || ''));
        const productosViaje = (item?.productos_viajes || []).map((pv) => {
          const combo = comboMap.get(String(pv?.producto_id || ''));
          return { id: pv.id, producto_id: pv.producto_id, cantidad: pv.cantidad, label: combo?.nombre || '', comboId: combo?.id || '' };
        });
        const serialesProgramador = Array.isArray(item?.seriales_programador)
          ? item.seriales_programador.filter((serial) => serial?.activo !== false)
          : [];
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
          transportadoraLabel: getTransportadoraLabel(item?.vehiculo?.transportadora || {}),
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
          productosViaje,
          serialesProgramador,
          evidenciaSubida: Boolean(
            item?.evidencia_cargada
            || item?.evidencia_carpeta_id
            || item?.evidencia_carpeta_url
            || Number(item?.evidencia_total_fotos || 0) > 0
          ),
          estadoListadoLabel: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO
            ? 'Actualizado'
            : 'Pendiente',
        };
      });
  }, [combos, embarqueMap, itemList]);

  const canEditRow = useCallback((row) => {
    if (!isEditable) return false;
    if (normalizeValue(row?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO) return isSuperAdmin;
    return canEditarProgramador || isSuperAdmin;
  }, [canEditarProgramador, isEditable, isSuperAdmin]);

  const canEditTimeColumns = useCallback((row) => {
    if (!isEditable) return false;
    if (!(canEditarProgramador || isSuperAdmin)) return false;
    if (!row?.fecha) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const rowDate = new Date(row.fecha);
    rowDate.setHours(0, 0, 0, 0);
    return rowDate >= yesterday;
  }, [canEditarProgramador, isEditable, isSuperAdmin]);

  // Local row mutation helpers
  const updateLocalRow = useCallback((id, updater) => {
    setItemsList((prev) => prev.map((row) => (row.id === id ? updater(row) : row)));
  }, []);

  const markLocalProgramacionStatus = useCallback((id, estadoListado) => {
    updateLocalRow(id, (row) => ({ ...row, estado_listado: estadoListado }));
  }, [updateLocalRow]);

  const markProgramacionesEstadoListado = useCallback(async (ids = [], estadoListado = ESTADO_LISTADO_ACTUALIZADO) => {
    const uniqueIds = [...new Set((ids || []).map((item) => String(item)).filter(Boolean))];
    if (!uniqueIds.length) return;
    await Promise.all(uniqueIds.map((id) => actualizarProgramaciones(id, { estado_listado: estadoListado })));
    uniqueIds.forEach((id) => markLocalProgramacionStatus(Number(id), estadoListado));
  }, [markLocalProgramacionStatus]);

  const ensureRoute = async (origenId, destinoId, options = {}) => {
    const { vehiculoId = '', allowCreateIfExempt = false, alwaysCreate = false } = options;
    try {
      const route = await buscarRutaPost({ ubicacion1: origenId, ubicacion2: destinoId });
      return route?.data?.id;
    } catch (error) {
      if (alwaysCreate || (allowCreateIfExempt && vehiculosSinCombustible.includes(String(vehiculoId || '')))) {
        const nuevaRuta = await agregarRutas({ ubicacion1: origenId, ubicacion2: destinoId });
        return nuevaRuta?.data?.id;
      }
      throw error;
    }
  };

  // Cell edit handlers
  const handleCellEdit = async (id, field, value, { preserveEstado = false } = {}) => {
    const isEstadoField = field === 'estado_listado';
    try {
      updateLocalRow(id, (row) => ({
        ...row,
        [field]: value,
        ...(preserveEstado || isEstadoField ? {} : { estado_listado: ESTADO_LISTADO_PENDIENTE }),
      }));
      const apiPayload = { [field]: value };
      if (preserveEstado && !isEstadoField) {
        const currentRow = itemList.find((r) => r.id === id);
        if (currentRow?.estado_listado) apiPayload.estado_listado = currentRow.estado_listado;
      }
      await actualizarProgramaciones(id, apiPayload);
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible actualizar el movimiento.', color: 'danger', autoClose: true });
      setReloadKey((prev) => prev + 1);
    }
  };

  const applyProgramacionChanges = async (row, changes) => {
    try {
      updateLocalRow(row.id, (current) => ({ ...current, ...changes, estado_listado: ESTADO_LISTADO_PENDIENTE }));
      await actualizarProgramaciones(row.id, changes);
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible actualizar el movimiento.', color: 'danger', autoClose: true });
      setReloadKey((prev) => prev + 1);
      throw error;
    }
  };

  const applyEmbarqueSelection = async (row, embarque) => {
    if (!embarque?.bl) return;
    const nextChanges = { bl: embarque.bl, semana: embarque.semana || row.semana || '' };
    if (embarque.clienteId) nextChanges.id_pagador_flete = embarque.clienteId;
    await applyProgramacionChanges(row, nextChanges);
  };

  const upsertProductoViaje = async (row, changes = {}, index = 0) => {
    const existing = row?.productos_viajes?.[index];
    if (existing?.id) {
      await actualizarProductosViaje(existing.id, changes);
      await actualizarProgramaciones(row.id, { estado_listado: ESTADO_LISTADO_PENDIENTE });
      markLocalProgramacionStatus(row.id, ESTADO_LISTADO_PENDIENTE);
      return existing.id;
    }
    const created = await agregarProductosViaje({ programacion_id: row.id, unidad_de_medida: '', activo: true, cantidad: 0, ...changes });
    await actualizarProgramaciones(row.id, { estado_listado: ESTADO_LISTADO_PENDIENTE });
    markLocalProgramacionStatus(row.id, ESTADO_LISTADO_PENDIENTE);
    return created?.data?.id || created?.id || '';
  };

  const handleLookupEdit = async (row, field, value) => {
    try {
      if (field === 'vehiculo_id') {
        const vehiculo = vehiculos.find((item) => String(item.id) === String(value));
        if (!vehiculo) return;
        updateLocalRow(row.id, (current) => ({ ...current, vehiculo_id: vehiculo.id, vehiculo: { ...(current.vehiculo || {}), id: vehiculo.id, placa: vehiculo.placa } }));
        await actualizarProgramaciones(row.id, { vehiculo_id: vehiculo.id });
        return;
      }
      if (field === 'conductor_id') {
        const conductor = conductores.find((item) => String(item.id) === String(value));
        if (!conductor) return;
        updateLocalRow(row.id, (current) => ({ ...current, conductor_id: conductor.id, conductor: { ...(current.conductor || {}), id: conductor.id, conductor: conductor.conductor } }));
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
        if (!origenId || !destinoId || String(origenId) === String(destinoId)) return;
        const rutaId = await ensureRoute(origenId, destinoId, { alwaysCreate: true });
        const origen = ubicaciones.find((item) => String(item.id) === String(origenId));
        const destino = ubicaciones.find((item) => String(item.id) === String(destinoId));
        updateLocalRow(row.id, (current) => ({
          ...current,
          ruta_id: rutaId,
          ruta: { ...(current.ruta || {}), id: rutaId, ubicacion_1: origen ? { ...origen } : current?.ruta?.ubicacion_1, ubicacion_2: destino ? { ...destino } : current?.ruta?.ubicacion_2 },
        }));
        await actualizarProgramaciones(row.id, { ruta_id: rutaId });
      }
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible actualizar el movimiento.', color: 'danger', autoClose: true });
      setReloadKey((prev) => prev + 1);
    }
  };

  const handleLookupTextEdit = async (row, field, value) => {
    const text = String(value || '').trim();
    if (!text && field === 'bl') {
      await applyProgramacionChanges(row, { bl: '', id_pagador_flete: '' });
      return;
    }
    if (!text) return;
    try {
      if (field === 'vehiculo') {
        const vehiculo = vehiculos.find((item) => normalizeValue(item?.placa) === normalizeValue(text));
        if (!vehiculo) throw new Error(`El vehiculo "${text}" no existe.`);
        await handleLookupEdit(row, 'vehiculo_id', vehiculo.id);
        return;
      }
      if (field === 'conductor') {
        const conductor = conductores.find((item) => normalizeValue(item?.conductor) === normalizeValue(text));
        if (!conductor) throw new Error(`El conductor "${text}" no existe.`);
        await handleLookupEdit(row, 'conductor_id', conductor.id);
        return;
      }
      if (field === 'bl') {
        const match = embarqueCatalog.find((item) => (
          normalizeValue(item?.bl) === normalizeValue(text)
          || normalizeValue(item?.booking) === normalizeValue(text)
        ));
        if (!match) throw new Error(`El BL o booking "${text}" no existe en embarques.`);
        await applyEmbarqueSelection(row, match);
        return;
      }
      if (field === 'producto') {
        const combo = getComboByText(text);
        if (!combo) throw new Error(`El producto "${text}" no existe.`);
        const productoViajeId = await upsertProductoViaje(row, { producto_id: combo.id });
        updateLocalRow(row.id, (current) => ({
          ...current,
          productos_viajes: current?.productos_viajes?.length
            ? current.productos_viajes.map((pv, i) => (i === 0 ? { ...pv, producto_id: combo.id, id: pv.id || productoViajeId } : pv))
            : [{ id: productoViajeId, producto_id: combo.id, cantidad: Number(current?.cantidadProductosLabel || 0) || 0 }],
        }));
        setReloadKey((prev) => prev + 1);
        return;
      }
      if (field === 'cantidad') {
        const amount = Number(text);
        if (Number.isNaN(amount) || amount < 0) throw new Error('La cantidad debe ser un numero valido.');
        const currentComboId = row?.productos_viajes?.[0]?.producto_id;
        if (!currentComboId) throw new Error('Selecciona primero un producto.');
        const productoViajeId = await upsertProductoViaje(row, { producto_id: currentComboId, cantidad: amount });
        updateLocalRow(row.id, (current) => ({
          ...current,
          productos_viajes: current?.productos_viajes?.length
            ? current.productos_viajes.map((pv, i) => (i === 0 ? { ...pv, cantidad: amount, id: pv.id || productoViajeId } : pv))
            : [{ id: productoViajeId, producto_id: currentComboId, cantidad: amount }],
        }));
        return;
      }
      if (field === 'producto2') {
        const combo = getComboByText(text);
        if (!combo) throw new Error(`El producto "${text}" no existe.`);
        const productoViajeId = await upsertProductoViaje(row, { producto_id: combo.id }, 1);
        updateLocalRow(row.id, (current) => {
          const pvs = current?.productos_viajes?.length ? [...current.productos_viajes] : [current.productos_viajes?.[0]].filter(Boolean);
          if (pvs.length >= 2) pvs[1] = { ...pvs[1], producto_id: combo.id, id: pvs[1].id || productoViajeId };
          else pvs.push({ id: productoViajeId, producto_id: combo.id, cantidad: 0 });
          return { ...current, productos_viajes: pvs };
        });
        setReloadKey((prev) => prev + 1);
        return;
      }
      if (field === 'cantidad2') {
        const amount = Number(text);
        if (Number.isNaN(amount) || amount < 0) throw new Error('La cantidad debe ser un numero valido.');
        const currentComboId = row?.productos_viajes?.[1]?.producto_id;
        if (!currentComboId) throw new Error('Selecciona primero el segundo producto.');
        const productoViajeId = await upsertProductoViaje(row, { producto_id: currentComboId, cantidad: amount }, 1);
        updateLocalRow(row.id, (current) => {
          const pvs = current?.productos_viajes?.length ? [...current.productos_viajes] : [];
          if (pvs.length >= 2) pvs[1] = { ...pvs[1], cantidad: amount, id: pvs[1].id || productoViajeId };
          return { ...current, productos_viajes: pvs };
        });
        return;
      }
      if (field === 'movimiento') {
        const movimiento = findTipoMovimiento(text);
        if (!movimiento) throw new Error(`El movimiento "${text}" no existe.`);
        await handleLookupEdit(row, 'movimiento', movimiento.movimiento);
        return;
      }
      if (field === 'origen' || field === 'destino') {
        const ubicacion = ubicaciones.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(text));
        if (!ubicacion) throw new Error(`La ubicacion "${text}" no existe.`);
        await handleLookupEdit(row, 'ruta', {
          origenId: field === 'origen' ? ubicacion.id : row.origenId,
          destinoId: field === 'destino' ? ubicacion.id : row.destinoId,
        });
      }
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible actualizar el movimiento.', color: 'warning', autoClose: true });
      setReloadKey((prev) => prev + 1);
    }
  };

  const handleEliminarProducto2 = async (row) => {
    try {
      const pv2 = row?.productos_viajes?.[1];
      if (!pv2?.id) return;
      await eliminarProductosViaje(pv2.id);
      updateLocalRow(row.id, (current) => ({
        ...current,
        productos_viajes: (current.productos_viajes || []).filter((_, i) => i !== 1),
      }));
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible eliminar el producto.', color: 'danger', autoClose: true });
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este movimiento? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarProgramaciones(id);
      setReloadKey((prev) => prev + 1);
      setAlert({ active: true, mensaje: 'El movimiento fue eliminado.', color: 'success', autoClose: true });
    } catch (error) {
      setAlert({ active: true, mensaje: error.message || 'No fue posible eliminar el movimiento.', color: 'danger', autoClose: true });
    }
  };

  // Serial modal handlers
  const abrirModalSeriales = (programacion) => {
    setSelectedSerialProgramacion(programacion);
    setShowSerialesModal(true);
  };

  const cerrarModalSeriales = () => {
    setSelectedSerialProgramacion(null);
    setShowSerialesModal(false);
  };

  const handleSerialesSaved = (serialesActualizados = []) => {
    updateLocalRow(selectedSerialProgramacion?.id, (row) => ({
      ...row,
      seriales_programador: Array.isArray(serialesActualizados) ? serialesActualizados : row.seriales_programador,
      serialesProgramador: Array.isArray(serialesActualizados) ? serialesActualizados : row.serialesProgramador,
      estado_listado: ESTADO_LISTADO_PENDIENTE,
    }));
    setReloadKey((prev) => prev + 1);
  };

  // Column config
  const saveColumnConfig = (nextConfig) => {
    setVisibleColumns(nextConfig);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(nextConfig));
    }
  };

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  // Feature hooks
  const { syncingListado, pendingListadoSync, setPendingListadoSync, sincronizarListadoPendiente, descargarNoEncontradosListado, confirmarListadoCoincidencias } = useListadoSync({ setAlert, markProgramacionesEstadoListado });

  const { importing, updatingMass, processProgramacionRows, descargarExcel } = useProgramadorImport({
    vehiculosSinCombustible,
    ensureRoute,
    combos,
    ubicaciones,
    conductores,
    vehiculos,
    embarques,
    tiposMovimiento,
    embarqueMap,
    formRef,
    setAlert,
    setReloadKey,
  });

  const {
    showEvidenciaModal,
    selectedProgramacion,
    uploadingEvidencia,
    evidenciaFiles,
    evidenciaResultados,
    setEvidenciaFiles,
    setEvidenciaResultados,
    cerrarModalEvidencia,
    abrirModalEvidencia,
    handleEvidenciaFilesChange,
    subirEvidenciasProgramacion,
  } = useEvidencias({ evidenciasDriveFolderId, updateLocalRow, setAlert, setReloadKey });

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div
        className="container-fluid px-0"
        style={{ width: '95vw', maxWidth: '95vw', marginLeft: 'calc(50% - 47.5vw)', marginRight: 'calc(50% - 47.5vw)' }}
      >
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Programador</h5>
          </div>

          <div className="card-body">
              <ProgramadorFilters
                formRef={formRef}
                ubicaciones={ubicaciones}
                conductores={conductores}
                movimientoOptions={movimientoOptions}
                transportadoras={transportadoras}
                transportadoraFiltro={transportadoraFiltro}
                setTransportadoraFiltro={setTransportadoraFiltro}
                setPagination={setPagination}
                setReloadKey={setReloadKey}
                setOpen={setOpen}
                canEditarProgramador={canEditarProgramador}
                isSuperAdmin={isSuperAdmin}
                isEditable={isEditable}
                setIsEditable={setIsEditable}
                descargarExcel={descargarExcel}
                syncingListado={syncingListado}
                loading={loading}
                sincronizarListadoPendiente={sincronizarListadoPendiente}
                canActualizarPendientes={canActualizarPendientes}
                showColumnConfig={showColumnConfig}
                setShowColumnConfig={setShowColumnConfig}
                setShowInsumoConfig={setShowInsumoConfig}
                rowCount={distinctContenedores}
                total={total}
                rowsShown={itemList.length}
                pageLimit={pageLimit}
                setPageLimit={setPageLimit}
              />

            <ProgramadorTable
              rows={rows}
              visibleColumns={visibleColumns}
              isEditable={isEditable}
              loading={loading}
              embarqueCatalog={embarqueCatalog}
              ubicaciones={ubicaciones}
              vehiculos={vehiculos}
              conductores={conductores}
              combosActivos={combosActivos}
              movimientoOptions={movimientoOptions}
              formatSerialArticuloLabel={formatSerialArticuloLabel}
              formatSerialLabel={formatSerialLabel}
              isSuperAdmin={isSuperAdmin}
              canEditRow={canEditRow}
              canEditTimeColumns={canEditTimeColumns}
              handleCellEdit={handleCellEdit}
              handleLookupTextEdit={handleLookupTextEdit}
              handleEliminarProducto2={handleEliminarProducto2}
              abrirModalSeriales={abrirModalSeriales}
              abrirModalEvidencia={abrirModalEvidencia}
              eliminar={eliminar}
              pagination={pagination}
              setPagination={setPagination}
              total={total}
            />
          </div>
        </div>
      </div>

      <ProgramadorColumnModal
        show={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onSave={() => { saveColumnConfig(visibleColumns); setShowColumnConfig(false); }}
      />

      {showInsumoConfig && isSuperAdmin && (
        <InsumoConfig
          handleConfig={() => { setShowInsumoConfig(false); setReloadKey((prev) => prev + 1); }}
          modulo_confi={`${INSUMOS_PROGRAMADOR_MODULE_PREFIX}${currentUsername}`}
        />
      )}

      <ProgramadorPendingSyncModal
        show={Boolean(pendingListadoSync)}
        pendingListadoSync={pendingListadoSync}
        onClose={() => setPendingListadoSync(null)}
        onDownloadMissing={descargarNoEncontradosListado}
        onConfirm={confirmarListadoCoincidencias}
        syncingListado={syncingListado}
      />

      <ProgramadorEvidenceModal
        show={showEvidenciaModal}
        selectedProgramacion={selectedProgramacion}
        evidenceResults={evidenciaResultados}
        evidenceFiles={evidenciaFiles}
        uploadingEvidencia={uploadingEvidencia}
        onClose={cerrarModalEvidencia}
        onFilesChange={handleEvidenciaFilesChange}
        onRemoveFile={(idx) => { const newFiles = [...evidenciaFiles]; newFiles.splice(idx, 1); setEvidenciaFiles(newFiles); }}
        onUpload={subirEvidenciasProgramacion}
        onReset={() => { setEvidenciaResultados(null); setEvidenciaFiles([]); }}
      />

      <ProgramadorSerialesModal
        show={showSerialesModal}
        programacion={selectedSerialProgramacion}
        seriales={selectedSerialProgramacion?.serialesProgramador || selectedSerialProgramacion?.seriales_programador || []}
        onClose={cerrarModalSeriales}
        onSaved={handleSerialesSaved}
        setAlert={setAlert}
      />

      {open && (
        <FormulariosProgramacion
          setOpen={setOpen}
          setAlert={setAlert}
          onSaved={() => setReloadKey((prev) => prev + 1)}
          onOpenMassCreate={() => setMasivoMode('create')}
          onOpenMassUpdate={() => setMasivoMode('update')}
          massActionLoading={importing || updatingMass}
        />
      )}

      {masivoMode && (
        <CargueMasivo
          setOpenMasivo={() => setMasivoMode(null)}
          titulo={masivoMode === 'create' ? 'Cargar programaciones' : 'Actualizar programaciones'}
          encabezados={masivoMode === 'create'
            ? {
                Sem: null, Fecha: null, Origen: null, "Destino L": null, Producto: null, Cantidad: null,
                Linea: null, Destino: null, Buque: null, BL: null, Vehiculos: null, Conductor: null,
                "Ingreso origen": null, "Salida origen": null, "Ingreso destino": null,
                Cierre: null, "Salida destino": null, Movimiento: null, Contenedor: null,
              }
            : {
                id: null, Sem: null, Fecha: null, Origen: null, "Destino L": null, Producto: null,
                Cantidad: null, Linea: null, Destino: null, Buque: null, BL: null, Vehiculos: null,
                Conductor: null, "Ingreso origen": null, "Salida origen": null, "Ingreso destino": null,
                Cierre: null, "Salida destino": null, Movimiento: null, Contenedor: null,
              }
          }
          onProcessRows={(parsedRows) => processProgramacionRows(parsedRows, masivoMode)}
        />
      )}
    </>
  );
}
