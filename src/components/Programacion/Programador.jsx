import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import InsumoConfig from '@assets/InsumoConfig';
import { paginarProgramaciones, eliminarProgramaciones, agregarProgramaciones, actualizarProgramaciones, listarProgramaciones } from '@services/api/programaciones';
import { agregarProductosViaje, actualizarProductosViaje } from '@services/api/productos_viaje';
import { actualizarListadoMasivo } from '@services/api/listado';
import { listarAlmacenes } from '@services/api/almacenes';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { listarTransportadoras } from '@services/api/transportadoras';
import { paginarEmbarques } from '@services/api/embarques';
import { listarCombos } from '@services/api/combos';
import { listartipoMovimientoVehiculos } from '@services/api/tipoMovimientoVehiculos';
import useAlert from '@hooks/useAlert';
import { agregarRutas, buscarRutaPost } from '@services/api/rutas';
import { encontrarModulo } from '@services/api/configuracion';
import { Button } from 'react-bootstrap';
import ProgramadorColumnModal from '@components/Programacion/ProgramadorColumnModal';
import ProgramadorPendingSyncModal from '@components/Programacion/ProgramadorPendingSyncModal';
import ProgramadorEvidenceModal from '@components/Programacion/ProgramadorEvidenceModal';
import ProgramadorSerialesModal from '@components/Programacion/ProgramadorSerialesModal';
import { subirEvidencias } from '@services/api/googleDrive';
import { filtrarProductos } from '@services/api/productos';
import { vincularContenedoresProgramacionSeriales } from '@services/api/programacionSeriales';
import { getStoredTransporters } from '@utils/session';
import { FaCamera, FaPlus, FaTrashAlt } from 'react-icons/fa';

const COLUMN_STORAGE_KEY = 'programadorColumnConfig';
const INSUMOS_PROGRAMADOR_MODULE_PREFIX = 'Relacion_programador_';
const DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID = process.env.NEXT_PUBLIC_EVIDENCIAS_DRIVE_FOLDER_ID || '1ZnxhLTlN5WROcl-oozkSJXwjI87aG4bM';
const EVIDENCIAS_DRIVE_MODULE = 'Google_drive_evidencias';
const EVIDENCIA_MAX_FILES = 20;
const EVIDENCIA_MAX_FILE_SIZE = 5 * 1024 * 1024;
const EVIDENCIA_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
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
  { id: 'transportadora', label: 'Transportadora' },
  { id: 'conductor', label: 'Conductor' },
  { id: 'llegada_origen', label: 'Ingreso origen' },
  { id: 'salida_origen', label: 'Salida origen' },
  { id: 'llegada_destino', label: 'Ingreso destino' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'salida_destino', label: 'Salida destino' },
  { id: 'estado_listado', label: 'Estado listado' },
  { id: 'movimiento', label: 'Movimiento' },
  { id: 'contenedor', label: 'Contenedor' },
  { id: 'articulo_serial', label: 'Articulo serial' },
  { id: 'serial', label: 'Serial' },
  { id: 'agregar_serial', label: 'Agregar serial' },
  { id: 'evidencia', label: 'Evidencia' },
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

const parseEvidenciasDriveFolderId = (configRows) => {
  try {
    const [config = {}] = configRows || [];
    const parsed = JSON.parse(config?.detalles || '{}');
    return parsed?.carpetaID || DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID;
  } catch (error) {
    console.warn('No se pudo leer la configuracion de evidencias en Drive:', error);
    return DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID;
  }
};

const parseInsumosConfig = (configRows) => {
  try {
    const rawDetalles = configRows?.[0]?.detalles;
    const detalles = rawDetalles ? JSON.parse(rawDetalles) : {};
    if (Array.isArray(detalles)) {
      return detalles.map((item) => item?.consecutivo || item?.id || item).filter(Boolean);
    }
    if (Array.isArray(detalles?.tags)) {
      return detalles.tags.filter(Boolean);
    }
  } catch (error) {
    console.warn('No fue posible leer la configuracion de insumos del programador:', error);
  }
  return [];
};

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const getTransportadoraLabel = (transportadora = {}) => (
  transportadora?.razon_social
  || transportadora?.nombre
  || transportadora?.consecutivo
  || `Transportadora ${transportadora?.id || ''}`.trim()
);

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

const editableCellStyle = {
  ...compactCellStyle,
  width: 'auto',
  minWidth: '120px',
};

const ESTADO_LISTADO_PENDIENTE = 'pendiente';
const ESTADO_LISTADO_ACTUALIZADO = 'actualizado';

