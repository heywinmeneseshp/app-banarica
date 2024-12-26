import { useEffect } from "react";
import Tablas from "@components/shared/Tablas/Tablas";
import { actualizarDestinos, crearDestinos, encontrarDestinos, listarDestinos, paginarDestinos } from "@services/api/destinos";


const ListadoDestinos = () => {


  // Obtener la lista de navieras al cargar el componente
  useEffect(() => {
  }, []);

  return (
    <Tablas
      actualizar={actualizarDestinos}
      buscarItem={encontrarDestinos}
      paginar={paginarDestinos}
      crear={crearDestinos}
      listar={listarDestinos}
      encabezados={{
        "ID": "id",
        "Cod": "cod",
        "Destino": "destino",
        "Pais": "pais",
        "Activar": "habilitado",
      }}
    />
  );
};

export default ListadoDestinos;
