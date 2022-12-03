import { Document, Page, View, Text } from "@react-pdf/renderer";


export default function ({ move }) {



    return (

        <Document>
            <Page size="A4"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "white",
                }} >
                <View style={{ display: 'flex', justifyContent: "center", flexDirection: "column" }}>
                    <View>
                        <Text>Comercializadora Internacional Bana Rica S.A</Text>
                        <Text>Cra 43a 16a Sur 38 IN 1008, Medellin, Antioquia</Text>
                        <Text>Tel: (604) 480 5034 - (604) 4805022</Text>
                        <Text>www.banarica.com - facturacion@banarica.com</Text>
                    </View>

                    <View>
                        <View>
                            <Text>Proveedor:</Text>
                            <Text>Smurfit Kappa - Cartón de Colombia</Text>
                        </View>
                        <View>
                            <Text>Fecha:</Text>
                            <Text>{move.consecutivo}</Text>
                        </View>
                        <View>
                            <Text>Semana:</Text>
                            <Text>{move.consecutivo}</Text>
                        </View>
                        <View>
                            <Text>Pedido:</Text>
                            <Text>{move.consecutivo}</Text>
                        </View>
                    </View>


                </View>
            </Page>





        </Document>
    );
}
