import axios from "axios";
import endPoints from "@services/api/index";

const encontrarModulo = async (modulo) => {
    const res = await axios.get(endPoints.confi.buscarModulo(modulo));
    return res.data;
};

const actualizarModulo = async (dataModulo) => {
    const res = await axios.patch(endPoints.confi.actualizarModulo, dataModulo);
    return res.data;
}; 

const encontrarEmpresa = async () => {
    const res = await axios.get(endPoints.confi.encontrarEmpresa);
    return res.data;
};

const actualizarEmpresa = async (body) => {
    const res = await axios.patch(endPoints.confi.actualizarEmpresa, body);
    return res.data;
};


export {
encontrarModulo,
actualizarModulo,
encontrarEmpresa,
actualizarEmpresa

};