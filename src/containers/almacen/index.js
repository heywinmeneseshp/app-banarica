import React from "react";
import Movimientos from "@containers/almacen/Movimientos";
import Pedidos from "@containers/almacen/Pedidos";
import Recepcion from "@containers/almacen/Recepcion";
import Traslado from "@containers/almacen/Traslado";

export default function Almacen() {
    return (
        <>
            <Movimientos />
            <Pedidos />
            <Recepcion />
            <Traslado />
        </>
    )
} 