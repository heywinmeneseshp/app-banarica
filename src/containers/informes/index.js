import React from "react";
import { useContext } from "react";
import AppContext from "@context/AppContext";

//Bootstrap
import InfoMovimientos from "@containers/informes/InfoMovimientos.jsx";
import InfoStock from "@containers/informes/InfoStock";
import InfoTraslados from "@containers/informes/InfoTraslados";
import InfoPedidos from "@containers/informes/InfoPedidos";



export default function Informes() {

    const { initialInfoMenu } = useContext(AppContext);

    return (
        <>
            {initialInfoMenu.infoMenu.movimientos && <InfoMovimientos />}
            {initialInfoMenu.infoMenu.stock && <InfoStock />}
            {initialInfoMenu.infoMenu.traslados && <InfoTraslados />}
            {initialInfoMenu.infoMenu.pedidos && <InfoPedidos />}
        </>
    );
}