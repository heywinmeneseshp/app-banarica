import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import { buscarTraslado } from "@services/api/traslados";

const DocumentPDF = dynamic(() => import("@containers/documentos/PDF"), {
    ssr: false
});

export default function Documento() {
    const router = useRouter();

    const [pedido, setPedido] = useState(null);

    useEffect(() => {
        if (router.query.traslado) {

            buscarTraslado(router.query.traslado).then( async (res)=> {

                let result = {};
                let ci = res[0].cons_almacen_gestor.substr(-2);
                let comercializadora = ci == "BC" ? "C.I. BANACHICA S.A.S. ZOMAC." : "Comercializadora Internacional Bana Rica S.A.";
                let direccion = ci == "BC" ? "Cra 5 5 44 AP 03, Aracataca, Magdalena" : "Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia";
                let tel = ci == "BC" ? "Cel: 3116348058 - Tel: 4372003" : "Tel: (604) 480 5034 - (604) 4805022";
                let correo = ci == "BC" ? "facturacionbanachica@gmail.com" : "www.banarica.com - facturacion@banarica.com";
      
                result = { ...result, comercializadora, tel, direccion, correo, res: res };
                setPedido(result);
            });
        }

    }, [router?.isReady]);


    return (
        <>
            {pedido && <DocumentPDF movimiento={pedido} documento={"traslado"}/>}
        </>
    );
}