export default function Programador() {
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [itemList, setItemsList] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [embarques, setEmbarques] = useState([]);
  const [combos, setCombos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updatingMass, setUpdatingMass] = useState(false);
  const [syncingListado, setSyncingListado] = useState(false);
  const [pendingListadoSync, setPendingListadoSync] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [openMasivo, setOpenMasivo] = useState(false);
  const [openActualizarMasivo, setOpenActualizarMasivo] = useState(false);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const [canActualizarPendientes, setCanActualizarPendientes] = useState(false);
  const [canEditarProgramador, setCanEditarProgramador] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [evidenciasDriveFolderId, setEvidenciasDriveFolderId] = useState(DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID);
  const [configuracionInsumos, setConfiguracionInsumos] = useState([]);
  const [showSerialesModal, setShowSerialesModal] = useState(false);
  const [selectedSerialProgramacion, setSelectedSerialProgramacion] = useState(null);
  const [showInsumoConfig, setShowInsumoConfig] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [transportadoraFiltro, setTransportadoraFiltro] = useState('');

  // Estados para evidencias
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState(null);
  const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
  const [evidenciaFiles, setEvidenciaFiles] = useState([]);
  const [evidenciaResultados, setEvidenciaResultados] = useState(null);

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
      const usuario = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('usuario') || '{}') : {};
      setCurrentUsername(usuario?.username || '');
      const superAdmin = usuario?.id_rol === 'Super administrador';
      const transportadorasDisponibles = superAdmin
        ? (await listarTransportadoras()) || []
        : getStoredTransporters();
      const transportadoraIdsPermitidas = transportadorasDisponibles
        .map((item) => item?.id)
        .filter((item) => item !== null && item !== undefined && item !== '');
      setTransportadoras(transportadorasDisponibles);
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

      const fechaFin = formData.get('fecha_fin');
      if (fechaFin) {
        body.fechaFin = fechaFin;
      }

      const requests = [
        listarUbicaciones(),
        listarConductores(),
        listarVehiculo(),
        paginarEmbarques(1, 5000, {}),
        listarCombos(),
        listartipoMovimientoVehiculos(),
        encontrarModulo('Programador_combustible'),
        encontrarModulo(EVIDENCIAS_DRIVE_MODULE).catch(() => []),
        encontrarModulo(`${INSUMOS_PROGRAMADOR_MODULE_PREFIX}${usuario?.username || ''}`).catch(() => []),
        paginarProgramaciones(pagination, limit, body),
      ];

      if (usuario?.id_rol !== 'Super administrador' && usuario?.username) {
        requests.push(encontrarModulo(usuario.username));
      }

      const [newUbicaciones, newConductores, newVehiculos, embarquesRes, newCombos, newTiposMovimiento, configProgramador, driveConfig, insumosConfig, res, userConfig] = await Promise.all(requests);
      const insumosConsecutivos = parseInsumosConfig(insumosConfig);
      const insumos = insumosConsecutivos.length
        ? await filtrarProductos({ producto: { consecutivo: insumosConsecutivos } })
        : [];


      setUbicaciones(newUbicaciones || []);
      setConductores(newConductores.sort((a, b) => String(a.conductor).localeCompare(String(b.conductor))) || []);
      setVehiculos(newVehiculos.sort((a, b) => String(a.placa).localeCompare(String(b.placa))) || []);
      setEmbarques(embarquesRes?.data || []);
      setCombos(newCombos || []);
      setTiposMovimiento(newTiposMovimiento || []);
      setConfiguracionInsumos(
        insumosConsecutivos
          .map((consecutivo) => (insumos || []).find((item) => String(item?.consecutivo) === String(consecutivo)))
          .filter(Boolean)
      );
      setVehiculosSinCombustible(parseVehiculosSinCombustible(configProgramador));
      setEvidenciasDriveFolderId(parseEvidenciasDriveFolderId(driveConfig));
      setItemsList(res?.data || []);
      setTotal(res?.total || 0);
      setIsSuperAdmin(superAdmin);
      if (superAdmin) {
        setCanActualizarPendientes(true);
        setCanEditarProgramador(true);
      } else {
        let botones = [];
        try {
          const detalles = JSON.parse(userConfig?.[0]?.detalles || '{}');
          botones = Array.isArray(detalles?.botones) ? detalles.botones : [];
        } catch {
          botones = [];
        }
        setCanActualizarPendientes(botones.includes('programador_actualizar_pendientes'));
        setCanEditarProgramador(botones.includes('programador_edicion'));
      }
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
  }, [limit, pagination, setAlert, transportadoraFiltro]);

  useEffect(() => {
    listar();
  }, [pagination, reloadKey, listar]);

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

  // ========== FUNCIONES MOVIDAS AQUÍ (ANTES del useMemo de rows) ==========
  const getVisibleSerialesProgramador = useCallback((row) => {
    const seriales = Array.isArray(row?.serialesProgramador) ? row.serialesProgramador : [];
    if (!configuracionInsumos.length) {
      return seriales;
    }

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
  // ========== FIN DE FUNCIONES MOVIDAS ==========

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
  }, [combos, embarqueCatalog, itemList]);

  const canEditRow = useCallback((row) => {
    if (!isEditable) {
      return false;
    }
    if (normalizeValue(row?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO) {
      return isSuperAdmin;
    }
    return canEditarProgramador || isSuperAdmin;
  }, [canEditarProgramador, isEditable, isSuperAdmin]);

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
          'Estado listado': normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? 'Actualizado' : 'Pendiente',
          Vehiculo: item?.vehiculo?.placa || '',
          Transportadora: getTransportadoraLabel(item?.vehiculo?.transportadora || {}),
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

  const markLocalProgramacionStatus = useCallback((id, estadoListado) => {
    updateLocalRow(id, (row) => ({ ...row, estado_listado: estadoListado }));
  }, []);

  const markProgramacionesEstadoListado = useCallback(async (ids = [], estadoListado = ESTADO_LISTADO_ACTUALIZADO) => {
    const uniqueIds = [...new Set((ids || []).map((item) => String(item)).filter(Boolean))];
    if (!uniqueIds.length) {
      return;
    }

    await Promise.all(uniqueIds.map((id) => actualizarProgramaciones(id, { estado_listado: estadoListado })));
    uniqueIds.forEach((id) => markLocalProgramacionStatus(Number(id), estadoListado));
  }, [markLocalProgramacionStatus]);

  const handleCellEdit = async (id, field, value) => {
    try {
      updateLocalRow(id, (row) => ({ ...row, [field]: value, estado_listado: ESTADO_LISTADO_PENDIENTE }));
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
      updateLocalRow(row.id, (current) => ({ ...current, ...changes, estado_listado: ESTADO_LISTADO_PENDIENTE }));
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
      await actualizarProgramaciones(row.id, { estado_listado: ESTADO_LISTADO_PENDIENTE });
      markLocalProgramacionStatus(row.id, ESTADO_LISTADO_PENDIENTE);
      return existing.id;
    }

    const created = await agregarProductosViaje({
      programacion_id: row.id,
      unidad_de_medida: '',
      activo: true,
      cantidad: 0,
      ...changes,
    });

    await actualizarProgramaciones(row.id, { estado_listado: ESTADO_LISTADO_PENDIENTE });
    markLocalProgramacionStatus(row.id, ESTADO_LISTADO_PENDIENTE);

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

  const renderProgramadorHeader = (columnId, label) => (
    <th
      className={`text-custom-small text-center ${READONLY_PROGRAMADOR_COLUMNS.has(columnId) ? 'text-white bg-secondary' : ''}`}
      style={isEditable ? editableCellStyle : compactCellStyle}
    >
      {label}
    </th>
  );

  const resolveImportPayload = async (row, catalogs) => {
    const { ubicacionesList, conductoresList, vehiculosList, tiposMovimientoList, embarquesList, combosList } = catalogs;

    const fecha = formatDateCell(getRowValue(row, ['Fecha']));
    const vehiculoText = String(getRowValue(row, ['Vehiculo', 'Vehiculos', 'VehÃ­culo', 'Placa'])).trim();
    const conductorText = String(getRowValue(row, ['Conductor', 'Conductores'])).trim();
    const blText = String(getRowValue(row, ['BL', 'Bl', 'Bill of Loading'])).trim();
    const origenText = String(getRowValue(row, ['Origen', 'Ubicacion 1', 'UbicaciÃ³n 1'])).trim();
    const destinoText = String(getRowValue(row, ['Destino L', 'Destino', 'Ubicacion 2', 'UbicaciÃ³n 2'])).trim();
    const productoText = String(getRowValue(row, ['Producto'])).trim();
    const cantidadText = String(getRowValue(row, ['Cantidad', 'Cajas'])).trim();
    const movimientoText = String(getRowValue(row, ['Movimiento'])).trim();
    const contenedorText = String(getRowValue(row, ['Contenedor', 'Numero contenedor', 'NÃºmero contenedor'])).trim();
    const detallesText = String(getRowValue(row, ['Observaciones', 'Detalle', 'Detalles'])).trim();
    const llegadaOrigen = formatTimeCell(getRowValue(row, ['Llegada origen', 'Ingreso origen']));
    const salidaOrigen = formatTimeCell(getRowValue(row, ['Salida origen']));
    const llegadaDestino = formatTimeCell(getRowValue(row, ['Llegada destino', 'Ingreso destino']));
    const cierre = formatTimeCell(getRowValue(row, ['Cierre']));
    const salidaDestino = formatTimeCell(getRowValue(row, ['Salida destino']));
    const idText = String(getRowValue(row, ['Id', 'ID', 'Programacion ID', 'ProgramaciÃ³n ID'])).trim();

    if (!fecha || !vehiculoText || !conductorText || !origenText || !destinoText || !blText || !movimientoText || !productoText || !cantidadText) {
      throw new Error('faltan columnas obligatorias.');
    }

    const vehiculo = vehiculosList.find((item) => normalizeValue(item?.placa) === normalizeValue(vehiculoText));
    const conductor = conductoresList.find((item) => normalizeValue(item?.conductor) === normalizeValue(conductorText));
    const origen = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(origenText));
    const destino = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(destinoText));
    const embarque = (embarquesList || []).find((item) => (
      normalizeValue(item?.bl) === normalizeValue(blText)
      || normalizeValue(item?.booking) === normalizeValue(blText)
    ));
    const combo = (combosList || []).find((item) => normalizeValue(item?.nombre) === normalizeValue(productoText));
    const cantidad = Number(cantidadText);

    if (!vehiculo) throw new Error(`vehiculo "${vehiculoText}" no encontrado.`);
    if (!conductor) throw new Error(`conductor "${conductorText}" no encontrado.`);
    if (!origen) throw new Error(`origen "${origenText}" no encontrado.`);
    if (!destino) throw new Error(`destino "${destinoText}" no encontrado.`);
    if (!embarque) throw new Error(`BL "${blText}" no encontrado en embarques.`);
    if (!combo || combo?.isBlock === true) throw new Error(`producto "${productoText}" no existe o esta bloqueado.`);
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error(`cantidad "${cantidadText}" no es valida.`);

    const movimiento =
      tiposMovimientoList.find((item) => normalizeValue(item?.movimiento) === normalizeValue(movimientoText));

    if (!movimiento) {
      throw new Error(`el movimiento "${movimientoText}" no existe.`);
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

    const semana = String(embarque?.semanas?.consecutivo || embarque?.semana?.consecutivo || '').trim();
    if (!semana) {
      throw new Error(`el BL "${blText}" no tiene semana asociada.`);
    }

    return {
      idText,
      match: {
        fecha,
        semana,
        vehiculoId: String(vehiculo.id),
        rutaId: String(rutaId),
        bl: embarque?.bl || blText,
        movimiento: movimiento.movimiento,
      },
      payload: {
        ruta_id: rutaId,
        cobrar: false,
        id_pagador_flete: combo?.id_cliente || embarque?.id_cliente || null,
        activo: true,
        movimiento: movimiento.movimiento,
        conductor_id: conductor.id,
        vehiculo_id: vehiculo.id,
        contenedor: contenedorText || null,
        bl: embarque?.bl || blText,
        semana,
        fecha,
        detalles: detallesText,
        llegada_origen: llegadaOrigen,
        salida_origen: salidaOrigen,
        llegada_destino: llegadaDestino,
        cierre,
        salida_destino: salidaDestino,
      },
      productoPayload: {
        producto_id: combo.id,
        cantidad,
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
      const embarquesList = embarques.length ? embarques : (await paginarEmbarques(1, 5000, {}))?.data || [];
      const combosList = combos.length ? combos : await listarCombos();
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
            tiposMovimientoList,
            embarquesList,
            combosList,
          });

          if (isUpdate) {
            const existing = findExistingProgramacion(existingRows, resolved);
            if (!existing?.id) {
              throw new Error('no se encontro una programacion existente para actualizar.');
            }
            await actualizarProgramaciones(existing.id, resolved.payload);
            const productoExistente = Array.isArray(existing?.productos_viajes) ? existing.productos_viajes[0] : null;
            if (productoExistente?.id) {
              await actualizarProductosViaje(productoExistente.id, resolved.productoPayload);
            } else {
              await agregarProductosViaje({
                ...resolved.productoPayload,
                unidad_de_medida: '',
                activo: true,
                programacion_id: existing.id,
              });
            }
          } else {
            const created = await agregarProgramaciones(resolved.payload);
            await agregarProductosViaje({
              ...resolved.productoPayload,
              unidad_de_medida: '',
              activo: true,
              programacion_id: created?.id,
            });
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

  const findAlmacenFromUbicacion = useCallback((ubicacionDestino, almacenesList = []) => {
    const cod = normalizeValue(ubicacionDestino?.cod);
    const nombre = normalizeValue(ubicacionDestino?.ubicacion);

    return almacenesList.find((almacen) => (
      (cod && normalizeValue(almacen?.consecutivo) === cod)
      || (nombre && normalizeValue(almacen?.nombre) === nombre)
    )) || null;
  }, []);

  const buildListadoUpdateRowsFromProgramaciones = useCallback((programaciones = [], almacenesList = []) => {
    const groupedRows = new Map();
    const skippedRows = [];

    [...programaciones]
      .sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
      .forEach((item) => {
        const fecha = String(item?.fecha || '').trim();
        const contenedor = String(item?.contenedor || '').trim();
        const bl = String(item?.bl || '').trim();

        if (!fecha || !contenedor) {
          return;
        }

        const almacenDestino = findAlmacenFromUbicacion(item?.ruta?.ubicacion_2, almacenesList);
        if (!almacenDestino?.id) {
          skippedRows.push({
            fecha,
            bl,
            contenedor,
            reason: `No se encontro almacen para el destino ${item?.ruta?.ubicacion_2?.ubicacion || 'sin nombre'}`,
          });
          return;
        }

        const productoViaje = Array.isArray(item?.productos_viajes) ? item.productos_viajes[0] : null;
        const productoId = productoViaje?.producto_id || null;
        const cantidad = productoViaje?.cantidad;
        const cantidadNumero = cantidad === null || cantidad === undefined || cantidad === ''
          ? null
          : Number(cantidad);

        const key = `${fecha}__${contenedor}__${bl}__${almacenDestino.id}__${productoId || 'sin-producto'}`;
        const existing = groupedRows.get(key) || {
          fecha,
          contenedor,
          bl,
          id_lugar_de_llenado: almacenDestino.id,
          id_producto: productoId || null,
          cajas_unidades: null,
          programacionIds: [],
        };

        groupedRows.set(key, {
          fecha,
          contenedor,
          bl,
          id_lugar_de_llenado: almacenDestino.id,
          id_producto: productoId || existing.id_producto,
          cajas_unidades: Number.isFinite(cantidadNumero)
            ? (Number(existing.cajas_unidades || 0) + cantidadNumero)
            : existing.cajas_unidades,
          programacionIds: [...new Set([...(existing.programacionIds || []), item.id].filter(Boolean))],
        });
      });

    return {
      rows: Array.from(groupedRows.values()).filter((item) => (
        item.fecha
        && item.contenedor
        && item.id_lugar_de_llenado
      )),
      skippedRows,
    };
  }, [findAlmacenFromUbicacion]);

  const toListadoSyncPayload = useCallback((rows = []) => (
    (rows || []).map((row) => {
      const nextRow = { ...row };
      delete nextRow.programacionIds;
      return nextRow;
    })
  ), []);

  const listadoRowKey = useCallback((row = {}) => [
    normalizeValue(row.fecha),
    normalizeValue(row.contenedor),
    normalizeValue(row.bl || row.booking),
    String(row.id_lugar_de_llenado || ''),
    String(row.id_producto || ''),
  ].join('__'), []);

  const listadoRowMatchesMissing = useCallback((payloadRow = {}, missingRow = {}) => {
    const sameValue = (payloadValue, missingValue) => (
      missingValue === null
      || missingValue === undefined
      || String(missingValue) === ''
      || normalizeValue(payloadValue) === normalizeValue(missingValue)
    );

    return (
      sameValue(payloadRow.fecha, missingRow.fecha)
      && sameValue(payloadRow.contenedor, missingRow.contenedor)
      && sameValue(payloadRow.bl, missingRow.bl || missingRow.booking)
      && sameValue(payloadRow.id_lugar_de_llenado, missingRow.id_lugar_de_llenado)
      && sameValue(payloadRow.id_producto, missingRow.id_producto)
    );
  }, []);

  const getProcessedProgramacionIdsFromListadoResult = useCallback((payloadRows = [], result = {}) => {
    const missingRows = Array.isArray(result?.missingRows) ? result.missingRows : [];

    if (!result?.partial && !result?.requiresConfirmation && Number(result?.missingCount || 0) === 0) {
      return [...new Set(payloadRows.flatMap((item) => item.programacionIds || []))];
    }

    if (!missingRows.length) {
      return Number(result?.missingCount || 0) > 0
        ? []
        : [...new Set(payloadRows.flatMap((item) => item.programacionIds || []))];
    }

    const missingKeys = new Set(missingRows.map((item) => listadoRowKey(item)));
    return [
      ...new Set(
        payloadRows
          .filter((item) => (
            !missingKeys.has(listadoRowKey(item))
            && !missingRows.some((missingRow) => listadoRowMatchesMissing(item, missingRow))
          ))
          .flatMap((item) => item.programacionIds || [])
      ),
    ];
  }, [listadoRowKey, listadoRowMatchesMissing]);

  const vincularSerialesPendientesDeListado = useCallback(async (payloadRows = [], processedIds = []) => {
    const rows = payloadRows
      .filter((row) => (
        (row.programacionIds || []).some((id) => processedIds.includes(id))
      ))
      .flatMap((row) => (row.programacionIds || []).map((programacionId) => ({
        programacion_id: programacionId,
        contenedor: row.contenedor,
      })));

    if (!rows.length) {
      return;
    }

    await vincularContenedoresProgramacionSeriales(rows);
  }, []);

  const sincronizarListadoPendiente = useCallback(async () => {
    try {
      setSyncingListado(true);
      const filtros = {
        estado_listado: ESTADO_LISTADO_PENDIENTE,
      };

      const [{ data }, almacenesList] = await Promise.all([
        paginarProgramaciones('', '', filtros),
        listarAlmacenes(),
      ]);
      const { rows: payloadRows, skippedRows } = buildListadoUpdateRowsFromProgramaciones(data || [], almacenesList || []);

      if (!payloadRows.length) {
        if (skippedRows.length) {
          setPendingListadoSync({
            payloadRows: [],
            processableCount: 0,
            missingCount: skippedRows.length,
            missingRows: skippedRows,
            processedProgramacionIds: [],
          });
        } else {
          setAlert({
            active: true,
            mensaje: 'No hay programaciones pendientes con contenedor para sincronizar al listado.',
            color: 'warning',
            autoClose: true,
          });
        }
        return;
      }

      if (skippedRows.length) {
        setPendingListadoSync({
          payloadRows,
          processableCount: payloadRows.length,
          missingCount: skippedRows.length,
          missingRows: skippedRows,
          processedProgramacionIds: getProcessedProgramacionIdsFromListadoResult(payloadRows, {
            partial: true,
            missingRows: skippedRows,
          }),
        });
        return;
      }

      let response = await actualizarListadoMasivo({ rows: toListadoSyncPayload(payloadRows) });
      let result = response?.data || response;

      if (result?.requiresConfirmation) {
        setPendingListadoSync({
          payloadRows,
          processableCount: result.processableCount || 0,
          missingCount: result.missingCount || 0,
          missingRows: result.missingRows || [],
          processedProgramacionIds: getProcessedProgramacionIdsFromListadoResult(payloadRows, result),
        });
        return;
      }

      const processedIds = getProcessedProgramacionIdsFromListadoResult(payloadRows, result);
      await markProgramacionesEstadoListado(
        processedIds,
        ESTADO_LISTADO_ACTUALIZADO
      );
      await vincularSerialesPendientesDeListado(payloadRows, processedIds);

      setAlert({
        active: true,
        mensaje: result?.partial
          ? `${result?.message || 'Actualizacion parcial completada'}. Coincidencias: ${result?.total || 0}. Sin coincidencia: ${result?.missingCount || 0}.`
          : result?.message || 'Listado actualizado desde Programador.',
        color: result?.partial ? 'warning' : 'success',
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el listado desde Programador.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setSyncingListado(false);
    }
  }, [buildListadoUpdateRowsFromProgramaciones, getProcessedProgramacionIdsFromListadoResult, markProgramacionesEstadoListado, setAlert, toListadoSyncPayload, vincularSerialesPendientesDeListado]);

  const descargarNoEncontradosListado = useCallback(() => {
    if (!pendingListadoSync?.missingRows?.length) {
      return;
    }

    const rows = pendingListadoSync.missingRows.map((item) => ({
      fecha: item.fecha || '',
      bl: item.bl || item.booking || '',
      contenedor: item.contenedor || '',
      id_lugar_de_llenado: item.id_lugar_de_llenado ?? '',
      id_producto: item.id_producto ?? '',
      cajas_unidades: item.cajas_unidades ?? '',
      motivo: item.reason || 'Sin coincidencia',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'No encontrados');
    XLSX.writeFile(workbook, 'programador-no-encontrados-listado.xlsx');
  }, [pendingListadoSync]);

  const confirmarListadoCoincidencias = useCallback(async () => {
    if (!pendingListadoSync?.payloadRows?.length) {
      return;
    }

    try {
      setSyncingListado(true);
      const response = await actualizarListadoMasivo({
        rows: toListadoSyncPayload(pendingListadoSync.payloadRows),
        allowPartial: true,
      });
      const result = response?.data || response;
      const processedProgramacionIds = getProcessedProgramacionIdsFromListadoResult(
        pendingListadoSync.payloadRows,
        result
      );

      await markProgramacionesEstadoListado(
        processedProgramacionIds,
        ESTADO_LISTADO_ACTUALIZADO
      );
      await vincularSerialesPendientesDeListado(pendingListadoSync.payloadRows, processedProgramacionIds);

      setAlert({
        active: true,
        mensaje: result?.partial
          ? `${result?.message || 'Actualizacion parcial completada'}. Coincidencias: ${result?.total || 0}. Sin coincidencia: ${result?.missingCount || 0}.`
          : result?.message || 'Listado actualizado desde Programador.',
        color: result?.partial ? 'warning' : 'success',
        autoClose: true,
      });
      setPendingListadoSync(null);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar coincidencias del listado.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setSyncingListado(false);
    }
  }, [getProcessedProgramacionIdsFromListadoResult, markProgramacionesEstadoListado, pendingListadoSync, setAlert, toListadoSyncPayload, vincularSerialesPendientesDeListado]);

  // Función: Abrir modal de evidencia
  const cerrarModalEvidencia = () => {
    if (uploadingEvidencia) return;
    setShowEvidenciaModal(false);
    setSelectedProgramacion(null);
    setEvidenciaFiles([]);
    setEvidenciaResultados(null);
  };

  const abrirModalEvidencia = (programacion) => {
    setSelectedProgramacion(programacion);
    setEvidenciaFiles([]);
    setEvidenciaResultados(null);
    setShowEvidenciaModal(true);
  };

  // Función: Manejar selección de archivos
  const handleEvidenciaFilesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > EVIDENCIA_MAX_FILES) {
      setAlert({
        active: true,
        mensaje: `Solo puedes subir maximo ${EVIDENCIA_MAX_FILES} fotos por envio.`,
        color: 'warning',
        autoClose: true,
      });
      e.target.value = '';
      return;
    }

    const invalidFile = files.find((file) => (
      !EVIDENCIA_ALLOWED_TYPES.includes(file.type) || file.size > EVIDENCIA_MAX_FILE_SIZE
    ));

    if (invalidFile) {
      setAlert({
        active: true,
        mensaje: `El archivo ${invalidFile.name} no es valido. Usa JPG, PNG, GIF o WEBP de maximo 5MB.`,
        color: 'warning',
        autoClose: true,
      });
      e.target.value = '';
      return;
    }

    setEvidenciaFiles(files);
  };

  // Función: Subir evidencias a Google Drive
  const subirEvidenciasProgramacion = async () => {
    if (!selectedProgramacion) return;
    if (!evidenciaFiles.length) {
      setAlert({
        active: true,
        mensaje: 'Selecciona al menos una foto para subir.',
        color: 'warning',
        autoClose: true,
      });
      return;
    }

    setUploadingEvidencia(true);

    try {
      const itemEvidencia = selectedProgramacion.vehiculoLabel
        || selectedProgramacion.vehiculo?.placa
        || selectedProgramacion.contenedorLabel
        || selectedProgramacion.contenedor
        || `programacion-${selectedProgramacion.id || selectedProgramacion.consecutivo || 'sin-id'}`;

      const formData = new FormData();
      formData.append('programacion_id', selectedProgramacion.id || selectedProgramacion.consecutivo || '');
      formData.append('semana', selectedProgramacion.semanaLabel || selectedProgramacion.semana || '');
      formData.append('fecha', selectedProgramacion.fecha || '');
      formData.append('item', itemEvidencia);
      formData.append('vehiculo', selectedProgramacion.vehiculoLabel || selectedProgramacion.vehiculo?.placa || '');
      formData.append('contenedor', selectedProgramacion.contenedorLabel || selectedProgramacion.contenedor || '');
      formData.append(
        'finca_destino',
        selectedProgramacion.destino
          || selectedProgramacion.destinoLabel
          || selectedProgramacion.ruta?.ubicacion_2?.ubicacion
          || selectedProgramacion.destino
          || selectedProgramacion.ubicacion2
          || ''
      );
      formData.append('bl', selectedProgramacion.blLabel || selectedProgramacion.bl || '');
      formData.append('producto', selectedProgramacion.productoLabel || '');
      formData.append('carpetaID', evidenciasDriveFolderId);

      evidenciaFiles.forEach((file) => {
        formData.append('fotos', file);
      });

      const resultado = await subirEvidencias(formData);
      const payload = resultado?.data || resultado || {};
      const totalFotos = payload.totalFotos || payload.fotos?.length || evidenciaFiles.length;

      setEvidenciaResultados(payload);
      updateLocalRow(selectedProgramacion.id, (row) => ({
        ...row,
        evidencia_cargada: true,
        evidencia_carpeta_id: payload.carpetaId || row.evidencia_carpeta_id || '',
        evidencia_carpeta_url: payload.carpetaUrl || row.evidencia_carpeta_url || '',
        evidencia_fecha: new Date().toISOString(),
        evidencia_total_fotos: totalFotos,
      }));

      setAlert({
        active: true,
        mensaje: `Se subieron ${totalFotos} fotos exitosamente.`,
        color: 'success',
        autoClose: true,
      });

      setEvidenciaFiles([]);
      setReloadKey((prev) => prev + 1);

    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible subir las evidencias.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setUploadingEvidencia(false);
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
                  <label htmlFor="transportadoraFiltro" className="form-label mb-1">Transportadora</label>
                  <select
                    id="transportadoraFiltro"
                    name="transportadoraFiltro"
                    className="form-select form-select-sm"
                    value={transportadoraFiltro}
                    onChange={(event) => setTransportadoraFiltro(event.target.value)}
                  >
                    <option value="">Todas</option>
                    {transportadoras.map((item) => (
                      <option key={item.id} value={item.id}>{getTransportadoraLabel(item)}</option>
                    ))}
                  </select>
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

                {(canEditarProgramador || isSuperAdmin) && (
                  <div className="col-12 col-md-6 col-lg-2">
                    <Button type="button" onClick={() => setIsEditable((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant={isEditable ? 'success' : 'warning'} size="sm">
                      {isEditable ? 'Edicion activa' : 'Permitir edicion'}
                    </Button>
                  </div>
                )}

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={descargarExcel} className="w-100 mt-0 mt-md-4" variant="success" size="sm">
                    Descargar Excel
                  </Button>
                </div>

                {canActualizarPendientes && (
                  <div className="col-12 col-md-6 col-lg-2">
                    <Button
                      type="button"
                      onClick={sincronizarListadoPendiente}
                      className="w-100 mt-0 mt-md-4"
                      variant="outline-success"
                      size="sm"
                      disabled={syncingListado || loading}
                    >
                      {syncingListado ? 'Actualizando pendientes...' : 'Actualizar pendientes'}
                    </Button>
                  </div>
                )}

                <div className="col-12 col-md-6 col-lg-2">
                  <Button type="button" onClick={() => setShowColumnConfig((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant="outline-dark" size="sm">
                    Configurar columnas
                  </Button>
                </div>

                {isSuperAdmin && (
                  <div className="col-12 col-md-6 col-lg-2">
                    <Button type="button" onClick={() => setShowInsumoConfig(true)} className="w-100 mt-0 mt-md-4" variant="outline-secondary" size="sm">
                      Configurar insumos
                    </Button>
                  </div>
                )}
              </div>
            </form>

            <div className="table-responsive mt-4" style={{ overflowX: 'auto' }}>
              <table
                className="table table-striped table-bordered table-sm mt-2 text-center align-middle mb-0 programador-table"
                style={{ minWidth: isEditable ? '2400px' : '1600px', tableLayout: 'auto', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
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
                    {visibleColumns.transportadora && renderProgramadorHeader('transportadora', 'Transportadora')}
                    {visibleColumns.conductor && renderProgramadorHeader('conductor', 'Conductor')}
                    {visibleColumns.llegada_origen && renderProgramadorHeader('llegada_origen', 'Ingreso origen')}
                    {visibleColumns.salida_origen && renderProgramadorHeader('salida_origen', 'Salida origen')}
                    {visibleColumns.llegada_destino && renderProgramadorHeader('llegada_destino', 'Ingreso destino')}
                    {visibleColumns.cierre && renderProgramadorHeader('cierre', 'Cierre')}
                    {visibleColumns.salida_destino && renderProgramadorHeader('salida_destino', 'Salida destino')}
                    {visibleColumns.movimiento && renderProgramadorHeader('movimiento', 'Movimiento')}
                    {visibleColumns.contenedor && renderProgramadorHeader('contenedor', 'Contenedor')}
                    {visibleColumns.articulo_serial && renderProgramadorHeader('articulo_serial', 'Articulo serial')}
                    {visibleColumns.serial && renderProgramadorHeader('serial', 'Serial')}
                    {visibleColumns.estado_listado && renderProgramadorHeader('estado_listado', 'Estado')}
                    {visibleColumns.agregar_serial && renderProgramadorHeader('agregar_serial', '')}
                    {visibleColumns.evidencia && renderProgramadorHeader('evidencia', 'Evid.')}
                    {visibleColumns.eliminar && renderProgramadorHeader('eliminar', '')}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const rowEditable = canEditRow(item);
                    const rowPending = normalizeValue(item?.estado_listado) !== ESTADO_LISTADO_ACTUALIZADO;
                    return (
                      <tr
                        key={item.id}
                        style={item.groupStart ? { borderTop: '2px solid #356854' } : undefined}
                      >
                        {visibleColumns.semana && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          <div className="py-2 px-1 text-center">{item.semanaLabel}</div>
                        </td>}
                        {visibleColumns.fecha && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.origen && <td className="table-success text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.destino && <td className="table-primary text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.productos && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.cantidad_productos && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.linea && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          <div className="py-2 px-1 text-center">{item.lineaLabel || ''}</div>
                        </td>}
                        {visibleColumns.destino_embarque && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          <div className="py-2 px-1 text-center">{item.embarqueDestinoLabel || ''}</div>
                        </td>}
                        {visibleColumns.buque && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          <div className="py-2 px-1 text-center">{item.buqueLabel || ''}</div>
                        </td>}
                        {visibleColumns.bl && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.vehiculo && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.transportadora && (
                          <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                            <div className="py-2 px-1 text-center">{item.transportadoraLabel || ''}</div>
                          </td>
                        )}
                        {visibleColumns.conductor && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.llegada_origen && <td className="table-success text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.salida_origen && <td className="table-success text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.llegada_destino && <td className="table-primary text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.cierre && <td className="table-primary text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.salida_destino && <td className="table-primary text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.movimiento && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.contenedor && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          {rowEditable ? (
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
                        {visibleColumns.articulo_serial && (
                          <td className="text-center align-middle p-0" style={compactCellStyle}>
                            <div className="py-2 px-1 text-center">{formatSerialArticuloLabel(item) || ''}</div>
                          </td>
                        )}
                        {visibleColumns.serial && (
                          <td className="text-center align-middle p-0" style={compactCellStyle}>
                            <div className="py-2 px-1 text-center">{formatSerialLabel(item) || ''}</div>
                          </td>
                        )}
                        {visibleColumns.estado_listado && <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                          <div className="py-1 px-1 text-center">
                            <span
                              className={`badge rounded-pill fw-normal ${normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}
                              style={{ fontSize: '0.68rem', lineHeight: 1, padding: '0.25rem 0.45rem' }}
                            >
                              {item.estadoListadoLabel}
                            </span>
                          </div>
                        </td>}
                        {visibleColumns.agregar_serial && (
                          <td className="text-center align-middle p-0" style={compactCellStyle}>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-decoration-none p-0"
                              style={{
                                width: 26,
                                height: 26,
                                lineHeight: '24px',
                                color: '#0d6efd',
                              }}
                              onClick={() => abrirModalSeriales(item)}
                              title="Agregar serial"
                            >
                              <FaPlus size={12} />
                            </Button>
                          </td>
                        )}
                        {visibleColumns.evidencia && (
                          <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-decoration-none p-0"
                              style={{
                                width: 26,
                                height: 26,
                                lineHeight: '24px',
                                color: item.evidenciaSubida ? '#7e83889d' : '#319c5c',
                              }}
                              onClick={() => abrirModalEvidencia(item)}
                              title={item.evidenciaSubida ? 'Evidencia cargada' : 'Subir evidencia fotografica'}
                            >
                              <FaCamera size={12} />
                            </Button>
                          </td>
                        )}
                        {visibleColumns.eliminar && (
                          <td className="text-center align-middle p-0" style={rowEditable ? editableCellStyle : compactCellStyle}>
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-decoration-none p-0"
                              style={{
                                width: 26,
                                height: 26,
                                lineHeight: '24px',
                                color: rowPending ? '#7f1d1d' : '#6c757d',
                              }}
                              title={rowPending ? 'Eliminar' : 'Solo se eliminan pendientes'}
                              disabled={!rowPending}
                              onClick={() => eliminar(item.id)}
                            >
                              <FaTrashAlt size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

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

      <ProgramadorColumnModal
        show={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onSave={() => {
          saveColumnConfig(visibleColumns);
          setShowColumnConfig(false);
        }}
      />

      {showInsumoConfig && isSuperAdmin && (
        <InsumoConfig
          handleConfig={() => {
            setShowInsumoConfig(false);
            setReloadKey((prev) => prev + 1);
          }}
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
        onRemoveFile={(idx) => {
          const newFiles = [...evidenciaFiles];
          newFiles.splice(idx, 1);
          setEvidenciaFiles(newFiles);
        }}
        onUpload={subirEvidenciasProgramacion}
        onReset={() => {
          setEvidenciaResultados(null);
          setEvidenciaFiles([]);
        }}
      />

      <ProgramadorSerialesModal
        show={showSerialesModal}
        programacion={selectedSerialProgramacion}
        seriales={selectedSerialProgramacion?.serialesProgramador || selectedSerialProgramacion?.seriales_programador || []}
        onClose={cerrarModalSeriales}
        onSaved={handleSerialesSaved}
      />

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
            Sem: null,
            Fecha: null,
            Origen: null,
            "Destino L": null,
            Producto: null,
            Cantidad: null,
            Linea: null,
            Destino: null,
            Buque: null,
            BL: null,
            Vehiculos: null,
            Conductor: null,
            "Ingreso origen": null,
            "Salida origen": null,
            "Ingreso destino": null,
            Cierre: null,
            "Salida destino": null,
            Movimiento: null,
            Contenedor: null,
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
            Sem: null,
            Fecha: null,
            Origen: null,
            "Destino L": null,
            Producto: null,
            Cantidad: null,
            Linea: null,
            Destino: null,
            Buque: null,
            BL: null,
            Vehiculos: null,
            Conductor: null,
            "Ingreso origen": null,
            "Salida origen": null,
            "Ingreso destino": null,
            Cierre: null,
            "Salida destino": null,
            Movimiento: null,
            Contenedor: null,
          }}
          onProcessRows={(rows) => processProgramacionRows(rows, 'update')}
        />
      )}
    </>
  );
}