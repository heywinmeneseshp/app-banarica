import axios from 'axios';
import endPoints from './index';

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

const agregartipoMovimientoVehiculo = async (payload) => {
  try {
    const response = await axios.post(endPoints.tipoMovimientoVehiculos.create, payload, config);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al ingresar tipo de movimiento'));
  }
};

const eliminartipoMovimientoVehiculo = async (id) => {
  try {
    const res = await axios.delete(endPoints.tipoMovimientoVehiculos.delete(id));
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al eliminar tipo de movimiento'));
  }
};

const actualizartipoMovimientoVehiculo = async (id, changes) => {
  try {
    const res = await axios.patch(endPoints.tipoMovimientoVehiculos.update(id), changes);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar tipo de movimiento'));
  }
};

const buscartipoMovimientoVehiculo = async (id) => {
  try {
    const res = await axios.get(endPoints.tipoMovimientoVehiculos.findOne(id));
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al buscar tipo de movimiento'));
  }
};

const listartipoMovimientoVehiculos = async () => {
  try {
    const res = await axios.get(endPoints.tipoMovimientoVehiculos.list);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al listar tipos de movimiento'));
  }
};

const paginartipoMovimientoVehiculos = async (page, limit, item) => {
  try {
    const res = await axios.get(endPoints.tipoMovimientoVehiculos.pagination(page, limit, item));
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al paginar tipos de movimiento'));
  }
};

export {
  agregartipoMovimientoVehiculo,
  eliminartipoMovimientoVehiculo,
  actualizartipoMovimientoVehiculo,
  buscartipoMovimientoVehiculo,
  listartipoMovimientoVehiculos,
  paginartipoMovimientoVehiculos,
};
