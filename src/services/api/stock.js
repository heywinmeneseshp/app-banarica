import axios from 'axios';
import endPoints from './index';

const crearStock = async (cons_almacen, cons_producto, bool) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };

    const body = {
        cons_almacen: cons_almacen,
        cons_producto: cons_producto,
        cantidad: 0,
        isBlock: bool
    }
    const url = endPoints.stock.create;
    console.log(url)
    const response = await axios.post(url, body, config);
    console.log(response.data)
    return response.data;
}

const eliminarStock = async (cons_almacen, cons_producto) => {
    const res = await axios.delete(endPoints.stock.delete(cons_almacen, cons_producto));
    return res.data
}

const sumar = async (cons_almacen, cons_producto, cantidad) => {
    const res = await axios.patch(endPoints.stock.add(cons_almacen, cons_producto), { cantidad: cantidad })
    return res.data
}

const restar = async (cons_almacen, cons_producto, cantidad) => {
    const res = await axios.patch(endPoints.stock.subtract(cons_almacen, cons_producto), { cantidad: cantidad })
    return res.data
}

const listarUnProductoEnAlmacenes = async (cons_producto) => {
    try {
        const res = await axios.get(endPoints.stock.findOneProductInAll(cons_producto));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarProductosEnUnAlmacen = async (cons_almacen) => {
    try {
        const res = await axios.get(endPoints.stock.findOneAlmacen(cons_almacen));
        return res.data
    } catch {
        console.log(e)
    }
}

const habilitarProductoEnAlmacen = async (cons_almacen, cons_producto, bool) => {
    console.log(cons_almacen, cons_producto)
    try {
        await axios.get(endPoints.stock.filterAlmacenAndProduct(cons_almacen, cons_producto))
        await axios.patch(endPoints.stock.enable(cons_almacen,cons_producto), {isBlock: bool})
    } catch (e) {
        crearStock(cons_almacen, cons_producto, bool)
    }


}

const filtrarPorProductoYAlmacen = async (cons_almacen, cons_producto) => {
    try {
        const res = await axios.get(endPoints.stock.filterAlmacenAndProduct(cons_almacen, cons_producto));
        return res.data
    } catch (e) {
        console.log("Se ha presentado un error")
    }
}





export {
    habilitarProductoEnAlmacen,
    listarProductosEnUnAlmacen,
    listarUnProductoEnAlmacenes,
    restar,
    sumar,
    eliminarStock,
    crearStock,
    filtrarPorProductoYAlmacen
};