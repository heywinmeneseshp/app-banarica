
import Tablas from "@components/shared/Tablas/Tablas";


import { actualizarNavieras, crearNavieras, listarNavieras, paginarNavieras } from "@services/api/navieras";
import { useEffect } from "react";


const ListadoNavieras = () => {


  useEffect(() => {
  }, []);



  return (
    <>{
      <Tablas
        actualizar={actualizarNavieras}
        buscarItem={paginarNavieras}
        paginar={paginarNavieras}
        crear={crearNavieras}
        listar={listarNavieras}
        encabezados={{
          "ID": "id",
          "Cod": "cod",
          "Naviera": "navieras",
          "Editar": "",
          "Activar": "habilitado"
        }}
      />}
    </>
  );
};

export default ListadoNavieras;
