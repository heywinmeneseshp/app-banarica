import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { useEffect, useState, } from "react";
import JsBarcode from "jsbarcode";

//hooks
import useBarcodes from "@hooks/useBarcodes";


export default function BarcodePDF() {

    const [codigos, setCodigos] = useState([]);
    const [SSCC, setSSCC] = useState([]);
    const [producto, setProducto] = useState({});
    const [EAN13, setEan13] = useState();
    const etiqueta = [1, 2, 3, 4];
    const { generarSCC18 } = useBarcodes();

    const styles = StyleSheet.create({
        page: {
            display: "flex",
        },
        vista1: {
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "19mm",
            alignItems: "center",
            justifyContent: "space-around",
            paddingHorizontal: "5mm"
        },
        vista2: {
            width: "100%",
            height: "44mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        },
        subVista2: {
            width: "100%",
            height: "5mm",
            display: "flex",
            justifyContent: "space-around",
            flexDirection: "row",
            marginTop: "2mm"
        },
        etiqueta1: {
            width: "100%",
            height: "10mm",
            marginTop: "2mm"
        },
        etiqueta2: {
            width: "100%",
            height: "10mm"
        },
        etiqueta3: {
            width: "90mm",
            height: "10mm"
        },
        etiqueta4: {
            display: "flex",
            width: "50mm",
            height: "10mm",
        },
        ean13B: {
            display: "flex",
            justifyItems: "stretch",
            width: "50mm",
            marginTop: "2mm",
            marginLeft: "-1mm"
        },
        ean13A: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "50mm",
            marginLeft: "-2mm"
        },
        eanContainer: {
            display: "flex",
            flexDirection: "row",
            width: "100mm",
            justifyContent: "center",
            alignItems: "center"
        },
        barcode: {
            width: "80mm",
            height: "10mm"
        },
        sscc_box: {
            display: "flex",
            width: "50mm",
            textAlign: "center",
            fontSize: "2mm",
        },
        fruta_box: {
            display: "flex",
            width: "35mm",
            textAlign: "right",
            fontSize: "2mm",
        },
        superior: {
            marginTop: "2mm",
            fontSize: "5mm",
        },
        ean: {
            fontSize: "2mm",
            textAlign: "center",
            paddingLeft: "5mm"
        },
        sscc2: {
            fontSize: "2mm",
            textAlign: "center",
            width: "100%",
            marginLeft: "-3mm"
        },
        pallet_ibm: {
            fontSize: "4mm"
        },
        inferior: {
            fontSize: "3mm"
        },
        textEan13: {
            marginLeft: "20mm",
            fontSize: "2mm"
        },
    });

    function textToBase64Barcode(text, codeType) { // "CODE128C"
        var canvas = document.createElement("canvas");
        JsBarcode(canvas, text, {
            format: codeType, ean128: true, width: 5, // La anchura de cada barra
            height: 200, fontSize: 0
        });
        return canvas.toDataURL("image/png");
    };

    useEffect(() => {
        const product = localStorage.getItem("productCODES");
        const toJSON = JSON.parse(product);
        setProducto({
            nombre: toJSON.producto,
            ibm: toJSON.ibm,
            superior: toJSON.detalle_superior,
            inferior: toJSON.detalle_inferior,
            inicial: toJSON.inicial,
            final: toJSON.final,
            ean13: toJSON.gnl
        });

        const codeList = () => {
            const ean = textToBase64Barcode(toJSON.gnl, "EAN13");
            setEan13(ean);
            const codes = generarSCC18(toJSON, toJSON.inicial, toJSON.final, toJSON.ibm);
            setSSCC(codes);
            let base64Codes = [];
            codes.map((item) => {
                const base64 = textToBase64Barcode(item, "CODE128C");
                base64Codes.push(base64);
            });
            setCodigos(base64Codes);
        };
        codeList();
    }, []);

    return (

        <Document>
            {codigos.map((item, index) => {
                return (
                    <Page size={[284, 608]} key={index}
                        style={styles.page} >

                        <View style={styles.vista1}>
                            <View style={styles.sscc_box}>
                                <Image style={styles.etiqueta1} src={item} />
                                <Text style={styles.sscc2}>{SSCC[index]}</Text>
                            </View>

                            <View style={styles.fruta_box}>
                                <Text style={styles.fruta} >{producto.nombre}</Text>
                                <Image style={styles.etiqueta2} src={EAN13} />
                                <Text style={styles.ean}>{producto.ean13}</Text>
                            </View>
                        </View>

                        {etiqueta.map(etiqueta => (
                            <View key={etiqueta} style={styles.vista2}>
                                <Text style={styles.superior}>{producto.superior}</Text>
                                <View style={styles.subVista2}>
                                    <Text style={styles.pallet_ibm}>{`IBM ${producto.ibm}`}</Text>
                                    <Text style={styles.pallet_ibm}>{`PALLET SERIAL No. ${producto.inicial * 1 + index}`}</Text>
                                </View>
                                <View >
                                    <Image style={styles.etiqueta3} src={item} />
                                    <Text style={styles.sscc2}>{SSCC[index]}</Text>
                                </View>

                                <View style={styles.eanContainer} >
                                    <View style={styles.ean13B}>
                                        <Image style={styles.etiqueta4} src={EAN13} />
                                        <Text style={styles.textEan13}>{producto.ean13}</Text>
                                    </View>
                                    <View style={styles.ean13A}>
                                        <Text style={styles.inferior}>   {producto.nombre}</Text>
                                    </View>

                                </View>
                            </View>
                        ))}

                        <View style={styles.vista1}>
                            <View style={styles.sscc_box}>
                                <Image style={styles.etiqueta1} src={item} />
                                <Text style={styles.sscc2}>{SSCC[index]}</Text>
                            </View>

                            <View style={styles.fruta_box}>
                                <Text style={styles.fruta} >{producto.nombre}</Text>
                                <Image style={styles.etiqueta2} src={EAN13} />
                                <Text style={styles.ean}>{producto.ean13}</Text>
                            </View>
                        </View>

                    </Page>
                );
            })}

        </Document>
    );
}
