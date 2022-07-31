import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarHistorial = async (data) => {
    try {
        const response = await axios.post(endPoints.historial.create, data, config);
        return response.data;
    } catch (err) {
        throw {message: "Se ha presentado un error"}
    }
}


const eliminarHistorial = async (id) => {
    const res = await axios.delete(endPoints.historial.delete(id));
    return res.data
}

const actualizarHistorial = async (id, changes) => {
    const res = await axios.patch(endPoints.historial.update(id), changes)
    return res.data
}

const buscarHistorial = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.historial.findOne(consecutivo));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarHistorial = async () => {
    try {
        const res = await axios.get(endPoints.historial.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarHistorial, eliminarHistorial, actualizarHistorial, buscarHistorial, listarHistorial };