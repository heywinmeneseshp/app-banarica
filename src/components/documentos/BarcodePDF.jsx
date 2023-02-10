import { Document, Page, View, Text, StyleSheet, Image, Svg } from "@react-pdf/renderer";
import { useEffect } from "react";
import Barcode from "react-barcode";
import JsBarcode from "jsbarcode";


export default function BarcodePDF({ move }) {

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
        }
    });

    useEffect(() => {
        JsBarcode(".codigo").init();
    }, [])


    return (

        <Document>
            <Page size="A4"
                style={styles.page} >

                <View>
                    <Text >Producto</Text>
                    <Text >Detalle superior</Text>
                    <View>
                    <Image data-value="12345" data-text="Soy el texto" class="codigo" />
                    </View>
                 
                    <Text >Detalle inferior</Text>
                </View>

            </Page>

        </Document>
    );
}
