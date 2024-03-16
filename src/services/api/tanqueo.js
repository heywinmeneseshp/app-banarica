import axios from 'axios';
import endPoints from './index';

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
    } catch {
        alert("Error al crear Tanqueo");
    }
};

const eliminarTanqueo = async (consecutivo) => {
    try {
        const res = await axios.delete(endPoints.tanqueo.delete(consecutivo));
        return res.data;
    } catch {
        alert("Error al eliminar el Tanqueo");
    }
};

const actualizarTanqueo = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.tanqueo.update(id), changes);
        return res.data;
    } catch {
        alert("Error al actualizar Tanqueo");
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
        return res.data;
    } catch (e) {
        alert("Error al buscar Tanqueo");
    }
};

const listartanqueo = async () => {
    try {
        const res = await axios.get(endPoints.tanqueo.list);
        return res.data;
    } catch {
        alert("Error al listar tanqueo");
    }
};

const paginartanqueo = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.tanqueo.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar tanqueo");
    }
};

export {
    agregarTanqueo, eliminarTanqueo, actualizarTanqueo,
    buscarTanqueo, listartanqueo, paginartanqueo, consultarTanqueos
};