import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export default function MovimientoPDF ({ move }) {

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
        company: { textAlign: 'center', width: "60%" },
        companyName: { fontSize: "13", fontStyle: "bold", marginBottom: "10px" },
        movimiento: { textAlign: "left", width: "40%", marginLeft: "30px" },
        movChild: { display: "flex", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px" },
        movChildEnd: { display: "flex", flexDirection: "row", paddingBottom: "8px", paddingTop: "8px" },
        movTag: { fontWeight: "bold", width: "50%" },

        table: { marginTop: "30px" },
        tableHead: { display: "flex", flexDirection: "row", width: "85%", borderBottom: "2px solid #AEB6BF", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" },
        tableBody: { display: "flex", fontSize: "9", flexDirection: "row", width: "85%", borderBottom: "1px solid #AEB6BF", paddingBottom: "3px", paddingTop: "3px", paddingRight: "5px", paddingLeft: "5px" },
        almacen: { width: "15%" },
        cod: { width: "20%", textAlign: "center" },
        articulo: { width: "45%" },
        cantidad: { width: "20%", textAlign: "right" },

        approvedContainer: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginBottom: "30px", marginTop: "30px" },
        left: { width: "30%" },
        right: { width: "70%" },
        aprobado: { display: "flex", width: "100%", flexDirection: "row", border: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px", paddingRight: "30px", paddingLeft: "30px", marginTop: "10px" },
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
                <View style={styles.head}>
                    <View style={styles.company}>
                        <Text style={styles.companyName}>{move.comercializadora}</Text>
                        <Text>{move.direccion}</Text>
                        <Text>{move.tel}</Text>
                        <Text>{move.correo}</Text>
                    </View>

                    <View style={styles.movimiento}>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Movimiento:</Text>
                            <Text>{move.movimiento}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Fecha:</Text>
                            <Text>{move.fecha}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Semana:</Text>
                            <Text>{move.cons_semana}</Text>
                        </View>
                        <View style={styles.movChildEnd}>
                            <Text style={styles.movTag}>Consecutivo:</Text>
                            <Text>{move.consecutivo}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={styles.almacen}>Almacén</Text>
                        <Text style={styles.cod}>Cod</Text>
                        <Text style={styles.articulo}>Artículo</Text>
                        <Text style={styles.cantidad}>Cantidad</Text>
                    </View>
                    {move.historial_movimientos.map((item, index) => {
                        return (
                            <View key={index} style={styles.tableBody}>
                                <Text style={styles.almacen}>{item.cons_almacen_gestor}</Text>
                                <Text style={styles.cod}>{item.cons_producto}</Text>
                                <Text style={styles.articulo}>{item.Producto.name}</Text>
                                <Text style={styles.cantidad}>{item.cantidad}</Text>
                            </View>
                        );
                    })


                    }
                </View>


                <View style={styles.approvedContainer}>
                    <View style={styles.left} >

                    </View>
                    <View style={styles.right}>
                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Realizado por:</Text>
                            <Text style={styles.user}>{move.realizado.nombre + " " + move.realizado.apellido}</Text>
                        </View>
                        {(move.historial_movimientos[0].cons_lista_movimientos == "DV" || move.historial_movimientos[0].cons_lista_movimientos == "LQ") &&
                            <View style={styles.aprobado}>
                                <Text style={styles.aproTag}>Aprobado por:</Text>
                                <Text style={move.aprobado ? styles.user : styles.noApproved}>{move.aprobado ? move.aprobado.nombre + " " + move.aprobado.apellido : "Pendiente por aprobación"}</Text>
                            </View>
                        }
                    </View>
                </View>

                <View style={styles.observaciones}>
                    <View style={styles.obChild}>
                        <Text style={styles.obChildTag}>Observaciones:</Text>
                        <Text>{move.observaciones}</Text>
                    </View>
                    {move.respuesta &&
                        <View style={styles.obChild}>
                            <Text style={styles.obChildTag}>Respuesta:</Text>
                            <Text>{move.respuesta}</Text>
                        </View>
                    }
                </View>
            </Page>

        </Document>
    );
}
