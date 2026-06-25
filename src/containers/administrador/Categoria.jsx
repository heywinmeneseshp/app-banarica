import Tablas from "@components/shared/Tablas/Tablas";
import endPoints from "@services/api";
import { actualizarCategorias, listarCategorias, filtrarCategorias, agregarCategorias } from "@services/api/categorias";

const paginarAdaptado = async (page, limit, nombre) => {
  const res = await filtrarCategorias(page, limit, nombre);
  return { ...res, data: (res?.data || []).map((a) => ({ ...a, activo: !a.isBlock })) };
};

const actualizarAdaptado = (id, changes) => {
  const mapped = { ...changes };
  if ("activo" in mapped) { mapped.isBlock = !mapped.activo; delete mapped.activo; }
  return actualizarCategorias(id, mapped);
};

const agregarAdaptado = (data) => {
  const mapped = { ...data };
  if ("activo" in mapped) { mapped.isBlock = !mapped.activo; delete mapped.activo; }
  return agregarCategorias(mapped);
};

export default function Categoria() {
  return (
    <Tablas
      titulo="Categorías"
      actualizar={actualizarAdaptado}
      listar={listarCategorias}
      paginar={paginarAdaptado}
      crear={agregarAdaptado}
      encabezados={{
        "Código": "consecutivo",
        "Nombre": "nombre",
        "Editar": "",
        "Activar": "activo",
      }}
      endPointCargueMasivo={endPoints.categorias.bulkCreate}
      encabezadosCargueMasivo={{ consecutivo: null, nombre: null }}
      tituloCargueMasivo="Cargue masivo categorías"
      endPointActualizacionMasiva={endPoints.categorias.bulkUpdate}
      encabezadosActualizacionMasiva={{ consecutivo: null, nombre: null }}
      tituloActualizacionMasiva="Actualizar categorías masivo"
    />
  );
}
