import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const listarSeriales = async (offset, limit, body) => {
    try {
        let data = { data: body }
        if (limit) data = { ...data, pagination: { offset: offset, limit: limit } }
        const response = await axios.post(endPoints.seguridad.listarSeriales, data, config);
        return response.data;
    } catch (err) {
        alert("Error al listar seriales")
    }
}

const listarUsuariosSeguridad = async (offset, limit, username) => {
    try {
        const response = await axios.post(endPoints.seguridad.listarUsuarios, { offset, limit, username }, config);
        return response.data;
    } catch (err) {
        alert("Error al listar usuario seguridad")
    }
}

const cargarSeriales = async (dataExcel) => {
    try {
        const response = await axios.post(endPoints.seguridad.CargarSeriales, dataExcel)
        return response.data
    } catch (e) {
        throw "Error, verifique no existan seriales repetidos"
    }
}

const actualizarSeriales = async (dataList) => {
    try {
        const response = await axios.patch(endPoints.seguridad.ActualizarSeriales, dataList);
        return response.data
    } catch (e) {
        alert("Error al actualizar data list")
    }
}

const listarProductosSeguridad = async () => {
    try{
        const response = await axios.get(endPoints.seguridad.listarProductos);
        return response.data
    } catch (e){
        alert("Error al listar productos de seguridad")
    }
}
 export {
    listarSeriales, listarUsuariosSeguridad, cargarSeriales,
    actualizarSeriales, listarProductosSeguridad
};