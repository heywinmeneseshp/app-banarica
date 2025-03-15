import axios from "axios";
import endPoints from "@services/api/index";

const crearMotivoDeUso = async (body) => {
    const res = await axios.post(endPoints.motivoDeUso.create, body);
    return res.data;
};

const actualizarMotivoDeUso = async (id, body) => {
    const res = await axios.patch(endPoints.motivoDeUso.update(id), body);
    return res.data;
};

const listarMotivoDeUso = async () => {
    const res = await axios.get(endPoints.motivoDeUso.list);
    return res.data;
};

const encontrarMotivoDeUso = async (id) => {
    const res = await axios.get(endPoints.motivoDeUso.findOne(id));
    return res.data;
};

const paginarMotivoDeUso = async (offset, limit, motivoDeUso) => {
    const res = await axios.get(endPoints.motivoDeUso.paginar(offset, limit, motivoDeUso));
    return res.data;
};

const eliminarMotivoDeUso = async (id) => {
    const res = await axios.delete(endPoints.motivoDeUso.delete(id));
    return res.data;
};


export {
    listarMotivoDeUso,
    crearMotivoDeUso,
    actualizarMotivoDeUso,
    paginarMotivoDeUso,
    encontrarMotivoDeUso,
    eliminarMotivoDeUso
};