
import Tablas from "@components/shared/Tablas/Tablas";

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
          "Nit": "nit",
          "Razon social": "razon_social",
          "Domicilio": "domicilio",
          "Telefono": "telefono",
          "Email": "email",
          "Editar": "",
          "Activar": "activo"
        }}


      />

    </>
  );
} 