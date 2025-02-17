
import Tablas from "@components/shared/Tablas/Tablas";
import endPoints from "@services/api";

import { actualizarClientes, buscarClientes, listarClientes, paginarClientes, agregarClientes } from "@services/api/clientes";






export default function Clientes() {

  return (
    <>
      <Tablas
        titulo={"Clientes"}
        actualizar={actualizarClientes}
        buscarItem={buscarClientes}
        listar={listarClientes}
        paginar={paginarClientes}
        crear={agregarClientes}
        encabezados={{
          "ID": "id",
          "Cod": "cod",
          "Nit": "nit",
          "Razon social": "razon_social",
          "Domicilio": "domicilio",
          "Telefono": "telefono",
          "Email": "email",
          "Editar": "",
          "Activar": "activo"
        }}

        //Cargue Masivo
        tituloCargueMasivo={"Clientes"}
        endPointCargueMasivo={endPoints.clientes.create + "/masivo"}
        encabezadosCargueMasivo={{
          "cod": null,
          "nit": null,
          "razon_social": null,
          "domicilio": null,
          "telefono": null,
          "email": null,
          "pais": null,
          "activo": null,
        }}
      />

    </>
  );
} 