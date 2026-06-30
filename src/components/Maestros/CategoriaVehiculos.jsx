
import Tablas from "@components/shared/Tablas/Tablas";
import endPoints from "@services/api";

import {
  actualizarcategoriaVehiculos,
  listarcategoriaVehiculos,
  paginarcategoriaVehiculos,
  agregarcategoriaVehiculos
} from '@services/api/categoriaVehiculos';

export default function CategoriaVehiculos() {
  return (
    <Tablas
      titulo="Categoria Vehiculos"
      actualizar={actualizarcategoriaVehiculos}
      listar={listarcategoriaVehiculos}
      paginar={paginarcategoriaVehiculos}
      crear={agregarcategoriaVehiculos}
      encabezados={{
        "ID": "id",
        "Categoria": "categoria",
        "Galones por Km": "galones_por_kilometro",
        "Editar": "",
        "Activar": "activo"
      }}
      endPointCargueMasivo={endPoints.categoriaVehiculos.bulkCreate}
      encabezadosCargueMasivo={{ categoria: null, galones_por_kilometro: null, activo: null }}
      tituloCargueMasivo="Cargue masivo categoría vehículos"
      endPointActualizacionMasiva={endPoints.categoriaVehiculos.bulkUpdate}
      encabezadosActualizacionMasiva={{ categoria: null, galones_por_kilometro: null, activo: null }}
      tituloActualizacionMasiva="Actualizar categoría vehículos masivo"
    />
  );
}
