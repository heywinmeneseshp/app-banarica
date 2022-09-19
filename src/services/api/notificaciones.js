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
        if (data.tipo_movimiento == "Traslado" || data.tipo_movimiento == "Devolucion" || data.tipo_movimiento == "Liquidacion" || data.tipo_movimiento == "Pedido") {
            const response = await axios.post(endPoints.notificaciones.create, data, config);
            return response.data;
        } else {
            const usuarios = await axios.get(endPoints.usuarios.almacenes.findUsersByAlamcen(data.almacen_receptor));
            if (usuarios.data.habilitado != 0) {
                usuarios.data.map(async (item) => {
                    if (item.habilitado == true) {
                        let newData = data
                        newData.descripcion = "sin revisar"
                        newData.aprobado = true
                        newData.almacen_receptor = item.username
                        newData.visto = false
                        await axios.post(endPoints.notificaciones.create, newData, config);
                    }
                })
            }
        }
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


const filtrarNotificaciones = async (data) => {
    try {
        const res = await axios.post(endPoints.notificaciones.filter, data)
        console.log(res.data)
        return res.data
    } catch (e) {
        alert("No se han encontrado notificaciones")
    }
}



export { agregarNotificaciones, eliminarNotificaciones, actualizarNotificaciones, buscarNotificaciones, listarNotificaciones, filtrarNotificaciones };