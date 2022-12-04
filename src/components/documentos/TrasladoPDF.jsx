import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";

export default function TrasladoPDF({ move }) {

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
        head: { display: "flex", flexDirection: "row", width: "85%", alignItems: "center" },
        company: { textAlign: 'center', width: "60%", fontSize: "10" },
        companyName: { fontSize: move.comercializadora == "C.I. BANACHICA S.A.S. ZOMAC." ? "18" : "13", fontStyle: "bold", marginBottom: "10px" },
        movimiento: { textAlign: "left", width: "40%", marginLeft: "30px" },
        movChild: { display: "flex", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px" },
        movRecep: { display: "flex", color: move.res[0].traslado.fecha_entrada ? "black" : "red", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px" },
        movChildEnd: { display: "flex", flexDirection: "row", paddingBottom: "8px", paddingTop: "8px" },
        movTag: { fontWeight: "bold", width: "50%" },

        logoContainter: { display: "flex", textAlign: "center", width: "100%", justifyContent: "center" },
        logo: {
            height: "100px",
            width: "180px",
            marginBottom: "10px",
            textAlign: "center",
            margin: "auto",
            paddingBottom: "10px"
        },

        agua: {
            width: "80%",
            position: "absolute",
            paddingTop: "110px"

        },
        imagen: {
            opacity: "0.2"
        },

        table: { marginTop: "30px" },
        tableHead: { display: "flex", flexDirection: "row", width: "85%", borderBottom: "2px solid #AEB6BF", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" },
        tableBody: { display: "flex", fontSize: "9", flexDirection: "row", width: "85%", borderBottom: "1px solid #AEB6BF", paddingBottom: "6px", paddingTop: "6px", paddingRight: "5px", paddingLeft: "5px" },
        almacen: { width: "15%" },
        cod: { width: "10%", textAlign: "center" },
        articulo: { width: "40%" },
        cantidad: { width: "20%", textAlign: "right" },

        approvedContainer: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginBottom: "30px", marginTop: "30px" },
        left: { width: "50%", marginRight: "10px" },
        right: { width: "50%", marginLeft: "10px" },

        approvedContainer2: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginBottom: "30px", marginTop: "30px" },
        left2: { width: "50%" },
        right2: { width: "50%" },
        aprobado2: { display: "flex", width: "100%", flexDirection: "row", border: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px", paddingRight: "30px", paddingLeft: "30px", fontSize: "10" },
        aproTag2: { marginRight: "5px", width: "120px", textAlign: "left" },
        user2: { textAlign: "left", width: "100%" },

        aprobado: { display: "flex", width: "100%", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "40px", paddingRight: "10px", paddingLeft: "10px", marginLeft: "" },
        aproTag: { marginRight: "10px", width: "120px", textAlign: "left" },
        user: { textAlign: "center", width: "100%" },
        noApproved: { textAlign: "center", width: "100%", color: "red" },

        observaciones: { borderTop: "2px solid #AEB6BF", width: "85%", paddingLeft: "5px", paddingRight: "5px", fontSize: "10" },
        obChild: { display: "flex", flexDirection: "row", marginTop: "5px", marginBottom: "5px" },
        obChildTag: { marginRight: "5px" }


    });

    return (

        <Document>
            <Page size="A4"
                style={styles.page} >


                {(move.res[0].traslado.estado == "Rechazado") &&
                    <View style={styles.agua}>
                        <Image
                            style={styles.imagen}
                            src="https://t4.ftcdn.net/jpg/00/06/32/33/360_F_6323356_UNMbB0uOmhkfPFC2JpzX5QX3Nnj9xMVI.jpg"
                        />
                    </View>
                }

                <View style={styles.head}>

                    <View style={styles.company}>

                        {(move.comercializadora != "C.I. BANACHICA S.A.S. ZOMAC.") &&
                            <View style={styles.logoContainter}>
                                <Image style={styles.logo} src="https://scontent.feoh2-1.fna.fbcdn.net/v/t39.30808-6/317492782_467933688797772_2233208625145611608_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=730e14&_nc_ohc=Rg5a9tjD-jIAX-EFl1p&_nc_ht=scontent.feoh2-1.fna&oh=00_AfCaSv56466x2i6d_qocPwqGbv8ooDM874WvJCBomLuj9w&oe=6391CA20" />
                            </View>
                        }

                        <Text style={styles.companyName}>{move.comercializadora}</Text>
                        <Text>{move.direccion}</Text>
                        <Text>{move.tel}</Text>
                        <Text>{move.correo}</Text>
                    </View>

                    <View style={styles.movimiento}>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Origen:</Text>
                            <Text>{move.res[0].traslado.origen}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Destino:</Text>
                            <Text>{move.res[0].traslado.destino}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Remisión:</Text>
                            <Text>{move.res[0].traslado.fecha_salida}</Text>
                        </View>
                        <View style={styles.movRecep}>
                            <Text style={styles.movTag}>Recepción:</Text>
                            <Text>{move.res[0].traslado.fecha_entrada ? move.res[0].traslado.fecha_entrada : ""}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Semana:</Text>
                            <Text>{move.res[0].traslado.semana}</Text>
                        </View>
                        <View style={styles.movChildEnd}>
                            <Text style={styles.movTag}>Traslado:</Text>
                            <Text>{move.res[0].cons_movimiento}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={styles.almacen}>Origen</Text>
                        <Text style={styles.almacen}>Destino</Text>
                        <Text style={styles.cod}>Cod</Text>
                        <Text style={styles.articulo}>Artículo</Text>
                        <Text style={styles.cantidad}>Cantidad</Text>
                    </View>
                    {move.res.map((item, index) => {
                        return (
                            <View key={index} style={styles.tableBody}>
                                <Text style={styles.almacen}>{item.traslado.origen}</Text>
                                <Text style={styles.almacen}>{item.traslado.destino}</Text>
                                <Text style={styles.cod}>{item.Producto.consecutivo}</Text>
                                <Text style={styles.articulo}>{item.Producto.name}</Text>
                                <Text style={styles.cantidad}>{item.cantidad}</Text>
                            </View>
                        );
                    })}
                </View>

                {!move.res[0].traslado.fecha_entrada &&
                    <View style={styles.approvedContainer}>
                        <View style={styles.left} >

                            <View style={styles.aprobado}>
                                <Text style={styles.aproTag}>Remite:</Text>
                                <Text style={styles.user}></Text>
                            </View>

                            <View style={styles.aprobado}>
                                <Text style={styles.aproTag}>Conductor:</Text>
                                <Text style={styles.user}></Text>
                            </View>

                        </View>
                        <View style={styles.right}>


                            <View style={styles.aprobado}>
                                <Text style={styles.aproTag}>Recibe:</Text>
                                <Text style={styles.user}></Text>
                            </View>



                        </View>
                    </View>
                }

                {move.res[0].traslado.fecha_entrada &&
                    <View style={styles.approvedContainer2}>
                        <View style={styles.left2} >

                        </View>
                        <View style={styles.right2}>
                            <View style={styles.aprobado2}>
                                <Text style={styles.aproTag2}>Transportadora:</Text>
                                <Text style={styles.user2}>{move.res[0].traslado.transportadora}</Text>
                            </View>

                            <View style={styles.aprobado2}>
                                <Text style={styles.aproTag2}>Conductor:</Text>
                                <Text style={styles.user2}>{move.res[0].traslado.conductor}</Text>
                            </View>
                        </View>
                    </View>
                }

                <View style={styles.observaciones}>
                    <View style={styles.obChild}>
                        <Text style={styles.obChildTag}>Observaciones:</Text>
                        <Text>{move.res[0].traslado.observaciones}</Text>
                    </View>
                </View>
            </Page>

        </Document>
    );
}
