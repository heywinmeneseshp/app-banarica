import axios from "axios";
import endPoints from "@services/api/index";

const crearListado = async (body) => {
    const res = await axios.post(endPoints.listado.create, body);
    return res.data;
};

const actualizarListado = async (id, body) => {
    const res = await axios.patch(endPoints.listado.update(id), body);
    return res.data;
};

const encontrarListado = async (id) => {
    const res = await axios.get(endPoints.listado.findOne(id));
    return res.data;
};

const eliminarListado = async (body) => {
    const res = await axios.delete(endPoints.listado.delete(body));
    return res.data;
};


export {
    crearListado,
    actualizarListado,
    encontrarListado,
    eliminarListado
};