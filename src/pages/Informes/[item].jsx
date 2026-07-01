import React from "react";
import { useRouter } from "next/router";

import InfoMovimientos from "@containers/informes/InfoMovimientos.jsx";
import InfoStock from "@containers/informes/InfoStock";
import InfoTraslados from "@containers/informes/InfoTraslados";
import InfoPedidos from "@containers/informes/InfoPedidos";
import InfoTemperatura from "@containers/informes/InfoTemperatura";

export default function Informes() {
    const { query } = useRouter();
    const { item } = query;

    return (
        <div>
            {item === "movimientos" && <InfoMovimientos />}
            {item === "pedidos" && <InfoPedidos />}
            {item === "stock" && <InfoStock />}
            {item === "traslados" && <InfoTraslados />}
            {item === "temperatura" && <InfoTemperatura />}
        </div>
    );
}
