import Tablas from "@components/shared/Tablas/Tablas";
import endPoints from "@services/api";
import { actualizarAlmacen, listarAlmacenes, paginarAlmacenes, agregarAlmacen } from "@services/api/almacenes";

// Tablas espera `activo` (true=activo), almacenes usa `isBlock` (true=bloqueado).
// Estos wrappers adaptan la interfaz sin tocar el backend.

const paginarAdaptado = async (page, limit, nombre) => {
  const res = await paginarAlmacenes(page, limit, nombre);
  return {
    ...res,
    data: (res?.data || []).map((a) => ({ ...a, activo: !a.isBlock })),
  };
};

const actualizarAdaptado = (id, changes) => {
  const mapped = { ...changes };
  if ("activo" in mapped) {
    mapped.isBlock = !mapped.activo;
    delete mapped.activo;
  }
  return actualizarAlmacen(id, mapped);
};

const agregarAdaptado = (data) => {
  const mapped = { ...data };
  if ("activo" in mapped) {
    mapped.isBlock = !mapped.activo;
    delete mapped.activo;
  }
  return agregarAlmacen(mapped);
};

export default function Bodega() {
  return (
    <Tablas
      titulo="Almacenes"
      actualizar={actualizarAdaptado}
      listar={listarAlmacenes}
      paginar={paginarAdaptado}
      crear={agregarAdaptado}
      encabezados={{
        "Código":       "consecutivo",
        "Almacén":      "nombre",
        "Razón social": "razon_social",
        "Dirección":    "direccion",
        "Teléfono":     "telefono",
        "Email":        "email",
        "Editar":       "",
        "Activar":      "activo",
      }}
      optionalFields={["razon_social", "direccion", "telefono", "email"]}
      endPointCargueMasivo={endPoints.almacenes.bulkCreate}
      encabezadosCargueMasivo={{
        consecutivo: null,
        nombre: null,
        razon_social: null,
        direccion: null,
        telefono: null,
        email: null,
      }}
      tituloCargueMasivo="Cargue masivo almacenes"
      endPointActualizacionMasiva={endPoints.almacenes.bulkUpdate}
      encabezadosActualizacionMasiva={{
        consecutivo: null,
        nombre: null,
        razon_social: null,
        direccion: null,
        telefono: null,
        email: null,
      }}
      tituloActualizacionMasiva="Actualizar almacenes masivo"
    />
  );
}
