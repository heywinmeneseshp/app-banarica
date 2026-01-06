import axios from "axios";
import endPoints from "@services/api/index";

const crearInspeccion = async (body) => {
    const res = await axios.post(endPoints.inspecciones, body);
    return res.data;
};

const actualizarInspeccion = async (id, body) => {
    const res = await axios.patch(endPoints.inspecciones.update(id), body);
    return res.data;
};


const paginarInspecciones = async (offset, limit, body) => {
    if (!limit) limit = 50;
    const res = await axios.post(endPoints.inspecciones.pagination(offset,limit), body);
    return res.data;
};

const eliminarInspeccion = async (id) => {
    const res = await axios.delete(endPoints.listado.delete(id));
    return res.data;
};


export {
    crearInspeccion,
    actualizarInspeccion,
    paginarInspecciones,
    eliminarInspeccion
};