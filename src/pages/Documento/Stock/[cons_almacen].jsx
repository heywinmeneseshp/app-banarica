import React, { useEffect, useState } from "react";
import axios from "axios";
import endPoints from "@services/api";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const DocumentPDF = dynamic(() => import("@containers/documentos/PDF"), {
    ssr: false
});


export default function Documento() {
    const router = useRouter();
    const [data, setData] = useState(null);

    useEffect(() => {
        const stock = router.query;
        let categoria = stock.cons_categoria;

        const listar = async () => {
            let body = {
                "producto": {
                    "name": "",
                    "cons_categoria": categoria
                },
                "almacen": {
                    "consecutivo": [stock.cons_almacen]
                },
                "stock": {
                    "isBlock": false
                }
            };

            const res = await axios.post(endPoints.stock.filter, body);
            let result = res.data;
            let ci = res.data[0]?.cons_almacen.substr(-2);
            let comercializadora = ci == "BC" ? "C.I. BANACHICA S.A.S. ZOMAC." : "Comercializadora Internacional Bana Rica S.A.";
            let direccion = ci == "BC" ? "Cra 5 5 44 AP 03, Aracataca, Magdalena" : "Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia";
            let tel = ci == "BC" ? "Cel: 3116348058 - Tel: 4372003" : "Tel: (604) 480 5034 - (604) 4805022";
            let correo = ci == "BC" ? "facturacionbanachica@gmail.com" : "www.banarica.com - facturacion@banarica.com";
            result = { list: result, comercializadora, tel, direccion, correo };
            setData(result);
        };

        listar();
    }, [router?.isReady]);


    return (
        <>
            {data && <DocumentPDF movimiento={data} documento={"stock"} />}
        </>
    );
}







