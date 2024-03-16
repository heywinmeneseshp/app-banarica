

import Tablas from '@components/shared/Tablas/Tablas';
import {
  actualizarRutas,
  buscarRutas,
  listarRutas,
  paginarRutas,
  agregarRutas
} from '@services/api/rutas';

export default function Rutas() {


  return (
    <>
      <Tablas
        titulo="Rutas"
        actualizar={actualizarRutas}
        buscarItem={buscarRutas}
        listar={listarRutas}
        paginar={paginarRutas}
        crear={agregarRutas}
        encabezados={{
          "ID": "id",
          "Origen": "ubicacion1",
          "Destino": "ubicacion2",
          "Kms": "km",
          "Detalles": "detalles",
          "Activar": "activo"
        }}
      />
    </>
  );
}
