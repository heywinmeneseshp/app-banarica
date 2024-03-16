import axios from 'axios';
import endPoints from './index';

const agregarProveedor = async (Proveedor) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    try {
        const url = endPoints.proveedores.create;
        const response = await axios.post(url, Proveedor, config);
        return response.data;
    } catch {
        alert("Error al crear proveedor");
    }
};

const eliminarProveedor = async (consecutivo) => {
    try {
        const res = await axios.delete(endPoints.proveedores.delete(consecutivo));
        return res.data;
    } catch {
        alert("Error al eliminar el proveedor");
    }
};

const actualizarProveedor = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.proveedores.update(id), changes);
        return res.data;
    } catch {
        alert("Error al actualizar proveedor");
    }
};

const buscarProveedor = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.proveedores.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert("Error al buscar proveedor");
    }
};

const listarProveedores = async () => {
    try {
        const res = await axios.get(endPoints.proveedores.list);
        return res.data;
    } catch {
        alert("Error al listar proveedores");
    }
};

const paginarProveedores = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.proveedores.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar proveedores");
    }
};

export {
    agregarProveedor, eliminarProveedor, actualizarProveedor,
    buscarProveedor, listarProveedores, paginarProveedores
};