import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { useEffect, useState, } from "react";
import JsBarcode from "jsbarcode";

//hooks
import useBarcodes from "@hooks/useBarcodes";


export default function BarcodePDF() {

    const [codigos, setCodigos] = useState([]);
    const etiqueta = [1, 2, 3, 4];

    const { generarSCC18 } = useBarcodes();

    const styles = StyleSheet.create({
        page: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            marginTop: "30px",
            marginBottom: "30px",
            alignItems: "center",
            backgroundColor: "white",
            fontSize: "11"
        },
        barcode: {
            width: 150
        }
    });

    function textToBase64Barcode(text) {
        var canvas = document.createElement("canvas");
        JsBarcode(canvas, text, {
            format: "CODE128C", ean128: true, width: 5, // La anchura de cada barra
            height: 200, fontSize: 50
        });
        return canvas.toDataURL("image/png");
    }

    useEffect(() => {
        const codeList = () => {
            const product = localStorage.getItem("productCODES");
            const toJSON = JSON.parse(product);
            const codes = generarSCC18(toJSON, toJSON.inicial, toJSON.final, toJSON.ibm);
            let base64Codes = [];
            codes.map((item) => {
                const base64 = textToBase64Barcode(item);
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
                    <Page size="A4" key={index}
                        style={styles.page} >
                        {etiqueta.map(number => {
                            return (
                                <View key={number}>
                                    <Text >TERRA AZUL</Text>
                                    <Text >Detalle superior</Text>
                                    <View >
                                        <Image style={styles.barcode} src={item} />
                                    </View>
                                    <Text >Detalle inferior</Text>
                                </View>
                            );
                        })}
                        <View >
                            <View >
                                <Image style={styles.barcode} src={item} />
                            </View>
                            <View >
                                <Image style={styles.barcode} src={item} />
                            </View>
                        </View>
                    </Page>
                );
            })}

        </Document>
    );
}
