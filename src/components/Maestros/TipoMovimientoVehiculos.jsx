import Tablas from "@components/shared/Tablas/Tablas";
import {
  actualizartipoMovimientoVehiculo,
  listartipoMovimientoVehiculos,
  paginartipoMovimientoVehiculos,
  agregartipoMovimientoVehiculo,
} from '@services/api/tipoMovimientoVehiculos';

export default function TipoMovimientoVehiculos() {
  return (
    <Tablas
      titulo={"Movimientos vehiculos"}
      actualizar={actualizartipoMovimientoVehiculo}
      listar={listartipoMovimientoVehiculos}
      paginar={paginartipoMovimientoVehiculos}
      crear={agregartipoMovimientoVehiculo}
      encabezados={{
        "ID": "id",
        "Movimiento": "movimiento",
        "Requiere contenedor": "requiere_contenedor",
        "Finca en": "finca_en",
        "Editar": "",
        "Activar": "activo",
      }}
      checkboxFields={["requiere_contenedor"]}
      listas={{
        "Finca en": [
          { id: "origen", nombre: "Origen" },
          { id: "destino", nombre: "Destino" },
        ],
      }}
    />
  );
}
