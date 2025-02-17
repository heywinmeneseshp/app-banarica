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
    alert("Error al ingresar datos");
   }
};

const eliminarAlmacen = async(id) => {
    const res = await axios.delete(endPoints.almacenes.delete(id));
    return res.data;
};

const actualizarAlmacen = async(id, changes) => {
    const res = await axios.patch(endPoints.almacenes.update(id), changes);
    return res.data;
};

const buscarAlmacen = async(id) => {
    try {
    const res = await axios.get(endPoints.almacenes.findOne(id));
    return res.data;
    } catch (e) {
        alert("Error al buscar almacen");
    } 
};

const listarAlmacenes = async() => {
    try {
        const res = await axios.get(endPoints.almacenes.list);
        return res.data;
    } catch (e){
        alert("Error al listar almacenes");
    }
};

const paginarAlmacenes = async (offset, limit, alamacen) => {
    const res = await axios.get(endPoints.almacenes.pagination(offset, limit, alamacen));
    return res.data;
};


export { agregarAlmacen, eliminarAlmacen, actualizarAlmacen, buscarAlmacen, listarAlmacenes, paginarAlmacenes };