import axios from "axios";
import endPoints from "@services/api/index";

const crearContenedor = async (body) => {
    const res = await axios.post(endPoints.contenedores.create(body));
    return res.data;
};

const actualizarContenedor = async (id, body) => {
    const res = await axios.patch(endPoints.contenedores.update(id), body);
    return res.data;
};

const encontrarContenedor = async (id) => {
    const res = await axios.get(endPoints.contenedores.findOne(id));
    return res.data;
};

const eliminarContenedor = async (body) => {
    const res = await axios.delete(endPoints.contenedores.delete(body));
    return res.data;
};


export {
    crearContenedor,
    actualizarContenedor,
    encontrarContenedor,
    eliminarContenedor
};