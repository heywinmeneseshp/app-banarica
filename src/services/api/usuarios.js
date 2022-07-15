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
    const response = await axios.post(url, usuario);
    return response.data;
}

const eliminarProdcuto = async(username) => {
    const res = await axios.delete(endPoints.usuarios.delete(username));
    return res.data
}

export { agregarUsuario, eliminarProdcuto };