
import Tablas from "@components/shared/Tablas/Tablas";
import endPoints from "@services/api";


import { actualizarNavieras, crearNavieras, listarNavieras, paginarNavieras } from "@services/api/navieras";
import { useEffect } from "react";


const ListadoNavieras = () => {


  useEffect(() => {
  }, []);



  return (
    <>{
      <Tablas
        titulo={null}
        actualizar={actualizarNavieras}
        buscarItem={paginarNavieras}
        paginar={paginarNavieras}
        crear={crearNavieras}
        cargueMasivo={true}
        listar={listarNavieras}
        encabezados={{
          "ID": "id",
          "Cod": "cod",
          "Naviera": "navieras",
          "Editar": "",
          "Activar": "habilitado"
        }}
        tituloCargueMasivo={"Navieras"}
        endPointCargueMasivo={endPoints.Navieras.cargueMasivo}
        encabezadosCargueMasivo={{
          "cod": null,
          "navieras": null,
          "habilitado": null
        }}
      />}
    </>
  );
};

export default ListadoNavieras;
