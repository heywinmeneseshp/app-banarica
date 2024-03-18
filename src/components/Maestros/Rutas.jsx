

import Tablas from '@components/shared/Tablas/Tablas';
import {
  actualizarRutas,
  buscarRutas,
  listarRutas,
  paginarRutas,
  agregarRutas
} from '@services/api/rutas';

import { listarUbicaciones } from '@services/api/ubicaciones';
import { useEffect, useState } from 'react';

export default function Rutas() {

  const [ubicaciones, setUbicaciones ] = useState();

  useEffect(() => {
    listar();
  }, []);

  const listar = async () => {
    const categorias = await listarUbicaciones();
    const listaUbicaciones = categorias.map(item => { return { id: item.id, nombre: item.ubicacion }; });

    console.log(listaUbicaciones);
    setUbicaciones(listaUbicaciones);

  };

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

        listas={{
          "Origen": ubicaciones,
          "Destino": ubicaciones
        }}
      />
    </>
  );
}
