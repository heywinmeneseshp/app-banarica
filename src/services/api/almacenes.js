import axios from 'axios';
import endPoints from './index';

const agregarAlmacen = async (almacen) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = endPoints.almacenes.create;
    const response = await axios.post(url, almacen, config);
    return response.data;
}

const eliminarAlmacen = async(consecutivo) => {
    const res = await axios.delete(endPoints.almacenes.delete(consecutivo));
    return res.data
}

const actualizarAlmacen = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.almacenes.update(consecutivo), changes)
    return res.data
}

const buscarAlmacen = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.almacenes.findOne(consecutivo));
    return res.data
    } catch (e) {
        console.log(e)
    } 
}

const listarAlmacenes = async() => {
    try {
        const res = await axios.get(endPoints.almacenes.list);
        return res.data
    } catch {
        console.log(e)
    }
}

export { agregarAlmacen, eliminarAlmacen, actualizarAlmacen, buscarAlmacen, listarAlmacenes };