
import Tablas from "@components/shared/Tablas/Tablas";

import {
  actualizarcategoriaVehiculos,
  buscarcategoriaVehiculos,
  listarcategoriaVehiculos,
  paginarcategoriaVehiculos,
  agregarcategoriaVehiculos
} from '@services/api/CategoriaVehiculos';

export default function Ubicaciones() {


  return (
    <>
      <Tablas
        titulo={"Categoria Vehiculos"}
        actualizar={actualizarcategoriaVehiculos}
        buscarItem={buscarcategoriaVehiculos}
        listar={listarcategoriaVehiculos}
        paginar={paginarcategoriaVehiculos}
        crear={agregarcategoriaVehiculos}
        encabezados={{
          "ID": "id", "Categoria": "categoria", "Galones por Km": "galones_por_kilometro", "Editar": "", "Activar": "activo"
        }}
    />
    </>
  );
} 