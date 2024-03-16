import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarRutas = async (rutas) => {
    try {
        const url = endPoints.rutas.create;
        const response = await axios.post(url, rutas, config);
        return response.data;
    } catch (error) {
        throw new Error("Error al ingresar datos de rutas: " + error.message);
    }
};


const buscarRutaPost = async (rutas) => {
    try {
        const url = endPoints.rutas.findWhere;
        const response = await axios.post(url, rutas,config);
        return response.data;
    } catch (error) {
        throw new Error("Error al ingresar datos de rutas: " + error.message);
    }
};

const eliminarRutas = async(id) => {
    try {
        const res = await axios.delete(endPoints.rutas.delete(id));
        return res.data;
    } catch (error) {
        throw new Error("Error al eliminar rutas: " + error.message);
    }
};

const actualizarRutas = async(consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.rutas.update(consecutivo), changes);
        return res.data;
    } catch (error) {
        throw new Error("Error al actualizar rutas: " + error.message);
    }
};

const buscarRutas = async(consecutivo) => {
    try {
        const res = await axios.get(endPoints.rutas.findOne(consecutivo));
        return res.data;
    } catch (error) {
        throw new Error("Error al buscar rutas: " + error.message);
    }
};

const listarRutas = async() => {
    try {
        const res = await axios.get(endPoints.rutas.list);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar rutas: " + error.message);
    }
};

const paginarRutas = async (page, limit, nombre) => {
    try {
        let res = await axios.get(endPoints.rutas.pagination(page, limit, nombre));
        res.data.data.map((item, index)=>{
            res.data.data[index].origen =  item.ubicacion_1.ubicacion;
            res.data.data[index].destino =  item.ubicacion_2.ubicacion;
        });
        return res.data;
    } catch (error) {
        throw new Error("Error al paginar rutas: " + error.message);
    }
};

const consultarGalonesPorRuta = async () => {
    try {
        const res = await axios.get(endPoints.galonesPorRuta.consultar);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar rutas: " + error.message);
    }
};

const actualizarGalonesPorRuta = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.galonesPorRuta.update(id), changes);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar rutas: " + error.message);
    }
};

export { 
    agregarRutas, 
    eliminarRutas, 
    actualizarRutas,
    buscarRutas, 
    listarRutas, 
    paginarRutas,
    buscarRutaPost,
    consultarGalonesPorRuta,
    actualizarGalonesPorRuta
};
