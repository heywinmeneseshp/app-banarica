import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarRechazo = async (data) => {
    try {
        const response = await axios.post(endPoints.rechazos.create, data, config);
        return response.data;
    } catch (err) {
        alert("Error al crear el Rechazo");
    }
};

const eliminarRechazo = async (consecutivo) => {
    const res = await axios.delete(endPoints.rechazos.delete(consecutivo));
    return res.data;
};

const actualizarRechazo = async (id, changes) => {
    const res = await axios.patch(endPoints.rechazos.update(id), changes);
    return res.data;
};

const buscarRechazo = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.rechazos.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert(`El Rechazo ${consecutivo} no existe`);
    }
};

const paginarRechazos = async (Page, limit, body) => {
    try {
        const res = await axios.post(endPoints.rechazos.pagination(Page, limit) , body);
        return res.data;
    } catch (e) {
        alert(`No se pueden paginar los Rechazos`);
    }
};


const listarRechazos = async () => {
    try {
        const res = await axios.get(endPoints.rechazos.list);
        return res.data;
    } catch {
        alert("Error al listar Rechazos");
    }
};

export { agregarRechazo, 
    eliminarRechazo, 
    actualizarRechazo, 
    buscarRechazo, 
    paginarRechazos,
    listarRechazos 
};