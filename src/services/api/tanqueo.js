import axios from 'axios';
import endPoints from './index';
const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
);

const agregarTanqueo = async (Tanqueo) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    try {
        const url = endPoints.tanqueo.create;
        const response = await axios.post(url, Tanqueo, config);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al crear Tanqueo"));
    }
};

const cargarCombustible = async (payload) => {
    try {
        const response = await axios.post(endPoints.tanqueo.cargarCombustible, payload);
        return response.data?.data || response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al cargar combustible"));
    }
};

const ajustarSaldoCombustible = async (payload) => {
    try {
        const response = await axios.post(endPoints.tanqueo.ajustarSaldo, payload);
        return response.data?.data || response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al ajustar saldo de combustible"));
    }
};

const eliminarTanqueo = async (consecutivo) => {
    try {
        const res = await axios.delete(endPoints.tanqueo.delete(consecutivo));
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al eliminar el Tanqueo"));
    }
};

const actualizarTanqueo = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.tanqueo.update(id), changes);
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al actualizar Tanqueo"));
    }
};

const buscarTanqueo = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.tanqueo.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert("Error al buscar Tanqueo");
    }
};

const consultarTanqueos = async (body) => {
    try {
        const res = await axios.post(endPoints.tanqueo.findAll, body);
        return res.data?.data || res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al buscar Tanqueo"));
    }
};

const listartanqueo = async () => {
    try {
        const res = await axios.get(endPoints.tanqueo.list);
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al listar tanqueo"));
    }
};

const paginartanqueo = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.tanqueo.pagination(page, limit, nombre));
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al paginar tanqueo"));
    }
};

export {
    agregarTanqueo, cargarCombustible, ajustarSaldoCombustible, eliminarTanqueo, actualizarTanqueo,
    buscarTanqueo, listartanqueo, paginartanqueo, consultarTanqueos
};
