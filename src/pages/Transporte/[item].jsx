import React, { useEffect } from "react";
import { useRouter } from "next/router";

import Programador from "@components/Programacion/Programador";
import ConsumoKm from "@components/Programacion/ConsumoKm";
import ConsumoRutas from "@components/Programacion/ConsumoRutas";
import Reportes from "@components/Programacion/Reportes";
import SaldoCombustible from "@components/Programacion/SaldoCombustible";
import DashboardSellosProgramador from "@components/Programacion/DashboardSellosProgramador";
//Components


export default function Seguridad() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.query]);
    return (
        <div>
            {router?.query.item == "Programador" && <Programador />}
            {router?.query.item == "ConsumoKm" && <ConsumoKm />}
            {router?.query.item == "ConsumoRutas" && <ConsumoRutas />}
            {router?.query.item == "Reportes" && <Reportes />}
            {router?.query.item == "CargarCombustible" && <SaldoCombustible/>}
            {["DashboardProgramador", "ResumenProgramador", "SellosProgramador"].includes(router?.query.item) && <DashboardSellosProgramador />}
        </div>
    );
}
