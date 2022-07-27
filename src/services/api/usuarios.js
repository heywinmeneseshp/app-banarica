import axios from 'axios';
import endPoints from './index';

const agregarUsuario = async (usuario) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = endPoints.usuarios.create;
    const response = await axios.post(url, usuario, config);
    return response.data;
}

const eliminarUsuario = async (username) => {
    const res = await axios.delete(endPoints.usuarios.delete(username));
    return res.data
}

const actualizarUsuario = async (username, changes) => {
    const res = await axios.patch(endPoints.usuarios.update(username), changes)
    return res.data
}

const buscarUsuario = async (username) => {
    try {
        const res = await axios.get(endPoints.usuarios.findOne(username));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarUsuarios = async () => {
    try {
        const res = await axios.get(endPoints.usuarios.list);
        return res.data
    } catch {
        console.log(e)
    }
}

const listarAlmacenesPorUsuario = async (username) => {
    try {
        const res = await axios.get(endPoints.usuarios.almacenes.list(username))
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const cargarAlmacenesPorUsuario = async (username, id_almacen, habilitado) => {
    let data = { username: username, id_almacen: id_almacen, habilitado: habilitado }
    try {
        const existe = await axios.get(endPoints.usuarios.almacenes.findAlmacenByUsername(username, id_almacen))
        if (existe.data == null) {
            const res = await axios.post(endPoints.usuarios.almacenes.create, data)
            console.log("item creado")
        } else {
            const res = await axios.patch(endPoints.usuarios.almacenes.update, data)
            console.log("item actualizado")
        }
        } catch (e) {
            console.log(e)
        }
}

export {
    agregarUsuario,
    cargarAlmacenesPorUsuario,
    eliminarUsuario, actualizarUsuario, buscarUsuario, listarUsuarios, listarAlmacenesPorUsuario
};