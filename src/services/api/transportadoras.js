import axios from 'axios';
import endPoints from './index';

const agregarTransportadora = async (Transportadora) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = endPoints.transportadoras.create;
    try {
        const response = await axios.post(url, Transportadora, config);
        return response.data;
    } catch (err) {
        console.log(err)
    }
}

const eliminarTransportadora = async (consecutivo) => {
    const res = await axios.delete(endPoints.transportadoras.delete(consecutivo));
    return res.data
}

const actualizarTransportadora = async (id, changes) => {
    console.log(id, changes)
    const res = await axios.patch(endPoints.transportadoras.update(id), changes)
    return res.data
}

const buscarTransportadora = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.transportadoras.findOne(consecutivo));
        return res.data
    } catch (e) {
        alert("Error al buscar Transportadora")
    }
}

const listarTransportadoras = async () => {
    try {
        const res = await axios.get(endPoints.transportadoras.list);
        return res.data
    } catch {
        alert("Error al listar Transportadoras")
    }
}

export { agregarTransportadora, eliminarTransportadora, actualizarTransportadora, buscarTransportadora, listarTransportadoras };