import axios from 'axios';
import { agregarHistorial } from './historialMovimientos';
import endPoints from './index';
import { restar } from './stock';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};


const encontrarUnSerial = async (data) => {
    const res = await axios.post(endPoints.seguridad.encontrarSerial, data);
    return res.data;
};

const listarSeriales = async (offset, limit, body) => {
    try {
        let data = { data: body };
        if (limit) data = { ...data, pagination: { offset: offset, limit: limit } };
        const response = await axios.post(endPoints.seguridad.listarSeriales, data, config);
        return response.data;
    } catch (err) {
        alert("Error al listar seriales");
    }
};

const listarUsuariosSeguridad = async (offset, limit, username) => {
    try {
        const response = await axios.post(endPoints.seguridad.listarUsuarios, { offset, limit, username }, config);
        return response.data;
    } catch (err) {
        alert("Error al listar usuario seguridad");
    }
};

const cargarSeriales = async (dataExcel, remision, pedido, semana, fecha, observaciones, username) => {
    try {
        const res = dataExcel.find(item => item.cons_producto == null);
        if (res?.cons_producto === null) return { message: "Existen artículos sin código ID.", bool: false };
        await axios.post(endPoints.seguridad.CargarSeriales, {data: dataExcel,
            remision, pedido, semana, fecha, observaciones, username
        });
        return { message: "Se han cargado los datos con éxito.", bool: true };
    } catch (e) {
        console.log(e);
        throw e;
    }

};

const actualizarSeriales = async (dataList) => {
    try {
        const response = await axios.patch(endPoints.seguridad.ActualizarSeriales, dataList);
        return response.data;
    } catch (e) {
        alert("Error al actualizar data list");
    }
};

const actualizarSerial = async (body) => {
    try {
        const response = await axios.patch(endPoints.seguridad.ActualizarSerial, body);
        return response.data;
    } catch (e) {
        alert("Error al actualizar data list");
    }
};

const listarProductosSeguridad = async () => {
    try {
        const response = await axios.get(endPoints.seguridad.listarProductos);
        return response.data;
    } catch (e) {
        alert("Error al listar productos de seguridad");
    }
};

const verificarAndActualizarSeriales = async (data, cons_almacen) => {
    let updatedData = [];
    for (let property in data) {
        if (data[property]) {
            let newData = {
                serial: data[property],
                available: false,
                cons_almacen: cons_almacen
            };
            property = property.includes("Precinto plástico") ? "Precinto plástico" : property;
            const existe = await encontrarUnSerial({ serial: newData.serial, producto: { name: property } });
            if (existe == null) {
                if (confirm(`No existe ${property} con serial ${newData.serial} ¿Desea corregir el serial?`)) {
                    newData.serial = prompt(`Por favor, corrija el serial, ${property}:`, newData.serial);
                    const res = await encontrarUnSerial({ producto: { name: property } });
                    newData['cons_producto'] = res?.producto.consecutivo;
                } else {
                    const { producto } = await encontrarUnSerial({ producto: { name: property } });
                    newData['cons_producto'] = producto.consecutivo;
                }
            } else {
                newData['cons_producto'] = existe.producto.consecutivo;
            }
            updatedData.push(newData);
        }
    };
    return updatedData;
};

const exportarArticulosConSerial = async (updatedSeriales, cons_almacen, cons_movimiento) => {
    const res = await actualizarSeriales(updatedSeriales);
    res.data.forEach(element => {
         if (element) {
             const dataHistorial = {
                 cons_movimiento: cons_movimiento,
                 cons_producto: element.current.cons_producto,
                 cons_almacen_gestor: cons_almacen,
                 cons_almacen_receptor: element.previous.cons_almacen,
                 cons_lista_movimientos: "EX",
                 tipo_movimiento: "Salida",
                 razon_movimiento: "Exportación",
                 cantidad: 1
             };
             agregarHistorial(dataHistorial);
             restar(element.previous.cons_almacen, dataHistorial.cons_producto, dataHistorial.cantidad);
         }
     });
};

const inspeccionAntinarcoticos = async (Formulario, rechazos) => {
    try {
        const response = await axios.post(endPoints.seguridad.inspeccionAntinarcoticos, {formulario: Formulario, rechazos: rechazos});
        return response.data;
    } catch (e) {
        alert("Error al actualizar data list");
    }
};


export {
    listarSeriales, listarUsuariosSeguridad, cargarSeriales,
    actualizarSeriales, listarProductosSeguridad, exportarArticulosConSerial, encontrarUnSerial,
    verificarAndActualizarSeriales, actualizarSerial, inspeccionAntinarcoticos
};