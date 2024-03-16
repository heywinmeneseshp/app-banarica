import React, { useEffect } from "react";
import { useRouter } from "next/router";


//Layout
import SecondLayout from "@layout/SecondLayout";
//Components

import Users from "@containers/administrador/Users";

//CSS


export default function Maestros() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.query]);
    return (
        <SecondLayout>

            <h1>{router?.query.item}</h1>
            <Users/>

        </SecondLayout>
    
    );
}