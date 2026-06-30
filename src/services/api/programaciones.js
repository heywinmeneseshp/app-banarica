import axios from 'axios';
import endPoints from './index';
import { getToken } from 'utils/session';

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback
);

const config = {
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const authConfig = () => {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const agregarProgramaciones = async (programaciones) => {
  try {
    const url = endPoints.programaciones.create;
    const response = await axios.post(url, programaciones, config);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al ingresar datos'));
  }
};

const eliminarProgramaciones = async (consecutivo) => {
  try {
    const res = await axios.delete(endPoints.programaciones.delete(consecutivo));
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar la programacion'));
  }
};

const actualizarProgramaciones = async (consecutivo, changes) => {
  try {
    const res = await axios.patch(endPoints.programaciones.update(consecutivo), changes);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar la programacion'));
  }
};

const buscarProgramaciones = async (consecutivo) => {
  try {
    const res = await axios.get(endPoints.programaciones.findOne(consecutivo));
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al buscar programaciones'));
  }
};

const listarProgramaciones = async () => {
  try {
    const res = await axios.get(endPoints.programaciones.list);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al listar programaciones'));
  }
};

const paginarProgramaciones = async (page, limit, body) => {
  try {
    const res = await axios.post(endPoints.programaciones.pagination(page, limit), body, authConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al paginar programacion'));
  }
};

const actualizarMasivoProgramaciones = async (rows) => {
  try {
    const res = await axios.post(endPoints.programaciones.bulkUpdate, rows, authConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar programaciones masivamente'));
  }
};

export {
  agregarProgramaciones,
  eliminarProgramaciones,
  actualizarProgramaciones,
  actualizarMasivoProgramaciones,
  buscarProgramaciones,
  listarProgramaciones,
  paginarProgramaciones,
};
