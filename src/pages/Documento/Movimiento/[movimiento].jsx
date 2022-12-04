import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import { buscarMovimiento } from "@services/api/movimientos";

const DocumentPDF = dynamic(() => import("@containers/documentos/PDF"), {
    ssr: false
});



export default function Documento() {
    const router = useRouter();

    const [movimiento, setMovimiento] = useState(null);

    useEffect(() => {
        if (router.query.movimiento) {
            buscarMovimiento(router.query.movimiento).then(res => {
                let result = res;
                let ci = res.historial_movimientos[0].cons_almacen_gestor.substr(-2);
                let comercializadora = ci == "BC" ? "C.I. BANACHICA S.A.S. ZOMAC." : "Comercializadora Internacional Bana Rica S.A.";
                let direccion = ci == "BC" ? "Cra 5 5 44 AP 03, Aracataca, Magdalena" : "Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia";
                let tel = ci == "BC" ? "Cel: 3116348058 - Tel: 4372003" : "Tel: (604) 480 5034 - (604) 4805022";
                let correo = ci == "BC" ? "facturacionbanachica@gmail.com" : "www.banarica.com - facturacion@banarica.com";
                result = { ...result, comercializadora, tel, direccion, correo };

                switch (res.historial_movimientos[0].cons_lista_movimientos) {
                    case "RC":
                        setMovimiento({ ...result, movimiento: "Recepción" });
                        break;
                    case "AJ":
                        setMovimiento({ ...result, movimiento: "Ajuste" });
                        break;
                    case "DV":
                        setMovimiento({ ...result, movimiento: "Devolución" });
                        break;
                    case "LQ":
                        setMovimiento({ ...result, movimiento: "Liquidación" });
                        break;
                    case "EX":
                        setMovimiento({ ...result, movimiento: "Exportación" });
                        break;
                }
            });
        }

    }, [router?.isReady]);


    return (
        <>
            {movimiento && <DocumentPDF movimiento={movimiento} documento={"movimiento"} />}
        </>
    );
}
