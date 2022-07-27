import axios from 'axios';
import endPoints from './index';

const agregarProveedor = async (Proveedor) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = endPoints.proveedores.create;
    const response = await axios.post(url, Proveedor, config);
    console.log(response.data)
    return response.data;
}

const eliminarProveedor = async(consecutivo) => {
    const res = await axios.delete(endPoints.proveedores.delete(consecutivo));
    return res.data
}

const actualizarProveedor = async(id, changes) => {
    const res = await axios.patch(endPoints.proveedores.update(id), changes)
    return res.data
}

const buscarProveedor = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.proveedores.findOne(consecutivo));
    return res.data
    } catch (e) {
        console.log(e)
    } 
}

const listarProveedores = async() => {
    try {
        const res = await axios.get(endPoints.proveedores.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarProveedor, eliminarProveedor, actualizarProveedor, buscarProveedor, listarProveedores };