import { useMemo, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import Loader from "@components/shared/Loader";
import { crearContenedor } from "@services/api/contenedores";
import { crearInspeccion } from "@services/api/inspecciones";
import { revertirSerialesContenedor } from "@services/api/seguridad";
import { RETURNED_STATUS } from "@utils/contenedorEstado";

const DEFAULT_REASON = "";

export default function DevolverContenedorModal({
  contenedor,
  listadoItem,
  onClose,
  onSuccess,
  origen = "dashboard",
  usuario
}) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState(DEFAULT_REASON);
  const [revertirSeriales, setRevertirSeriales] = useState(false);

  const resolvedContenedor = contenedor || listadoItem?.Contenedor;

  const label = useMemo(
    () => resolvedContenedor?.contenedor || resolvedContenedor?.Contenedor?.contenedor || "",
    [resolvedContenedor]
  );

  const serialesAsignados = useMemo(
    () => (listadoItem?.serial_de_articulos || []).filter((s) => s?.serial),
    [listadoItem]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!label.trim()) {
      window.alert("No fue posible identificar el codigo del contenedor a devolver.");
      return;
    }

    if (!motivo.trim()) {
      window.alert("Debes registrar el motivo de la devolucion.");
      return;
    }

    setLoading(true);

    try {
      const nuevoContenedor = await crearContenedor({
        contenedor: label.trim().toUpperCase(),
        habilitado: false
      });

      const containerId = nuevoContenedor?.id || nuevoContenedor?.data?.id;
      if (!containerId) {
        throw new Error("No fue posible crear el contenedor devuelto.");
      }

      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0];
      const agente =
        [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ").trim()
        || usuario?.username
        || "Sistema";

      await crearInspeccion({
        id_contenedor: containerId,
        id_usuario: usuario?.id || null,
        fecha_inspeccion: now.toISOString(),
        hora_inicio: currentTime,
        hora_fin: currentTime,
        agente,
        zona: RETURNED_STATUS,
        observaciones: `[${origen}] ${motivo.trim()}`,
        habilitado: true
      });

      if (revertirSeriales) {
        const idContenedor = listadoItem?.id_contenedor || resolvedContenedor?.id;
        const serialIds = serialesAsignados.map((s) => s.id).filter(Boolean);
        if (idContenedor) {
          await revertirSerialesContenedor(idContenedor, serialIds);
        }
      }

      window.alert(`Se registro la devolucion del contenedor ${label}.`);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error al devolver contenedor:", error);
      window.alert(error?.message || "No fue posible registrar la devolucion del contenedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform} style={{ maxWidth: "720px" }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">Devolucion de contenedor</span>
            <button type="button" onClick={onClose} className="btn-close" aria-label="Cerrar" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <Loader loading={loading} />

              <div className="alert alert-warning mb-3">
                Se creara un nuevo registro deshabilitado para el contenedor{" "}
                <strong>{label || "sin identificar"}</strong> y quedara disponible en el informe
                de devueltos.
              </div>

              <div className="mb-3">
                <label htmlFor="motivo-devolucion" className="form-label fw-semibold">
                  Motivo de devolucion
                </label>
                <textarea
                  id="motivo-devolucion"
                  className="form-control"
                  rows="4"
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Describe el dano o la condicion encontrada"
                  required
                />
              </div>

              {listadoItem && (
                <div className="border rounded p-3 bg-light">
                  <p className="mb-2 fw-semibold">
                    Seriales del contenedor
                    {serialesAsignados.length > 0 && (
                      <span className="badge bg-secondary ms-2">{serialesAsignados.length}</span>
                    )}
                  </p>
                  <div className="form-check mb-1">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="revertir-no"
                      name="revertir"
                      checked={!revertirSeriales}
                      onChange={() => setRevertirSeriales(false)}
                    />
                    <label className="form-check-label" htmlFor="revertir-no">
                      Conservar seriales (no vuelven al inventario)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="revertir-si"
                      name="revertir"
                      checked={revertirSeriales}
                      onChange={() => setRevertirSeriales(true)}
                    />
                    <label className="form-check-label" htmlFor="revertir-si">
                      Revertir seriales al inventario
                    </label>
                  </div>
                  {revertirSeriales && (
                    <div className="alert alert-info mt-2 mb-0 py-2 small">
                      Los seriales asignados a este contenedor quedaran disponibles nuevamente en el inventario.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card-footer d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger" disabled={loading}>
                Confirmar devolucion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
