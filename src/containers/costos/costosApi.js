import { getToken } from 'utils/session';

const COSTOS_API = `${process.env.NEXT_PUBLIC_API_URL}/api/${process.env.NEXT_PUBLIC_API_VERSION}/costos`;

// Llamada al backend de Costos logisticos con el token de la sesion.
// `ruta` empieza con "/" (ej. "/facturas?estado=Pagada"); devuelve la Response.
export function costosFetch(ruta, options = {}) {
  const token = getToken();
  return fetch(`${COSTOS_API}${ruta}`, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// GET que devuelve el JSON ya parseado (arreglo/objeto) o lanza un Error con el mensaje del servidor.
export async function costosGet(ruta) {
  const res = await costosFetch(ruta);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || `Error ${res.status}`);
  return data;
}

// POST/PATCH/DELETE con cuerpo JSON. Devuelve { ok, status, data }.
export async function costosEnviar(metodo, ruta, cuerpo) {
  const res = await costosFetch(ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && data?.ok !== false;
  return { ok, status: res.status, data, error: data?.error || data?.message || (res.ok ? '' : `Error ${res.status}`) };
}

export const formatoNumero = (n, decimales = 2) => (
  n == null || n === '' ? '-' : Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: decimales })
);
