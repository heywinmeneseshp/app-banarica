
import Tablas from "@components/shared/Tablas/Tablas";

import {
  actualizarcategoriaVehiculos,
  listarcategoriaVehiculos,
  paginarcategoriaVehiculos,
  agregarcategoriaVehiculos
} from '@services/api/CategoriaVehiculos';
import { useEffect } from "react";

export default function Ubicaciones() {

  useEffect(()=>{

  },[]);
  


  return (
    <>
      <Tablas
        titulo={"Categoria Vehiculos"}
        actualizar={actualizarcategoriaVehiculos}
        listar={listarcategoriaVehiculos}
        paginar={paginarcategoriaVehiculos}
        crear={agregarcategoriaVehiculos}
        cargueMasivo={null}
        encabezados={{
          "ID": "id", 
          "Categoria": "categoria", 
          "Galones por Km": "galones_por_kilometro", 
          "Editar": "",
          "Activar": "activo"
        }}
    />
    </>
  );
} 