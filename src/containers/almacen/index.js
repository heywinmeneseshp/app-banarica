import React from "react";
import { useContext } from "react";
import AppContext from "@context/AppContext";

//Bootstrap
import Movimientos from "@containers/almacen/Movimientos";
import Pedidos from "@containers/almacen/Pedidos";
import Recepcion from "@containers/almacen/Recepcion";
import Traslado from "@containers/almacen/Traslado";

export default function Almacen() {

    const {initialAlmacenMenu} = useContext(AppContext);

    return (
        <>
            {initialAlmacenMenu.almacenMenu.movimientos && <Movimientos />}
            {initialAlmacenMenu.almacenMenu.pedidos && <Pedidos />}
            {initialAlmacenMenu.almacenMenu.recepcion && <Recepcion />}
            {initialAlmacenMenu.almacenMenu.traslados && <Traslado />}
        </>
    )
} 