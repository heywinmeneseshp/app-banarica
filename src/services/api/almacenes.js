import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarAlmacen = async (almacen) => {
   try {
    const url = endPoints.almacenes.create;
    const response = await axios.post(url, almacen, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos")
   }
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
        alert("Error al buscar almacen")
    } 
}

const listarAlmacenes = async() => {
    try {
        const res = await axios.get(endPoints.almacenes.list);
        return res.data
    } catch (e){
        alert("Error al listar almacenes")
    }
}

export { agregarAlmacen, eliminarAlmacen, actualizarAlmacen, buscarAlmacen, listarAlmacenes };