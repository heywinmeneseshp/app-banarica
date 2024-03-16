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
        alert('Se ha presentado un error al crear el producto');
    }
};

const eliminarProducto = async (consecutivo) => {
    const res = await axios.delete(endPoints.productos.delete(consecutivo));
    return res.data;
};

const actualizarProducto = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.productos.update(id), changes);
        return res.data.data;
    } catch {
        alert("Se ha presentado un error al actualizar el producto");
    }
};

const buscarProducto = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.productos.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert("Error al buscar producto");
    }
};

const filtrarProductos = async (body) => {
    try {
        const res = await axios.post(endPoints.productos.filter, body);
        return res.data;
    } catch (e) {
        alert("Error al filtrar productos");
    }
};

const listarProductos = async () => {
    try {
        const res = await axios.get(endPoints.productos.list);
        return res.data;
    } catch (e) {
        alert("Error al listar productos");
    }
};

const encontrarProductosPorCategoria = async (categoria) => {
    try {
        const res = await axios.get(endPoints.productos.findAllByCategory(categoria));
        return res.data;
    } catch (e) {
        alert("Error al encontrar producto por categoría");
    }
};

export {
    agregarProducto, eliminarProducto,
    actualizarProducto, 
    buscarProducto, 
    listarProductos,
    encontrarProductosPorCategoria,
    filtrarProductos
};