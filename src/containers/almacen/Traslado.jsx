import React from "react";
import AppContext from "@context/AppContext";
import { useContext } from "react";

//Components
import RecibirTraslado from "@components/almacen/RecibirTraslado";
import RealizarTraslado from "@components/almacen/RealizarTraslado";
import AlertaTraslado from "@assets/almacen/Alerta";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Traslado() {

  const  {initialState} = useContext(AppContext);
   
  const data = {
    consecutivo: "20843",
    almacen: "302",
    movimiento: "Liquidacion",
    mensaje: "pendiente por aprobar"
  }

  return (
    <>
        <div className={styles.contenedorPadre}>

          <AlertaTraslado data={data}/>
          {initialState.state.realizarTraslado && <RealizarTraslado />}
          {initialState.state.recibirTraslado && <RecibirTraslado />}

        </div>
    </>
  );
}