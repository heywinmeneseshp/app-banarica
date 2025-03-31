import axios from "axios";
import endPoints from "@services/api/index";

const crearMotivoDeRechazo = async (body) => {
    const res = await axios.post(endPoints.motivoDeRechazo.create, body);
    return res.data;
};

const actualizarMotivoDeRechazo = async (id, body) => {
    const res = await axios.patch(endPoints.motivoDeRechazo.update(id), body);
    return res.data;
};

const listarMotivoDeRechazo = async () => {
    const res = await axios.get(endPoints.motivoDeRechazo.list);
    return res.data;
};

const encontrarMotivoDeRechazo = async (id) => {
    const res = await axios.get(endPoints.motivoDeRechazo.findOne(id));
    return res.data;
};

const paginarMotivoDeRechazo = async (offset, limit, motivoDeRechazo) => {
    const res = await axios.get(endPoints.motivoDeRechazo.pagination(offset, limit, motivoDeRechazo));
    return res.data;
};

const eliminarMotivoDeRechazo = async (id) => {
    const res = await axios.delete(endPoints.motivoDeRechazo.delete(id));
    return res.data;
};


export {
    listarMotivoDeRechazo,
    crearMotivoDeRechazo,
    actualizarMotivoDeRechazo,
    paginarMotivoDeRechazo,
    encontrarMotivoDeRechazo,
    eliminarMotivoDeRechazo
};