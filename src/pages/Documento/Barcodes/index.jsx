import React, { useEffect } from "react";
import dynamic from "next/dynamic";


const DocumentPDF = dynamic(() => import("@containers/documentos/PDF"), {
    ssr: false
});



export default function Documento() {

    useEffect(() => {

    }, []);


    return (
        <>
         <DocumentPDF documento={"barcodes"} />
        </>
    );
}
