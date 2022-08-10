import axios from 'axios';
import endPoints from './index';

const agregarProducto = async (Producto) => {
    try {
        const config = {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };
        const url = endPoints.productos.create;
        const response = await axios.post(url, Producto, config);
        return response.data.data;
    } catch (e) {
        alert('Se ha presentado un error al crear el producto')
    }
}

const eliminarProducto = async (consecutivo) => {
    const res = await axios.delete(endPoints.productos.delete(consecutivo));
    return res.data
}

const actualizarProducto = async (id, changes) => {
    const res = await axios.patch(endPoints.productos.update(id), changes)
    return res.data.data
}

const buscarProducto = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.productos.findOne(consecutivo));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarProductos = async () => {
    try {
        const res = await axios.get(endPoints.productos.list);
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const encontrarProductosPorCategoria = async (categoria) => {
    try {
        const res = await axios.get(endPoints.productos.findAllByCategory(categoria));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

export { agregarProducto, eliminarProducto, actualizarProducto, buscarProducto, listarProductos, encontrarProductosPorCategoria };