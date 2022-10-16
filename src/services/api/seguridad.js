import useDate from '@hooks/useDate';
import axios from 'axios';
import { agregarHistorial } from './historialMovimientos';
import endPoints from './index';
import { agregarRecepcion } from './recepcion';
import { sumar } from './stock';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const listarSeriales = async (offset, limit, body) => {
    try {
        let data = { data: body }
        if (limit) data = { ...data, pagination: { offset: offset, limit: limit } }
        const response = await axios.post(endPoints.seguridad.listarSeriales, data, config);
        return response.data;
    } catch (err) {
        alert("Error al listar seriales")
    }
}

const listarUsuariosSeguridad = async (offset, limit, username) => {
    try {
        const response = await axios.post(endPoints.seguridad.listarUsuarios, { offset, limit, username }, config);
        return response.data;
    } catch (err) {
        alert("Error al listar usuario seguridad")
    }
}

const cargarSeriales = async (dataExcel, remision, pedido, semana, fecha, observaciones) => {
    try {
        const res = dataExcel.find(item => item.cons_producto == null)
        if (res.cons_producto == null) return { message: "Existen artículos sin código ID.", bool: false }
        await axios.post(endPoints.seguridad.CargarSeriales, dataExcel)
        let data = {}
        dataExcel.map((item) => {
            if (data?.[item.cons_producto]) {
                data[item.cons_producto] = data?.[item.cons_producto] + 1

            } else {
                data[item.cons_producto] = 1
            }
        })
        const productList = Object.keys(data)
        const body = {
            remision: remision,
            fecha: fecha,
            cons_semana: semana,
            observaciones: observaciones
        }
        agregarRecepcion(body).then((res) => {
            console.log(res)
            productList.map(item => {
                const almacen = dataExcel[1].cons_almacen;
                const cons_producto = item;
                const cantidad = data[item];
                const consMovimiento = res.consecutivo;
                const dataHistorial = {
                    cons_movimiento: consMovimiento,
                    cons_producto: item,
                    cons_almacen_gestor: almacen,
                    cons_almacen_receptor: almacen,
                    cons_lista_movimientos: "RC",
                    tipo_movimiento: "Entrada",
                    cantidad: cantidad,
                    cons_pedido: pedido
                }
                sumar(almacen, cons_producto, cantidad);
                agregarHistorial(dataHistorial)
            })
        })
        return { message: "Se han cargado los datos con éxito.", bool: true }
    } catch (e) {
        throw e
    }

}

const actualizarSeriales = async (dataList) => {
    try {
        const response = await axios.patch(endPoints.seguridad.ActualizarSeriales, dataList);
        return response.data
    } catch (e) {
        alert("Error al actualizar data list")
    }
}

const listarProductosSeguridad = async () => {
    try {
        const response = await axios.get(endPoints.seguridad.listarProductos);
        return response.data
    } catch (e) {
        alert("Error al listar productos de seguridad")
    }
}
export {
    listarSeriales, listarUsuariosSeguridad, cargarSeriales,
    actualizarSeriales, listarProductosSeguridad
};