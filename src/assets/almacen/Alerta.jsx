import React from "react";
import { useContext, useState } from "react";
import AppContext from "@context/AppContext";

//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Alerta({ data }) {

  const { initialState } = useContext(AppContext);
  /*
  const data = {
    consecutivo: "20843",
    almacen: "302",
    movimiento: "Liquidacion",
    mensaje: "pendiente por aprobar"
  }*/

  return (
    <>
      <Alert className={styles.alert} key="warning" variant="warning">
        <div >
          <b>| {data.almacen} |</b> {data.movimiento} <b>{data.consecutivo}</b> {data.mensaje}
        </div>
        <div className={styles.cajaBoton}>
          <button onClick={initialState.handleRecibirTraslado} type="button" className="btn btn-success btn-sm">Ver</button>
        </div>
      </Alert>
    </>
  )
}