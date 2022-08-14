import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: '*/*',
        'Content-Type': 'application/json'
    }
};

const agregarUsuario = async (usuario) => {
    try {
        const url = endPoints.usuarios.create;
        const response = await axios.post(url, usuario, config);
        return response.data;
    } catch (e) {
        alert("Se ha presentado un error al agregar al usuario")
    }
}

const eliminarUsuario = async (username) => {
    try {
        const res = await axios.delete(endPoints.usuarios.delete(username));
        return res.data
    } catch (e) {
        alert("Se ha presentado en erro al eliminar el usuario")
    }
}

const actualizarUsuario = async (username, changes) => {
    try {
        const res = await axios.patch(endPoints.usuarios.update(username), changes)
        return res.data
    } catch (e) {
        alert("Se ha presentado un error al actualizar el usuario")
    }
}

const buscarUsuario = async (username) => {
    try {
        const res = await axios.get(endPoints.usuarios.findOne(username), config);
        return res.data
    } catch (e) {
        alert("Se ha presentado un error al buscar el usuario")
    }
}

const listarUsuarios = async () => {
    try {
        const res = await axios.get(endPoints.usuarios.list);
        return res.data
    } catch {
        alert("Se ha presnetado un erro al listar los usuarios")
    }
}

const listarAlmacenesPorUsuario = async (username) => {
    try {
        const res = await axios.get(endPoints.usuarios.almacenes.list(username))
        return res.data
    } catch (e) {
        alert("Se ha presentado un error al listar almacenes por usuario")
    }
}

const cargarAlmacenesPorUsuario = async (username, id_almacen, habilitado) => {
    let data = { username: username, id_almacen: id_almacen, habilitado: habilitado }
    try {
        const result = await axios.patch(endPoints.usuarios.almacenes.update, data)
        return result.data
    } catch (e) {
        alert("Se ha presentado un error al cargar almacenes por usuario")
    }
}

export {
    agregarUsuario,
    cargarAlmacenesPorUsuario,
    eliminarUsuario, actualizarUsuario, buscarUsuario, listarUsuarios, listarAlmacenesPorUsuario
};