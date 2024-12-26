import axios from "axios";
import endPoints from "@services/api/index";

const crearBuques = async (body) => {
    const res = await axios.post(endPoints.Buques.create, body);
    return res.data;
};

const actualizarBuques = async (id, body) => {
    const res = await axios.patch(endPoints.Buques.update(id), body);
    return res.data;
};

const listarBuques = async () => {
    const res = await axios.get(endPoints.Buques.list);
    return res.data;
};

const encontrarBuques = async (id) => {
    const res = await axios.get(endPoints.Buques.findOne(id));
    return res.data;
};

const paginarBuques = async (offset, limit, buque) => {
    const res = await axios.get(endPoints.Buques.paginar(offset, limit, buque));
    return res.data;
};

const eliminarBuques = async (body) => {
    const res = await axios.delete(endPoints.Buques.delete(body));
    return res.data;
};


export {
    listarBuques,
    crearBuques,
    actualizarBuques,
    paginarBuques,
    encontrarBuques,
    eliminarBuques
};