import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppContext from "@context/AppContext";

//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components
//CSS
import styles from "@styles/almacen/almacen.module.css";


export default function Alerta({ data }) {
    const router = useRouter();
    const { gestionNotificacion } = useContext(AppContext);
    const [color, setColor] = useState(null);
    const [texto, setTexto] = useState("");

    const onButton = () => {
        gestionNotificacion.ingresarNotificacion(data);
        if (data.tipo_movimiento == "Pedido") {
            window.open(process.env.NEXT_PUBLIC_OWN_URL + "/Documento/Pedido/" + data.cons_movimiento);
        } else {
            router.push(`/Movimiento/${data.tipo_movimiento}/${data.cons_movimiento}`);
        }
    };

    useEffect(() => {
        setColor("warning");
        let texto = data.tipo_movimiento;
        if (data.tipo_movimiento == "Pedido") setColor("success");
        if (data.tipo_movimiento == "Liquidacion") {
            setColor("danger");
            texto = "Liquidación";
        }
        if (data.tipo_movimiento == "Devolucion") texto = "Devolución";
        setTexto(texto);
    });

    return (
        <>
            <Alert className={styles.alert} key={color} variant={color}>
                <div className={styles.boton_desktop}>
                    <div >
                        <b>| {data.almacen_receptor} |</b> {texto} <b>{data.cons_movimiento}</b> {data.descripcion}
                    </div>
                    <div className={styles.cajaBoton}>
                        <button onClick={onButton} type="button" className="btn btn-success btn-sm w-100">Ver</button>
                    </div>
                </div>

                <div
  key=""
  className={styles.boton_mobile}
  onClick={() => onButton()}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onButton();
    }
  }}
  role="button"
  tabIndex={0}
>

                    <b>| {`${data.almacen_receptor}`} | </b> {` ${texto}`} {`${data.cons_movimiento}`} {data.descripcion}
                </div>
            </Alert>
        </>
    );
}