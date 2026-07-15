import React from "react";
import { useRouter } from "next/router";

import Movimientos from "@containers/almacen/Movimientos";
import Pedidos from "@containers/almacen/Pedidos";
import Recepcion from "@containers/almacen/Recepcion";
import Traslado from "@containers/almacen/Traslado";
import BajaSeriales from "@containers/almacen/BajaSeriales";

export default function Almacen() {
    const router = useRouter();
    const { item } = router.query;

    return (
        <div>
            {item === "movimientos" && <Movimientos />}
            {item === "pedidos" && <Pedidos />}
            {item === "recepcion" && <Recepcion />}
            {item === "traslados" && <Traslado />}
            {item === "baja-seriales" && <BajaSeriales />}
        </div>
    );
}
