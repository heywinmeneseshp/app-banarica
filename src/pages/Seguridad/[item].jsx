import React, { useEffect } from "react";
import { useRouter } from "next/router";


//Layout
import Disponibles from "@containers/seguridad/Disponibles";
import Transferencias from "@containers/seguridad/Transferencias";
import Recepcion from "@containers/seguridad/Recepcion";
import RootLayout from "@layout/RootLayout";
import InspeccionVacio from "@containers/seguridad/InspeccionVacio";
import Dashboard from "@containers/seguridad/Dashboard";
import ListadoContenedores from "@containers/seguridad/ListadoContenedores";
import Embarques from "@containers/seguridad/Embarques";
import InspeccionLLeno from "@containers/seguridad/InspeccionLleno";
//Components

//CSS


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
                {(router?.query.item == "Lector") && <InspeccionVacio />}
                {(router?.query.item == "InspLleno") && <InspeccionLLeno />}
                {(router?.query.item == "Disponibles") && <Disponibles />}
                {(router?.query.item == "Recepcion") && <Recepcion />}
                {(router?.query.item == "Transferencias") && <Transferencias />}
            </div>
        </RootLayout>
    );
}
