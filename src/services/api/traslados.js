import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarTraslado = async (data) => {
    try {
        const response = await axios.post(endPoints.traslados.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al crear el traslado")
    }
}

const eliminarTraslado = async (consecutivo) => {
    const res = await axios.delete(endPoints.traslados.delete(consecutivo));
    return res.data
}

const actualizarTraslado = async (id, changes) => {
    const res = await axios.patch(endPoints.traslados.update(id), changes)
    return res.data
}

const buscarTraslado = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.traslados.findOne(consecutivo));
        return res.data
    } catch (e) {
        alert("El traslado no existe")
    }
}

const listarTraslados = async () => {
    try {
        const res = await axios.get(endPoints.traslados.list);
        return res.data
    } catch {
        alert("Error al listar traslados")
    }
}

export { agregarTraslado, eliminarTraslado, actualizarTraslado, buscarTraslado, listarTraslados };