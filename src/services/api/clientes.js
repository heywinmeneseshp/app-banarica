import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarClientes = async (cliente) => {
    try {
        const url = endPoints.clientes.create;
        const response = await axios.post(url, cliente, config);
        return response.data;
    } catch (error) {
        throw new Error("Error al ingresar datos de cliente: " + error.message);
    }
};

const eliminarClientes = async(id) => {
    try {
        const res = await axios.delete(endPoints.clientes.delete(id));
        return res.data;
    } catch (error) {
        throw new Error("Error al eliminar cliente: " + error.message);
    }
};

const actualizarClientes = async(consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.clientes.update(consecutivo), changes);
        return res.data;
    } catch (error) {
        throw new Error("Error al actualizar cliente: " + error.message);
    }
};

const buscarClientes = async(consecutivo) => {
    try {
        const res = await axios.get(endPoints.clientes.findOne(consecutivo));
        return res.data;
    } catch (error) {
        throw new Error("Error al buscar cliente: " + error.message);
    }
};

const listarClientes = async() => {
    try {
        const res = await axios.get(endPoints.clientes.list);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar cliente: " + error.message);
    }
};

const paginarClientes = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.clientes.pagination(page, limit, nombre));
        return res.data;
    } catch (error) {
        throw new Error("Error al paginar cliente: " + error.message);
    }
};

export { 
    agregarClientes, 
    eliminarClientes, 
    actualizarClientes,
    buscarClientes, 
    listarClientes, 
    paginarClientes 
};
