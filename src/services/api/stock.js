import axios from 'axios';
import endPoints from './index';



const crearStock = async (cons_almacen, cons_producto, bool) => {
    try {

        const config = {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const body = {
            cons_almacen: cons_almacen,
            cons_producto: cons_producto,
            cantidad: 0,
            isBlock: bool
        };
        const url = endPoints.stock.create;
        const response = await axios.post(url, body, config);
        return response.data;
    } catch (e) {
        alert('Se ha presentado un error al crear el stock');
    }
};

const eliminarStock = async (cons_almacen, cons_producto) => {
    const res = await axios.delete(endPoints.stock.delete(cons_almacen, cons_producto));
    return res.data;
};

const sumar = async (cons_almacen, cons_producto, cantidad) => {
    try {
        const response = await axios.patch(endPoints.stock.add(cons_almacen, cons_producto), { cantidad });
        if (response && response.data) {
            return response.data;
        } else {
            throw new Error("No se recibieron datos válidos del servidor");
        }
    } catch (error) {
        alert("Error al sumar al stock:", error);
        throw error;
    }
};

const restar = async (cons_almacen, cons_producto, cantidad) => {
    try {
        const res = await axios.patch(endPoints.stock.subtract(cons_almacen, cons_producto), { cantidad: cantidad });
        return res.data;
    } catch {
        crearStock(cons_almacen, cons_producto, false);
    }
};

const actualizarNoDisponibles = async (cons_almacen, cons_producto, und_no_disponibles) => {
    try {
        const res = await axios.patch(endPoints.stock.disponible(cons_almacen, cons_producto), { no_disponible: und_no_disponibles });
        return res.data;
    } catch {
        alert("Se ha producido un error al actualizar las unidades no disponibles");
    }
};

const exportCombo = async (body, listaCombo) => {
    const data = {
        ...body,
        comboList: listaCombo
    };
    try {
        const res = await axios.post(endPoints.stock.export, data);
        return res.data;
    } catch (e) {
        alert("Se ha presentado un error al exportar");
    }
};

const listarUnProductoEnAlmacenes = async (cons_producto) => {
    try {
        const res = await axios.get(endPoints.stock.findOneProductInAll(cons_producto));
        return res.data;
    } catch (e) {
        alert("Se ha presentado un error al listar el producto en todos los almacenes");
    }
};

const listarProductosEnUnAlmacen = async (cons_almacen) => {
    try {
        const res = await axios.get(endPoints.stock.findOneAlmacen(cons_almacen));
        return res.data;
    } catch {
        alert("Se ha presentado un error al listar productos en el almacen");
    }
};

const habilitarProductoEnAlmacen = async (cons_almacen, cons_producto, bool) => {
    try {
        await axios.patch(endPoints.stock.enable(cons_almacen, cons_producto), { isBlock: bool });
    } catch (e) {
        crearStock(cons_almacen, cons_producto, bool);
    }
};

const filtrarPorProductoYAlmacen = async (cons_almacen, cons_producto) => {
    try {
        const res = await axios.get(endPoints.stock.filterAlmacenAndProduct(cons_almacen, cons_producto));
        return res.data;
    } catch (e) {
        alert('No existe artículo para este almacén');
    }
};

const filtradoGeneralStock = async (body) => {
    try {
        const res = await axios.post(endPoints.stock.filter, body);
        return res.data;
    } catch {
        alert("Error en el filtrado general del stock");
    }
};

export {
    habilitarProductoEnAlmacen,
    listarProductosEnUnAlmacen,
    listarUnProductoEnAlmacenes,
    restar,
    sumar,
    exportCombo,
    eliminarStock,
    crearStock,
    filtrarPorProductoYAlmacen,
    filtradoGeneralStock,
    actualizarNoDisponibles
};