


import Tablas from "@components/shared/Tablas/Tablas";

import { actualizarUbicacion, buscarUbicacion, listarUbicaciones, paginarUbicaciones, agregarUbicacion } from '@services/api/ubicaciones';

export default function CategoriaVehiculos() {

  return (
    <>
      <Tablas
        titulo={"Ubicaciones"}
        actualizar={actualizarUbicacion}
        buscarItem={buscarUbicacion}
        listar={listarUbicaciones}
        paginar={paginarUbicaciones}
        crear={agregarUbicacion}
        encabezados={{
          "ID": "id", "Ubicacion": "ubicacion", "Detalle": "detalle", "Editar": "", "Activar": "activo"
        }}
/>
    </>
  );
} 