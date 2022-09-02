import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarRecepcion = async (data) => {
    try {
        const response = await axios.post(endPoints.recepcion.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al agregar recepción")
    }
}

const eliminarRecepcion = async (id) => {
    try {
    const res = await axios.delete(endPoints.recepcion.delete(id));
    return res.data
    } catch {
        alert("Error al eliminar la recepción")
    }
}

const actualizarRecepcion = async (id, changes) => {
    try {
    const res = await axios.patch(endPoints.recepcion.update(id), changes)
    return res.data
    } catch {
        alert("Error al actualizar la recepción")
    }
}

const buscarRecepcion = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.recepcion.findOne(consecutivo));
        return res.data
    } catch (e) {
        alert("Error al buscar la recepción")
    }
}

const listarRecepcion = async () => {
    try {
        const res = await axios.get(endPoints.recepcion.list);
        return res.data
    } catch {
        alert("Error al listar la recepción")
    }
}

export { agregarRecepcion, eliminarRecepcion, actualizarRecepcion, buscarRecepcion, listarRecepcion };