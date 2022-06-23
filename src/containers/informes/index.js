import React from "react";
import InfoMovimientos from "@containers/informes/InfoMovimientos.jsx";
import InfoStock from "@containers/informes/InfoStock";
import InfoTraslados from "@containers/informes/InfoTraslados";



export default function Informes() {
    return (
        <>
            <InfoMovimientos />
            <InfoStock />
            <InfoTraslados />
        </>
    )
}