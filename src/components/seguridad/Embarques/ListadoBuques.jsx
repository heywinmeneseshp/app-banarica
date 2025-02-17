import { useEffect, useState } from "react";
import Tablas from "@components/shared/Tablas/Tablas";
import {
  actualizarBuques,
  crearBuques,
  encontrarBuques,
  listarBuques,
  paginarBuques
} from "@services/api/buques";
import {
  listarNavieras,
} from "@services/api/navieras";
import endPoints from "@services/api";


const ListadoBuques = () => {
  const [navieras, setNavieras] = useState([]);

  // Obtener la lista de navieras al cargar el componente
  useEffect(() => {
    const fetchNavieras = async () => {
      try {
        const res = await listarNavieras();
        const listaNavieras = res.map((item) => ({
          id: item?.id,
          nombre: item?.navieras,
        }));
        setNavieras(listaNavieras);
      } catch (error) {
        console.error('Error al listar navieras:', error);
      }
    };

    fetchNavieras();
  }, []);

  return (
    <>
      <Tablas
        titulo={null}
        actualizar={actualizarBuques}
        buscarItem={encontrarBuques}
        paginar={paginarBuques}
        crear={crearBuques}
        listar={listarBuques}
        encabezados={{
          "ID": "id",
          "Buque": "buque",
          "Naviera": "id_naviera",
          "Editar": "",
          "Activar": "habilitado",
        }}
        listas={{
          "Naviera": navieras,
        }}
        //Cargue Masivo
        tituloCargueMasivo={"Buques"}
        endPointCargueMasivo={endPoints.Buques.create + "/masivo"}
        encabezadosCargueMasivo={{
          "buque": null,
          "id_naviera": null,
          "habilitado": null
        }}
      />
    </>
  );
};

export default ListadoBuques;
