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
        'Content-Type': 'application/json'
    }
};
const agregarVehiculo = async (Vehiculo) => {
   try {
    const url = endPoints.vehiculos.create;
    const response = await axios.post(url, Vehiculo, config);
    return response.data;
   }catch(error){
    throw new Error(getErrorMessage(error, "Error al ingresar vehiculo"));
   }
};
const authConfig = () => {
    const token = getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const cargueMasivoVehiculos = async (rows) => {
    try {
        const response = await axios.post(endPoints.vehiculos.bulkCreate, rows, config);
        return response.data;
    } catch (e) {
        throw new Error(e?.response?.data?.message || "Error en cargue masivo de vehiculos");
    }
};

const actualizarMasivoVehiculos = async (rows) => {
    try {
        const response = await axios.post(endPoints.vehiculos.bulkUpdate, rows, config);
        return response.data;
    } catch (e) {
        throw new Error(e?.response?.data?.message || "Error en actualizacion masiva de vehiculos");
    }
};

const eliminarVehiculo = async(consecutivo) => {
    const res = await axios.delete(endPoints.vehiculos.delete(consecutivo));
    return res.data;
};

const actualizarVehiculo = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.vehiculos.update(consecutivo), changes);
    return res.data;
};

const buscarVehiculo = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.vehiculos.findOne(consecutivo));
    return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al buscar Vehiculo"));
    } 
};

const listarVehiculo = async(includeUnassigned = false) => {
    try {
        const separator = endPoints.vehiculos.list.includes('?') ? '&' : '?';
        const res = await axios.get(`${endPoints.vehiculos.list}${separator}includeUnassigned=${includeUnassigned}`, authConfig());
        return res.data;
    } catch (error){
        throw new Error(getErrorMessage(error, "Error al listar Vehiculo"));
    }
};

const paginarVehiculo = async (page, limit, nombre, transportadoraId = '', includeUnassigned = false) => {
    try {
        const res = await axios.get(endPoints.vehiculos.pagination(page, limit, nombre, transportadoraId, includeUnassigned), authConfig());
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al paginar vehiculos"));
    }
};

export { agregarVehiculo, cargueMasivoVehiculos, actualizarMasivoVehiculos, eliminarVehiculo, actualizarVehiculo,
     buscarVehiculo, listarVehiculo, paginarVehiculo };
