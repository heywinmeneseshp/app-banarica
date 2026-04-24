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
        "Editar": "",
        "Activar": "activo",
      }}
      checkboxFields={["requiere_contenedor"]}
    />
  );
}
