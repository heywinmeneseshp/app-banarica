import axios from 'axios';
import endPoints from './index';

const agregarCategorias = async (Categorias) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const body = { nombre: Categorias.nombre, isBlock: Categorias.isBlock }
    const url = endPoints.categorias.create;
    const response = await axios.post(url, body, config);
    console.log(response.data)
    return response.data;
}

const eliminarCategorias = async (consecutivo) => {
    const res = await axios.delete(endPoints.categorias.delete(consecutivo));
    return res.data
}

const actualizarCategorias = async (id, changes) => {
    const res = await axios.patch(endPoints.categorias.update(id), changes)
    return res.data
}

const buscarCategorias = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.categorias.findOne(consecutivo));
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const listarCategorias = async () => {
    try {
        const res = await axios.get(endPoints.categorias.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarCategorias, eliminarCategorias, actualizarCategorias, buscarCategorias, listarCategorias };