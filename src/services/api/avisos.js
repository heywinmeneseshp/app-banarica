import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarAviso = async (data) => {
    try {
        const response = await axios.post(endPoints.avisos.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al crear la notificacion")
    }
}

const eliminarAviso = async (id) => {
    const res = await axios.delete(endPoints.avisos.delete(id));
    return res.data
}

const actualizarAvisos = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.avisos.update(id), changes)
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const buscarAviso = async (id) => {
    try {
        const res = await axios.get(endPoints.avisos.findOne(id));
        return res.data
    } catch (e) {
        alert("La notificacion no existe")
    }
}

const listarAvisos = async () => {
    try {
        const res = await axios.get(endPoints.avisos.list);
        return res.data
    } catch {
        alert("Error al listar las avisos")
    }
}



export { agregarAviso, eliminarAviso, actualizarAvisos, buscarAviso, listarAvisos };