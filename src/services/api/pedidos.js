import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const agregarPedido = async (cons_pedido, item) => {
    const data = {
        cons_pedido: cons_pedido,
        cons_producto: item.cons_producto,
        cons_almacen_destino: item.cons_almacen_destino,
        cantidad: item.cantidad
    }
    try {
        const response = await axios.post(endPoints.pedidos.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al agregar pedido")
    }
}

const agregarTablePedido = async (data) => {
    try {
        const response = await axios.post(endPoints.pedidos.createTable, data, config)
        return response.data
    } catch (e) {
        alert("Error al agregar tabla pedido")
    }
}

const eliminarPedido = async (consecutivo) => {
    const res = await axios.delete(endPoints.pedidos.delete(consecutivo));
    return res.data
}

const actualizarItemPedido = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.pedidos.update(id), changes)
        return res.data
    } catch {
        alert("Error al actualizar el item del pedido")
    }
}

const actualizarPedido = async (consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.pedidos.updatePedido(consecutivo), changes)
        return res.data
    } catch {
        alert("Erro al actualizar el pedido")
    }
}

const buscarPedido = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.pedidos.findOne(consecutivo));
        return res.data
    } catch (e) {
        alert("Error al buscar el pedido")
    }
}

const buscarDocumetoPedido = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.pedidos.findOneDocument(consecutivo));
        return res.data
    } catch (e) {
        alert("Se ha presentado un error al buscar el pedido")
    }
}

const filtrarPedidos = async (offset, limit, cons_almacen, cons_categoria, producto_name, semana) => {
    try {
        const data = {
            "page": offset,
            "limit": limit,
            "almacen": cons_almacen,
            "cons_categoria": cons_categoria,
            "producto": producto_name,
            "semana": semana
        }
        const res = await axios.post(endPoints.pedidos.pagination, data)
        return res.data
    } catch {
        alert("Error en el filtrado de los pedidos")
    }

}

const listarPedidos = async () => {
    try {
        const res = await axios.get(endPoints.pedidos.list);
        return res.data
    } catch {
        alert("Error al listar pedidos")
    }
}

export {
    agregarPedido,
    eliminarPedido,
    actualizarPedido,
    actualizarItemPedido,
    buscarDocumetoPedido,
    buscarPedido,
    listarPedidos,
    agregarTablePedido,
    filtrarPedidos
};