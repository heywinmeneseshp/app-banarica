import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarProgramaciones = async (programaciones) => {
   try {
    const url = endPoints.programaciones.create;
    const response = await axios.post(url, programaciones, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos");
   }
};

const eliminarProgramaciones = async(consecutivo) => {
    const res = await axios.delete(endPoints.programaciones.delete(consecutivo));
    return res.data;
};

const actualizarProgramaciones = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.programaciones.update(consecutivo), changes);
    return res.data;
};

const buscarProgramaciones = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.programaciones.findOne(consecutivo));
    return res.data;
    } catch (e) {
        alert("Error al buscar programaciones");
    } 
};

const listarProgramaciones = async() => {
    try {
        const res = await axios.get(endPoints.programaciones.list);
        return res.data;
    } catch (e){
        alert("Error al listar programaciones");
    }
};

const paginarProgramaciones = async (page, limit, body) => {
    try {
        const res = await axios.post(endPoints.programaciones.pagination(page, limit), body);
        return res.data;
    } catch {
        alert("Error al paginar proveedores");
    }
};

export { agregarProgramaciones, eliminarProgramaciones, actualizarProgramaciones,
     buscarProgramaciones, listarProgramaciones, paginarProgramaciones };