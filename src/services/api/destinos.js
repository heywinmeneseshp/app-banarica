import axios from "axios";
import endPoints from "@services/api/index";

const crearDestinos = async (body) => {
    const res = await axios.post(endPoints.Destinos.create, body);
    return res.data;
};

const actualizarDestinos = async (id, body) => {
    const res = await axios.patch(endPoints.Destinos.update(id), body);
    return res.data;
};

const listarDestinos = async () => {
    const res = await axios.get(endPoints.Destinos.list);
    return res.data;
};

const encontrarDestinos = async (id) => {
    const res = await axios.get(endPoints.Destinos.findOne(id));
    return res.data;
};

const paginarDestinos = async (offset, limit, nombre) => {
    const res = await axios.get(endPoints.Destinos.paginar(offset, limit, nombre));
    return res.data;
};

const eliminarDestinos = async (body) => {
    const res = await axios.delete(endPoints.Destinos.delete(body));
    return res.data;
};


export {
    listarDestinos,
    crearDestinos,
    actualizarDestinos,
    paginarDestinos,
    encontrarDestinos,
    eliminarDestinos
};