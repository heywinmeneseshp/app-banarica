import React, { useEffect } from "react";
import { useRouter } from "next/router";

import Programador from "@containers/programacion/Programador";
import ConsumoKm from "@containers/programacion/ConsumoKm";
import ConsumoRutas from "@containers/programacion/ConsumoRutas";
import Reportes from "@containers/programacion/Reportes";
import SaldoCombustible from "@containers/programacion/SaldoCombustible";
import DashboardSellosProgramador from "@containers/programacion/DashboardSellosProgramador";
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
