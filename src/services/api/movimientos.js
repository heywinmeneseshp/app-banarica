import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarMovimiento = async (data) => {
    try {
        const response = await axios.post(endPoints.movimientos.create, data, config);
        return response.data;
    } catch (err) {
        // Antes: alert() + devolvia undefined, y quien llamaba (Ajuste/
        // Liquidacion/Devolucion) usaba res.data.consecutivo sin chequear
        // nada, mientras la pantalla ya habia mostrado "carga exitosa" — se
        // relanza para que el catch de quien llama se entere de verdad.
        throw new Error(err?.response?.data?.message || err?.message || "Error al crear el Movimiento");
    }
};

const eliminarMovimiento = async (consecutivo) => {
    const res = await axios.delete(endPoints.movimientos.delete(consecutivo));
    return res.data;
};

const actualizarMovimiento = async (id, changes) => {
    const res = await axios.patch(endPoints.movimientos.update(id), changes);
    return res.data;
};

const buscarMovimiento = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.movimientos.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert(`El Movimiento ${consecutivo} no existe`);
    }
};

const bucarDoumentoMovimiento = async (consecutivo) => {
    try {
        const res = await axios.post(endPoints.movimientos.document, { consecutivo: consecutivo });
        return res.data;
    } catch (e) {
        alert(`El Movimiento ${consecutivo} no existe`);
    }
};

const listarMovimientos = async () => {
    try {
        const res = await axios.get(endPoints.movimientos.list);
        return res.data;
    } catch {
        alert("Error al listar Movimientos");
    }
};

export { agregarMovimiento, 
    eliminarMovimiento, 
    actualizarMovimiento, 
    buscarMovimiento,
    bucarDoumentoMovimiento, 
    listarMovimientos 
};