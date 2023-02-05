import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export default function StockPDF({ data }) {

    const date = new Date();

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
        inv: { textAlign: 'center', width: "100%", fontSize: "18", fontWeight: "600", marginBottom: "10px" },
        company: { textAlign: 'center', width: "60%", fontSize: "10" },
        companyName: { fontSize: data.comercializadora == "C.I. BANACHICA S.A.S. ZOMAC." ? "18" : "13", fontStyle: "bold", marginBottom: "10px" },
        movimiento: { textAlign: "left", width: "40%", marginLeft: "30px" },
        movChild: { display: "flex", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "8px" },
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
            opacity: "0.5"
        },
        table: { marginTop: "30px" },
        tableHead: { display: "flex", fontSize: "9", flexDirection: "row", width: "85%", borderBottom: "2px solid #AEB6BF", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" },
        tableBody: { display: "flex", fontSize: "9", flexDirection: "row", width: "85%", borderBottom: "1px solid #AEB6BF", paddingBottom: "6px", paddingTop: "6px", paddingRight: "5px", paddingLeft: "5px" },
        cod: { width: "10%", textAlign: "center" },
        articulo: { width: "26%" },
        cantidad: { width: "14%", textAlign: "center", borderLeft: "1px solid #AEB6BF" },

        approvedContainer: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginBottom: "30px", marginTop: "30px" },
        left: { width: "50%", marginRight: "10px" },
        right: { width: "50%", marginLeft: "10px" },

        approvedContainer2: { display: "flex", flexDirection: "row", justifyContent: "flex-end", textAlign: "left", width: "85%", marginTop: "30px" },
        left2: { width: "70%" },
        right2: { width: "30%" },
        aprobado2: { display: "flex", width: "100%", flexDirection: "row", paddingBottom: "8px", paddingTop: "10px", paddingRight: "10px", paddingLeft: "10px", marginLeft: "" },
        aproTag2: { marginRight: "10px", width: "100%", textAlign: "center" },
        noApproved2: { textAlign: "center", width: "100%", color: "red" },

        aprobado: { display: "flex", width: "100%", flexDirection: "row", borderBottom: "1px solid #AEB6BF", paddingBottom: "8px", paddingTop: "10px", paddingRight: "10px", paddingLeft: "10px", marginLeft: "" },
        aproTag: { marginRight: "10px", width: "100%", textAlign: "left", marginBottom: "40px" },
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
                        <Text style={styles.inv}>INVENTARIO</Text>
                        <Text style={styles.companyName}>{data.comercializadora}</Text>
                        <Text>{data.direccion}</Text>
                        <Text>{data.tel}</Text>
                        <Text>{data.correo}</Text>
                    </View>

                    <View style={styles.movimiento}>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Alamcén:</Text>
                            <Text>{data.list[0]?.almacen?.nombre}</Text>
                        </View>
                        <View style={styles.movChild}>
                            <Text style={styles.movTag}>Fecha:</Text>
                            <Text>{`${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={styles.cod}>Cod</Text>
                        <Text style={styles.articulo}>Artículo</Text>
                        <Text style={styles.cantidad}>Bueno</Text>
                        <Text style={styles.cantidad}>Defectuoso</Text>
                        <Text style={styles.cantidad}>Averiado</Text>
                        <Text style={styles.cantidad}>Teórico</Text>
                        <Text style={styles.cantidad}>Físico</Text>
                    </View>
                    {data.list.map((item, index) => {
                        return (
                            <View key={index} style={styles.tableBody}>
                                <Text style={styles.cod}>{item.cons_producto}</Text>
                                <Text style={styles.articulo}>{item.producto.name}</Text>
                                <Text style={styles.cantidad}></Text>
                                <Text style={styles.cantidad}></Text>
                                <Text style={styles.cantidad}></Text>
                                <Text style={styles.cantidad}>{item.cantidad}</Text>
                                <Text style={styles.cantidad}></Text>
                            </View>
                        );
                    })


                    }
                </View>


                <View style={styles.approvedContainer2}>
                    <View style={styles.left2} >

                        <View style={styles.aprobado2}>
                            <Text style={styles.aproTag2}>¿La bodega se encontraba limpia y organizada?</Text>
                            <Text style={styles.user2}></Text>
                        </View>

                        <View style={styles.aprobado2}>
                            <Text style={styles.aproTag2}>¿El personal encargado se encontraba disponible?</Text>
                            <Text style={styles.user2}></Text>
                        </View>

                    </View>
                    <View style={styles.right2}>

                        <View style={styles.aprobado2}>
                            <Text style={styles.aproTag2}>Si: _____ No: _____</Text>
                            <Text style={styles.user2}></Text>
                        </View>

                        <View style={styles.aprobado2}>
                            <Text style={styles.aproTag2}>Si: _____  No: _____</Text>
                            <Text style={styles.user2}></Text>
                        </View>

                    </View>
                </View>

                <View style={styles.approvedContainer}>
                    <View style={styles.left} >

                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Nombre Represetante Comercializadora:</Text>
                            <Text style={styles.user}></Text>
                        </View>

                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Nombre Representante Finca:</Text>
                            <Text style={styles.user}></Text>
                        </View>

                    </View>
                    <View style={styles.right}>


                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Firma:</Text>
                            <Text style={styles.user}></Text>
                        </View>

                        <View style={styles.aprobado}>
                            <Text style={styles.aproTag}>Firma:</Text>
                            <Text style={styles.user}></Text>
                        </View>



                    </View>
                </View>

            </Page>

        </Document>
    );
}
