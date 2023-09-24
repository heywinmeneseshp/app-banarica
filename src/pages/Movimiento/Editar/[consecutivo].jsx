import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Ajuste from "@components/almacen/Ajuste";
import ThirdLayout from 'layout/ThirdLayout';

export default function Editar() {
    const router = useRouter();
    const [tipoMovimiento, setTipoMovimiento] = useState();

    useEffect(() => {
        let cons = router.query.consecutivo;
        let movimiento;
        if (cons.substr(0, 2) == "RC") movimiento = "Recepcion";
        if (cons.substr(0, 2) == "LQ") movimiento = "Liquidacion";
        if (cons.substr(0, 2) == "DV") movimiento = "Devolucion";
        if (cons.substr(0, 2) == "AJ") movimiento = "Ajuste";
        if (cons.substr(0, 2) == "EX") movimiento = "Exportacion";
        setTipoMovimiento(movimiento);
    }, [router?.isReady], tipoMovimiento);
    return (
        <ThirdLayout>
            <Ajuste movimiento={router.query} exportacion={tipoMovimiento} />
        </ThirdLayout>
    );
}
