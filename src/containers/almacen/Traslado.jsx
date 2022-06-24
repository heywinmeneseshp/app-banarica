import React from "react";
import AppContext from "@context/AppContext";
import { useContext } from "react";

//Components
import RecibirTraslado from "@components/almacen/RecibirTraslado";
import RealizarTraslado from "@components/almacen/RealizarTraslado";
import AlertaTraslado from "@assets/almacen/AlertaTraslado";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Traslado() {

  const  {initialState} = useContext(AppContext);

  return (
    <>
        <div className={styles.contenedorPadre}>

          <AlertaTraslado />
          {initialState.state.realizarTraslado && <RealizarTraslado />}
          {initialState.state.recibirTraslado && <RecibirTraslado />}

        </div>
    </>
  );
}