import axios from 'axios';
import endPoints from './index';


const crearEtiqueta = async (data) => {
    try {
        const res = await axios.post(endPoints.etiquetas.crearEtiqueta, data)
        return res.data
    } catch (e) {
        alert("No se han podido crear la etiqueta")
    }
}

const encontrarEtiqueta = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.etiquetas.encontrarEtiqueta(consecutivo))
        return res.data
    } catch (e) {
        alert("No se han encontrado la etiqueta")
    }
}

const listarEtiquetas = async () => {
    try {
        const res = await axios.get(endPoints.etiquetas.listarEtiquetas)
        return res.data
    } catch (e) {
        alert("No se han encontrado las etiquetas")
    }
}

const actualizarEtiqueta = async (consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.etiquetas.actualizarEtiqueta(consecutivo), changes)
        return res.data
    } catch (e) {
        alert("No se han encontrado las etiquetas")
    }
}

export { crearEtiqueta, encontrarEtiqueta, listarEtiquetas, actualizarEtiqueta };