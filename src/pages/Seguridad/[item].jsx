import React, { useEffect } from "react";
import { useRouter } from "next/router";


//Layout
import Disponibles from "@containers/seguridad/Disponibles";
import Transferencias from "@containers/seguridad/Transferencias";
import Recepcion from "@containers/seguridad/Recepcion";
import RootLayout from "@layout/RootLayout";
import Dashboard from "@containers/seguridad/Dashboard";
import ListadoContenedores from "@containers/seguridad/ListadoContenedores";
import Embarques from "@containers/seguridad/Embarques";
import InspeccionLLeno from "@containers/seguridad/InspeccionLleno";
import InspeccionVacio from "@containers/seguridad/InpeccionVacio";
import LlenadoContenedor from "@containers/seguridad/LlenadoContenedor";
import Rechazos from "@containers/seguridad/Rechazos";
import Inspeccionados from "@containers/seguridad/Inspeccionados";
//Components


export default function Seguridad() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.query]);
    return (
        <RootLayout>
            <div>
                {(router?.query.item == "Listado") && <ListadoContenedores />}
                {(router?.query.item == "Embarques") && <Embarques />}
                {(router?.query.item == "Dashboard") && <Dashboard />}
                {(router?.query.item == "Lector") && <InspeccionVacio/>}
                {(router?.query.item == "InspLleno") && <InspeccionLLeno />}
                {(router?.query.item == "Disponibles") && <Disponibles />}
                {(router?.query.item == "Recepcion") && <Recepcion />}
                {(router?.query.item == "Rechazos") &&   <Rechazos />}
                {(router?.query.item == "Transferencias") && <Transferencias />}
                {(router?.query.item == "LlenadoContenedor") && <LlenadoContenedor/>}
                 {(router?.query.item == "Inspeccionados") && <Inspeccionados/>}
            </div>
        </RootLayout>
    );
}
