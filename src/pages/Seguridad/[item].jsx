import React, { useEffect } from "react";
import { useRouter } from "next/router";


//Layout
import Usuarios from "@containers/seguridad/Usuarios";
import Disponibles from "@containers/seguridad/Disponibles";
import Transferencias from "@containers/seguridad/Transferencias";
import Recepcion from "@containers/seguridad/Recepcion";
import RootLayout from "@layout/RootLayout";
import Lector from "@containers/seguridad/Lector";
import Dashboard from "@containers/seguridad/Dashboard";
import ListadoContenedores from "@containers/seguridad/ListadoContenedores";
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
                {(router?.query.item == "Dashboard") && <Dashboard />}
                {(router?.query.item == "Reader") && <Lector />}
                {(router?.query.item == "Disponibles") && <Disponibles />}
                {(router?.query.item == "Recepcion") && <Recepcion />}
                {(router?.query.item == "Transferencias") && <Transferencias />}
                {(router?.query.item == "Usuarios") && <Usuarios />}
            </div>
        </RootLayout>
    );
}
