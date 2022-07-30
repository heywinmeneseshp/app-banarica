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
    console.log(data)
    try {
        const response = await axios.post(endPoints.pedidos.create, data, config);
        return response.data;
    } catch (err) {
        throw {message: "Se ha presentado un error"}
    }
}

const agregarTablePedido =  async (data) => {
    try {
        const response = await axios.post(endPoints.pedidos.createTable, data, config)
        return response.data
    } catch (e) {
        console.log(e)
    }
}

const eliminarPedido = async (consecutivo) => {
    const res = await axios.delete(endPoints.pedidos.delete(consecutivo));
    return res.data
}

const actualizarPedido = async (id, changes) => {
    const res = await axios.patch(endPoints.pedidos.update(id), changes)
    return res.data
}

const buscarPedido = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.pedidos.findOne(consecutivo));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarPedidos = async () => {
    try {
        const res = await axios.get(endPoints.pedidos.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarPedido, eliminarPedido, actualizarPedido, buscarPedido, listarPedidos, agregarTablePedido };