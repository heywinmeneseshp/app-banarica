import { useState } from "react";
import { filtrarProductos } from "@services/api/productos";

const usePedido = () => {
    const [listaPedido, setListaPedido] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductos] = useState([]);

    const initialize = async (almacenByUser) => {
        setListaPedido([]);
        const almacenes = almacenByUser.map(item => item.consecutivo);
        const data = { "stock": { "isBlock": false, "cons_almacen": almacenes } };
        const productlist = await filtrarProductos(data)
        setProductos(productlist);
        setAlmacenes(almacenByUser);
    }


    const agregar = (data) => {
        const newListaPedido = listaPedido.concat(data)
        setListaPedido(newListaPedido)
    };

    const eliminarAlmacen = (cons) => {
        const newAlmacenes = almacenes.filter((item) => item.consecutivo !== cons)
        setAlmacenes(newAlmacenes);
    }

    return {
        listaPedido,
        almacenes,
        productos,
        initialize,
        agregar,
        eliminarAlmacen,
    };
};

export default usePedido;