import React from "react";

//Components
import SecondLayout from "layout/SecondLayout";
import RecibirTraslado from "@components/almacen/RecibirTraslado";
import RealizarTraslado from "@components/almacen/RealizarTraslado";
import AlertaTraslado from "@assets/almacen/AlertaTraslado";

//CSS


export default function traslado() {
  return (
    <>
      <SecondLayout>
        <AlertaTraslado />
        <RealizarTraslado />
        <RecibirTraslado />
      </SecondLayout>
    </>
  )
}