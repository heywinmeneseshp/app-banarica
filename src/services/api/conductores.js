import axios from 'axios';
import endPoints from './index';

const agregarConductor = async (Conductor) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = endPoints.conductores.create;
    const response = await axios.post(url, Conductor, config);
    return response.data;
}

const eliminarConductor = async(consecutivo) => {
    const res = await axios.delete(endPoints.conductores.delete(consecutivo));
    return res.data
}

const actualizarConductor = async(id, changes) => {
    const res = await axios.patch(endPoints.conductores.update(id), changes)
    return res.data
}

const buscarConductor = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.conductores.findOne(consecutivo));
    return res.data
    } catch (e) {
        alert("Se ha presentado un error al buscar el conductor")
    } 
}

const listarConductores = async() => {
    try {
        const res = await axios.get(endPoints.conductores.list);
        return res.data
    } catch {
        alert("Se ha presentado un error al listar los conductores")
    }
}

export { agregarConductor, eliminarConductor, actualizarConductor, buscarConductor, listarConductores };