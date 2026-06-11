import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: '*/*',
        'Content-Type': 'application/json'
    }
};

const agregarUsuario = async (usuario) => {
    const url = endPoints.usuarios.create;
    const response = await axios.post(url, usuario, config);
    return response.data;
};

const eliminarUsuario = async (username) => {
    try {
        const res = await axios.delete(endPoints.usuarios.delete(username));
        return res.data;
    } catch (e) {
        alert("Se ha presentado en erro al eliminar el usuario");
    }
};

const actualizarUsuario = async (username, changes) => {
    const res = await axios.patch(endPoints.usuarios.update(username), changes);
    return res.data;
};

const buscarUsuario = async (username) => {
    try {
        const res = await axios.get(endPoints.usuarios.findOne(username), config);
        return res.data;
    } catch (e) {
        alert("Se ha presentado un error al buscar el usuario");
    }
};

const listarUsuarios = async () => {
    const res = await axios.get(endPoints.usuarios.list);
    return res.data;
};

const listarAlmacenesPorUsuario = async (username) => {
    const res = await axios.get(endPoints.usuarios.almacenes.list(username));
    return res.data;
};

const cargarAlmacenesPorUsuario = async (username, id_almacen, habilitado) => {
    let data = { username: username, id_almacen: id_almacen, habilitado: habilitado };
    const result = await axios.patch(endPoints.usuarios.almacenes.update, data);
    return result.data;
};

const listarTransportadorasPorUsuario = async (username) => {
    const res = await axios.get(endPoints.usuarios.transportadoras.list(username));
    return res.data;
};

const cargarTransportadorasPorUsuario = async (username, id_transportadora, habilitado) => {
    const data = { username, id_transportadora, habilitado };
    const result = await axios.patch(endPoints.usuarios.transportadoras.update, data);
    return result.data;
};

export {
    agregarUsuario,
    cargarAlmacenesPorUsuario,
    cargarTransportadorasPorUsuario,
    eliminarUsuario, actualizarUsuario, buscarUsuario, listarUsuarios, listarAlmacenesPorUsuario,
    listarTransportadorasPorUsuario
};
