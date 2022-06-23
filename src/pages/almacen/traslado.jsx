import React from "react";
import AppContext from "@context/AppContext";
import { useContext } from "react";

//Components
import SecondLayout from "layout/SecondLayout";
import RecibirTraslado from "@components/almacen/RecibirTraslado";
import RealizarTraslado from "@components/almacen/RealizarTraslado";
import AlertaTraslado from "@assets/almacen/AlertaTraslado";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Traslado() {

  const { state } = useContext(AppContext);

  return (
    <>
      <SecondLayout>
        <div className={styles.contenedorPadre}>

          <AlertaTraslado />
          {state.realizarTraslado && <RealizarTraslado />}
          {state.recibirTraslado && <RecibirTraslado />}

        </div>
      </SecondLayout>
    </>
  );
}