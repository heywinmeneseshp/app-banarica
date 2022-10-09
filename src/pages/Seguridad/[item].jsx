import React, { useEffect } from "react";
import { useRouter } from "next/router";


//Layout
import ThirdLayout from 'layout/ThirdLayout';
import Usuarios from "@containers/seguridad/Usuarios";
import Disponibles from "@containers/seguridad/Disponibles";
import Transferencias from "@containers/seguridad/Transferencias";
import Recepcion from "@containers/seguridad/Recepcion";
//Components

//CSS


export default function Seguridad() {
    const router = useRouter();

    useEffect(() => {

        console.log(router?.query);
    }, [router?.query]);
    return (
        <ThirdLayout>
            {(router?.query.item == "Disponibles") && <Disponibles />}
            {(router?.query.item == "Recepcion") && <Recepcion />}
            {(router?.query.item == "Transferencias") && <Transferencias />}
            {(router?.query.item == "Usuarios") && <Usuarios />}
        </ThirdLayout>
    );
}
