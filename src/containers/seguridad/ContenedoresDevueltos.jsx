import { useEffect, useMemo, useState } from "react";
import { filtrarContenedor } from "@services/api/contenedores";
import { listarInspecciones } from "@services/api/inpecciones";
import { formatDateValue, RETURNED_STATUS } from "@utils/contenedorEstado";

const getReturnInspectionMap = (inspecciones = []) => {
  const map = new Map();

  inspecciones
    .filter(
      (item) =>
        String(item?.zona || "").toUpperCase() === RETURNED_STATUS ||
        String(item?.observaciones || "").toLowerCase().includes("devuelto")
    )
    .sort((a, b) => new Date(b.fecha_inspeccion || b.createdAt || 0) - new Date(a.fecha_inspeccion || a.createdAt || 0))
    .forEach((item) => {
      if (!map.has(item.id_contenedor)) {
        map.set(item.id_contenedor, item);
      }
    });

  return map;
};

export default function ContenedoresDevueltos() {
  const [loading, setLoading] = useState(true);
  const [contenedores, setContenedores] = useState([]);
  const [inspeccionesMap, setInspeccionesMap] = useState(new Map());
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [responseContenedores, inspecciones] = await Promise.all([
          filtrarContenedor({ habilitado: false }),
          listarInspecciones()
        ]);

        setContenedores(responseContenedores?.data || responseContenedores || []);
        setInspeccionesMap(getReturnInspectionMap(inspecciones || []));
      } catch (error) {
        console.error("Error al cargar contenedores devueltos:", error);
        window.alert("No fue posible cargar el informe de contenedores devueltos.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const rows = useMemo(() => {
    return contenedores
      .filter((item) => String(item?.contenedor || "").toLowerCase().includes(filtro.toLowerCase()))
      .map((item) => {
        const inspeccion = inspeccionesMap.get(item.id);
        return {
          ...item,
          motivo: inspeccion?.observaciones || "Sin motivo registrado",
          fecha: inspeccion?.fecha_inspeccion || item.updatedAt || item.createdAt || "",
          agente: inspeccion?.agente || "Sin agente registrado",
          origen: inspeccion?.observaciones?.match(/^\[(.*?)\]/)?.[1] || "Sin origen"
        };
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [contenedores, filtro, inspeccionesMap]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">Informe de contenedores devueltos</h2>
          <p className="text-muted mb-0">
            Contenedores retirados de la operación por encontrarse en mal estado.
          </p>
        </div>

        <div style={{ minWidth: "280px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar contenedor"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Cargando informe...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered table-sm align-middle">
            <thead>
              <tr>
                <th>Contenedor</th>
                <th>Fecha devolución</th>
                <th>Agente</th>
                <th>Origen</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No hay contenedores devueltos registrados.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center fw-semibold">{item.contenedor}</td>
                    <td className="text-center">{formatDateValue(item.fecha)}</td>
                    <td className="text-center">{item.agente}</td>
                    <td className="text-center text-capitalize">{item.origen.replaceAll("_", " ")}</td>
                    <td>{item.motivo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
