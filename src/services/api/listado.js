import axios from "axios";
import endPoints from "@services/api/index";

const crearListado = async (body) => {
    const res = await axios.post(endPoints.listado.create, body);
    return res.data;
};

const duplicarListado =  async (id) => {
    const res = await axios.get(endPoints.listado.duplicar(id));
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

const paginarListado = async (offset, limit, body) => {
    console.log("este es el limit", limit)
    if (!limit) limit = 50;
    const res = await axios.post(endPoints.listado.paginar(offset,limit), body);
    return res.data;
};

const eliminarListado = async (id) => {
    const res = await axios.delete(endPoints.listado.delete(id));
    return res.data;
};


export {
    crearListado,
    duplicarListado,
    actualizarListado,
    paginarListado,
    encontrarListado,
    eliminarListado
};