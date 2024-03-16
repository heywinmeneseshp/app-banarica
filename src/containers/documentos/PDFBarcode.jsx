import React, { useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import BarcodePDF from "@components/documentos/BarcodePDF";

export default function PDF( { documento } ) {


    useEffect(() => {
 
    }, []);

    return (
        <PDFViewer  style={{ width: "100%", height: "100vh" }}>
           {(documento == "barcodes") && <BarcodePDF  />}
        </PDFViewer>
    );
}
