import axios from 'axios';
import endPoints from '@services/api/index';
import { getToken } from 'utils/session';

const getAuthConfig = (extra = {}) => {
  const token = getToken();
  return {
    ...extra,
    headers: { ...(extra.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
};

const mensajeError = (error, porDefecto) => (
  error?.response?.data?.message || error?.response?.data?.error || error?.message || porDefecto
);

const listarDestinatarios = async () => {
  try {
    const res = await axios.get(endPoints.comunicados.destinatarios, getAuthConfig());
    return res.data;
  } catch (error) {
    throw new Error(mensajeError(error, 'No fue posible cargar los destinatarios'));
  }
};

const listarComunicados = async ({ page = 1, limit = 20, search = '' } = {}) => {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await axios.get(`${endPoints.comunicados.base}?${params.toString()}`, getAuthConfig());
    return res.data;
  } catch (error) {
    throw new Error(mensajeError(error, 'No fue posible cargar el historial'));
  }
};

const buscarComunicado = async (id) => {
  try {
    const res = await axios.get(`${endPoints.comunicados.base}/${id}`, getAuthConfig());
    return res.data;
  } catch (error) {
    throw new Error(mensajeError(error, 'No fue posible cargar el comunicado'));
  }
};

// FormData con asunto, mensaje, correos/roles/usuarios (JSON) y adjuntos.
const enviarComunicado = async (formData) => {
  try {
    const res = await axios.post(endPoints.comunicados.base, formData, getAuthConfig({ timeout: 5 * 60 * 1000 }));
    return res.data;
  } catch (error) {
    throw new Error(mensajeError(error, 'No fue posible enviar el comunicado'));
  }
};

// ---- Mensajes del usuario autenticado (icono junto a su nombre) ----
const contarMensajesNoLeidos = async () => {
  const res = await axios.get(`${endPoints.comunicados.misMensajes}/no-leidos`, getAuthConfig());
  return Number(res.data?.total || 0);
};

const listarMisMensajes = async ({ page = 1 } = {}) => {
  try {
    const res = await axios.get(`${endPoints.comunicados.misMensajes}?page=${page}`, getAuthConfig());
    return res.data;
  } catch (error) {
    throw new Error(mensajeError(error, 'No fue posible cargar los mensajes'));
  }
};

const marcarMensajeLeido = async (id) => {
  await axios.patch(`${endPoints.comunicados.misMensajes}/${id}/leido`, {}, getAuthConfig());
};

const marcarTodosMensajesLeidos = async () => {
  await axios.patch(`${endPoints.comunicados.misMensajes}/leer-todos`, {}, getAuthConfig());
};

export {
  listarDestinatarios, listarComunicados, buscarComunicado, enviarComunicado,
  contarMensajesNoLeidos, listarMisMensajes, marcarMensajeLeido, marcarTodosMensajesLeidos,
};
