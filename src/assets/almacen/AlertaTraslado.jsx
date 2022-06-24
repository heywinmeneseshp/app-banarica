import React from "react";
import { useContext, useState } from "react";
import AppContext from "@context/AppContext";

//Bootstrap
import { Container } from "react-bootstrap";
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function AlertaTraslado() {

  const { initialState } = useContext(AppContext);

  return (
    <>
      <Alert className={styles.alert} key="warning" variant="warning">
        <div classNeme={styles.alertText} >Traslado No. <b>001028</b> pendiente por recibir</div>
        <button onClick={initialState.handleRecibirTraslado} type="button" className="btn btn-success btn-sm">Ver traslado</button>
      </Alert>
    </>
  )
}