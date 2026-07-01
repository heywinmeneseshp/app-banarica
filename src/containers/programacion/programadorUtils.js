import * as XLSX from 'xlsx';

export const ROL_SUPER_ADMIN = 'Super administrador';
export const PAGE_LIMIT = 25;
export const COLUMN_STORAGE_KEY = 'programadorColumnConfig';

export const buildFilterBody = (formEl) => {
  const formData = new FormData(formEl);
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
  if (fechaFin) body.fechaFin = fechaFin;
  return body;
};

export const INSUMOS_PROGRAMADOR_MODULE_PREFIX = 'Relacion_programador_';
export const DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID = process.env.NEXT_PUBLIC_EVIDENCIAS_DRIVE_FOLDER_ID || '1ZnxhLTlN5WROcl-oozkSJXwjI87aG4bM';
export const EVIDENCIAS_DRIVE_MODULE = 'Google_drive_evidencias';
export const EVIDENCIA_MAX_FILES = 20;
export const EVIDENCIA_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const EVIDENCIA_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const COLUMN_OPTIONS = [
  { id: 'semana', label: 'Sem' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'origen', label: 'Origen' },
  { id: 'destino', label: 'Destino' },
  { id: 'productos', label: 'Producto' },
  { id: 'cantidad_productos', label: 'Cantidad' },
  { id: 'linea', label: 'Linea' },
  { id: 'destino_embarque', label: 'Destino embarque' },
  { id: 'buque', label: 'Buque' },
  { id: 'bl', label: 'Booking' },
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

export const DEFAULT_VISIBLE_COLUMNS = COLUMN_OPTIONS.reduce((acc, column) => {
  acc[column.id] = true;
  return acc;
}, {});

export const READONLY_PROGRAMADOR_COLUMNS = new Set([
  'semana',
  'linea',
  'destino_embarque',
  'buque',
]);

export const parseVehiculosSinCombustible = (configRows) => {
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

export const parseEvidenciasDriveFolderId = (configRows) => {
  try {
    const [config = {}] = configRows || [];
    const parsed = JSON.parse(config?.detalles || '{}');
    return parsed?.carpetaID || DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID;
  } catch (error) {
    console.warn('No se pudo leer la configuracion de evidencias en Drive:', error);
    return DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID;
  }
};

export const parseInsumosConfig = (configRows) => {
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

export const normalizeValue = (value) => String(value || '').trim().toLowerCase();

export const getTransportadoraLabel = (transportadora = {}) => (
  transportadora?.razon_social
  || transportadora?.nombre
  || transportadora?.consecutivo
  || `Transportadora ${transportadora?.id || ''}`.trim()
);

export const getRowValue = (row, aliases) => {
  const normalizedEntries = Object.entries(row || {}).map(([key, value]) => [normalizeValue(key), value]);
  for (const alias of aliases) {
    const found = normalizedEntries.find(([key]) => key === normalizeValue(alias));
    if (found) {
      return found[1];
    }
  }
  return '';
};

export const formatDateCell = (value) => {
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

export const formatTimeCell = (value) => {
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

export const compactCellStyle = {
  whiteSpace: 'nowrap',
  width: '1%',
  padding: '0.3rem 0.4rem',
  fontSize: '0.8rem',
  verticalAlign: 'middle',
};

export const editableCellStyle = {
  ...compactCellStyle,
  width: 'auto',
  minWidth: '120px',
};

export const ESTADO_LISTADO_PENDIENTE = 'pendiente';
export const ESTADO_LISTADO_ACTUALIZADO = 'actualizado';

export const COLORES_PASTEL_PROGRAMADOR = [
  '#E3F2FD', '#E0F7FA', '#E8F5E9', '#F1F8E9', '#FFFDE7',
  '#FFF8E1', '#FBE9E7', '#FCE4EC', '#F3E5F5', '#EDE7F6',
  '#E8EAF6', '#E1F5FE', '#F9FBE7', '#FFF3E0', '#EFEBE9',
  '#ECEFF1', '#E0F2F1', '#F0FFF4', '#FFF0F5', '#F5F0FF',
];

export function buildContenedorColorMap(rows) {
  const count = {};
  for (const row of rows) {
    const c = row?.contenedor || row?.contenedorLabel || '';
    if (c) count[c] = (count[c] || 0) + 1;
  }
  const map = {};
  let colorIndex = 0;
  for (const [c, n] of Object.entries(count)) {
    if (n > 1) map[c] = COLORES_PASTEL_PROGRAMADOR[colorIndex++ % COLORES_PASTEL_PROGRAMADOR.length];
  }
  return map;
}
