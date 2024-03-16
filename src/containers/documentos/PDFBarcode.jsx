import React, { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import BarcodePDF from "@components/documentos/BarcodePDF";

export default function PDF( { documento } ) {
    const [client, setClient] = useState(false);

    useEffect(() => {
        console.log(documento);
        setClient(true);
    }, []);

    return (
        <PDFViewer  style={{ width: "100%", height: "100vh" }}>
           {(documento == "barcodes") && <BarcodePDF  />}
        </PDFViewer>
    );
}
