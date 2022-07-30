import { useState } from "react";
import { listarAlmacenes } from "@services/api/almacenes";
import { listarProductos } from "@services/api/productos";

const usePedido = () => {
    const [listaPedido, setListaPedido] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductos] = useState([]);

    const initialize = () => {
        setListaPedido([]);
        listarAlmacenes().then((res)=>{
            setAlmacenes(res)
        })
        listarProductos().then((res)=>{
            setProductos(res)
        })
    }

    const agregar = (data) => {
        const newListaPedido = listaPedido.concat(data)
        setListaPedido(newListaPedido)
    };

    const eliminarAlmacen = (cons) => {
        const newAlmacenes = almacenes.filter((item)=> item.consecutivo !== cons)
        setAlmacenes(newAlmacenes);
    }

    return {
        listaPedido,
        almacenes,
        productos,
        initialize,
        agregar,
        eliminarAlmacen
    };
};

export default usePedido;