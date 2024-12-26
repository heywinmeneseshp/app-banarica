import axios from "axios";
import endPoints from "@services/api/index";

const crearEmbarques = async (body) => {
    const res = await axios.post(endPoints.Embarques.create, body);
    return res.data;
};

const actualizarEmbarques = async (id, body) => {
    const res = await axios.patch(endPoints.Embarques.update(id), body);
    return res.data;
};

const listarEmbarques = async () => {
    const res = await axios.get(endPoints.Embarques.list);
    return res.data;
};

const encontrarEmbarques = async (id) => {
    const res = await axios.get(endPoints.Embarques.findOne(id));
    return res.data;
};

const paginarEmbarques = async (offset, limit, body) => {
    const res = await axios.post(endPoints.Embarques.paginar(offset, limit), body);
    return res.data;
};

const eliminarEmbarques = async (body) => {
    const res = await axios.delete(endPoints.Embarques.delete(body));
    return res.data;
};


export {
    listarEmbarques,
    crearEmbarques,
    actualizarEmbarques,
    paginarEmbarques,
    encontrarEmbarques,
    eliminarEmbarques
};