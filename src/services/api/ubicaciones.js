import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarUbicacion = async (Ubicacion) => {
    try {
        const url = endPoints.ubicaciones.create;
        const response = await axios.post(url, Ubicacion, config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al ingresar ubicacion: ${message}`);
    }
};

const eliminarUbicacion = async(consecutivo) => {
    try {
        const res = await axios.delete(endPoints.ubicaciones.delete(consecutivo));
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al eliminar ubicacion: ${message}`);
    }
};

const actualizarUbicacion = async(consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.ubicaciones.update(consecutivo), changes);
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al actualizar ubicacion: ${message}`);
    }
};

const buscarUbicacion = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.ubicaciones.findOne(consecutivo));
    return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al buscar ubicacion: ${message}`);
    } 
};

const listarUbicaciones = async() => {
    try {
        const res = await axios.get(endPoints.ubicaciones.list);
        return res.data;
    } catch (error){
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al listar ubicaciones: ${message}`);
    }
};

const paginarUbicaciones = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.ubicaciones.pagination(page, limit, nombre));
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(`Error al paginar ubicaciones: ${message}`);
    }
};

export { agregarUbicacion, eliminarUbicacion, actualizarUbicacion,
     buscarUbicacion, listarUbicaciones, paginarUbicaciones };
