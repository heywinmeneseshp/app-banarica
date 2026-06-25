import Tablas from "@components/shared/Tablas/Tablas";
import NuevoCombo from "@components/administrador/NuevoCombo";
import endPoints from "@services/api";
import { actualizarCombos, listarCombos, paginarCombos, agregarCombos } from "@services/api/combos";

const paginarAdaptado = async (page, limit, nombre) => {
  const res = await paginarCombos(page, limit, nombre, { isBlock: [true, false] });
  return {
    ...res,
    data: (res?.data || []).map((a) => ({
      ...a,
      activo: !a.isBlock,
      id: a.consecutivo,
    })),
  };
};

const actualizarAdaptado = (id, changes) => {
  const mapped = { ...changes };
  if ("activo" in mapped) { mapped.isBlock = !mapped.activo; delete mapped.activo; }
  return actualizarCombos(id, mapped);
};

const agregarAdaptado = (data) => {
  const mapped = { ...data };
  if ("activo" in mapped) { mapped.isBlock = !mapped.activo; delete mapped.activo; }
  return agregarCombos(mapped);
};

export default function Combo() {
  return (
    <Tablas
      titulo="Combos"
      actualizar={actualizarAdaptado}
      listar={listarCombos}
      paginar={paginarAdaptado}
      crear={agregarAdaptado}
      encabezados={{
        "Código":              "consecutivo",
        "Nombre":              "nombre",
        "Cajas x Palet":      "cajas_por_palet",
        "Cajas x Mini Palet": "cajas_por_mini_palet",
        "Palets x Cont.":     "palets_por_contenedor",
        "Peso N":              "peso_neto",
        "Peso B":              "peso_bruto",
        "Precio":              "precio_de_venta",
        "Editar":              "",
        "Activar":             "activo",
      }}
      optionalFields={["id_cliente", "cajas_por_palet", "cajas_por_mini_palet", "palets_por_contenedor", "peso_neto", "peso_bruto", "precio_de_venta"]}
      endPointCargueMasivo={endPoints.combos.bulkCreate}
      encabezadosCargueMasivo={{
        consecutivo:           null,
        nombre:                null,
        id_cliente:            null,
        cajas_por_palet:       null,
        cajas_por_mini_palet:  null,
        palets_por_contenedor: null,
        peso_neto:             null,
        peso_bruto:            null,
        precio_de_venta:       null,
        isBlock:               null,
      }}
      tituloCargueMasivo="Cargue masivo combos"
      endPointActualizacionMasiva={endPoints.combos.bulkUpdate}
      encabezadosActualizacionMasiva={{
        consecutivo:           null,
        nombre:                null,
        id_cliente:            null,
        cajas_por_palet:       null,
        cajas_por_mini_palet:  null,
        palets_por_contenedor: null,
        peso_neto:             null,
        peso_bruto:            null,
        precio_de_venta:       null,
        isBlock:               null,
      }}
      tituloActualizacionMasiva="Actualizar combos masivo"
      renderModal={({ open, setOpen, setAlert, item }) => (
        <NuevoCombo open={open} setOpen={setOpen} setAlert={setAlert} item={item} />
      )}
    />
  );
}
