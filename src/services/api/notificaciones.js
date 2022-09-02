import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarNotificaciones = async (data) => {
    try {
        const response = await axios.post(endPoints.notificaciones.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al crear la notificacion")
    }
}

const eliminarNotificaciones = async (consecutivo) => {
    const res = await axios.delete(endPoints.notificaciones.delete(consecutivo));
    return res.data
}

const actualizarNotificaciones = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.notificaciones.update(id), changes)
        return res.data
    } catch (e) {
        alert("Se ha presentado un error al actualizar la notificación")
    }
}

const buscarNotificaciones = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.notificaciones.findOne(consecutivo));
        return res.data
    } catch (e) {
        alert("La notificacion no existe")
    }
}

const listarNotificaciones = async () => {
    try {
        const res = await axios.get(endPoints.notificaciones.list);
        return res.data
    } catch {
        alert("Error al listar las notificaciones")
    }
}


const filtrarNotificaciones = async (url) => {
    try {
        const res = await axios.get(endPoints.notificaciones.filter(url))
        return res.data
    } catch (e) {
        alert("No se han encontrado notificaciones para el almacen")
    }
}

const filtrarNotificacionesPorAlmacen = async (data) => {
    try {
        const res = await axios.post(endPoints.notificaciones.filterPost, data)
        return res.data
    } catch (e) {
        alert("No se han encontrado notificaciones para el almacen")
    }
}


export { agregarNotificaciones, eliminarNotificaciones, actualizarNotificaciones, buscarNotificaciones, listarNotificaciones, filtrarNotificaciones, filtrarNotificacionesPorAlmacen };