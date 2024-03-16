

import Tablas from "@components/shared/Tablas/Tablas";

import {
  actualizarVehiculo,
  buscarVehiculo,
  listarVehiculo,
  paginarVehiculo,
  agregarVehiculo
} from '@services/api/vehiculos';

export default function Vehiculo() {


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
          "Editar": "",
          "Activar": "activo"
        }} 
        />

    </>
  );
} 