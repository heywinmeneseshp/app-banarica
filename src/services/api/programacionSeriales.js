import axios from 'axios';
import endPoints from './index';
import { getToken } from 'utils/session';

const buildConfig = () => {
  const token = getToken();
  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback
);

const listarProgramacionSeriales = async (body = {}) => {
  try {
    const res = await axios.post(endPoints.programacionSeriales.pagination('', ''), body);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al listar seriales del programador'));
  }
};

const crearProgramacionSerial = async (body) => {
  try {
    const res = await axios.post(endPoints.programacionSeriales.create, body, buildConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al relacionar el serial con la programacion'));
  }
};

const crearProgramacionSerialesMasivo = async (rows = []) => {
  try {
    const res = await axios.post(endPoints.programacionSeriales.bulkCreate, { rows }, buildConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al relacionar los seriales con la programacion'));
  }
};

const actualizarProgramacionSerial = async (id, body) => {
  try {
    const res = await axios.patch(endPoints.programacionSeriales.update(id), body, buildConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el serial del programador'));
  }
};

const vincularContenedoresProgramacionSeriales = async (rows = []) => {
  try {
    const res = await axios.post(endPoints.programacionSeriales.linkPending, { rows }, buildConfig());
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al vincular contenedores a seriales del programador'));
  }
};

export {
  listarProgramacionSeriales,
  crearProgramacionSerial,
  crearProgramacionSerialesMasivo,
  actualizarProgramacionSerial,
  vincularContenedoresProgramacionSeriales,
};
