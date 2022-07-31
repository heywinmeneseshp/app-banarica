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
        throw {message: "Se ha presentado un error"}
    }
}


const eliminarRecepcion = async (id) => {
    const res = await axios.delete(endPoints.recepcion.delete(id));
    return res.data
}

const actualizarRecepcion = async (id, changes) => {
    const res = await axios.patch(endPoints.recepcion.update(id), changes)
    return res.data
}

const buscarRecepcion = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.recepcion.findOne(consecutivo));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarRecepcion = async () => {
    try {
        const res = await axios.get(endPoints.recepcion.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarRecepcion, eliminarRecepcion, actualizarRecepcion, buscarRecepcion, listarRecepcion };