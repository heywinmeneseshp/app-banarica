

import Tablas from "@components/shared/Tablas/Tablas";

import {
  actualizarVehiculo,
  buscarVehiculo,
  listarVehiculo,
  paginarVehiculo,
  agregarVehiculo
} from '@services/api/vehiculos';

import { listarcategoriaVehiculos } from "@services/api/CategoriaVehiculos";
import { listarConductores } from "@services/api/conductores";

import { useEffect, useState } from "react";

export default function Vehiculo() {

  const [categoryV, setCategoryV] = useState();
  const [conductoresL, setConductoresL] = useState();

  useEffect(() => {
    listar();
  }, []);

  const listar = async () => {
    const categorias = await listarcategoriaVehiculos();
    const conductores = await listarConductores();
    const listaCategorias = categorias.map(item => { return { id: item?.id, nombre: item?.categoria }; });
    const listaConductores = conductores.map(item => { return { id: item?.id, nombre: item?.conductor }; });
    setCategoryV(listaCategorias);
    setConductoresL(listaConductores);
  };

  return (
    <>
      <Tablas
        titulo={"Vehiculos"}
        actualizar={actualizarVehiculo}
        buscarItem={buscarVehiculo}
        listar={listarVehiculo}
        paginar={paginarVehiculo}
        crear={agregarVehiculo}
        encabezados={{
          "ID": "id",
          "Vehiculo": "vehiculo",
          "Modelo": "modelo",
          "Placa": "placa",
          "Conductor": "conductor_id",
          "Categoria": "categoria_id",
          "Combustible": "combustible",
          "Gal por Km": "gal_por_km",
          "Editar": "",
          "Activar": "activo"
        }}
        listas={{
          "Categoria": categoryV,
          "Conductor": conductoresL
        }}
        type={[null, null, null, null, null, null, "number" ,"number", null, null]}

      />

    </>
  );
} 