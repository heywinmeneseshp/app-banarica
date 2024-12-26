import axios from 'axios';
import endPoints from './index';

const agregarTransbordo = async (Transbordo) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    try {
        const url = endPoints.Transbordo.create;
        const response = await axios.post(url, Transbordo, config);
        return response.data;
    } catch {
        alert("Error al crear Transbordo");
    }
};

const eliminarTransbordo = async (consecutivo) => {
    try {
        const res = await axios.delete(endPoints.Transbordo.delete(consecutivo));
        return res.data;
    } catch {
        alert("Error al eliminar el Transbordo");
    }
};

const actualizarTransbordo = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.Transbordo.update(id), changes);
        return res.data;
    } catch {
        alert("Error al actualizar Transbordo");
    }
};

const buscarTransbordo = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.Transbordo.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert("Error al buscar Transbordo");
    }
};

const listarTransbordo = async () => {
    try {
        const res = await axios.get(endPoints.Transbordo.list);
        return res.data;
    } catch {
        alert("Error al listar.Transbordo");
    }
};

const paginarTransbordo = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.Transbordo.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar.Transbordo");
    }
};

export {
    agregarTransbordo, eliminarTransbordo, actualizarTransbordo,
    buscarTransbordo, listarTransbordo, paginarTransbordo
};