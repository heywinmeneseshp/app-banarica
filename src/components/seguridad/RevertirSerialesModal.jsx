import { useEffect, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import Loader from "@components/shared/Loader";
import { listarSeriales } from "@services/api/seguridad";
import { revertirSerialesContenedor } from "@services/api/seguridad";

export default function RevertirSerialesModal({ contenedor, onClose, onSuccess }) {
  const [seriales, setSeriales] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSeriales = async () => {
      setLoadingData(true);
      try {
        const result = await listarSeriales(null, null, { id_contenedor: contenedor.id, available: false });
        const lista = result?.data || result || [];
        setSeriales(lista);
        setSeleccionados(new Set(lista.map((s) => s.id)));
      } catch (error) {
        window.alert("No fue posible cargar los seriales del contenedor.");
        onClose?.();
      } finally {
        setLoadingData(false);
      }
    };
    fetchSeriales();
  }, [contenedor.id]);

  const toggleSerial = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === seriales.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(seriales.map((s) => s.id)));
    }
  };

  const handleSubmit = async () => {
    if (seleccionados.size === 0) {
      window.alert("Debes seleccionar al menos un serial para revertir.");
      return;
    }
    if (!window.confirm(`¿Revertir ${seleccionados.size} serial(es) al inventario? Esta accion no se puede deshacer.`)) return;
    setSubmitting(true);
    try {
      const result = await revertirSerialesContenedor(contenedor.id, [...seleccionados]);
      window.alert(result?.message || `${seleccionados.size} serial(es) revertidos al inventario.`);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      window.alert(error?.message || "No fue posible revertir los seriales.");
    } finally {
      setSubmitting(false);
    }
  };

  const todosSeleccionados = seriales.length > 0 && seleccionados.size === seriales.length;
  const algunoSeleccionado = seleccionados.size > 0 && seleccionados.size < seriales.length;

  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform} style={{ maxWidth: "680px" }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-bold">Revertir seriales al inventario</span>
              <span className="text-muted ms-2 small">— {contenedor.contenedor}</span>
            </div>
            <button type="button" onClick={onClose} className="btn-close" aria-label="Cerrar" />
          </div>

          <div className="card-body p-0">
            <Loader loading={loadingData || submitting} />

            {!loadingData && seriales.length === 0 && (
              <div className="p-4 text-center text-muted">
                Este contenedor no tiene seriales asignados para revertir.
              </div>
            )}

            {!loadingData && seriales.length > 0 && (
              <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="table table-sm table-striped table-bordered mb-0 align-middle">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th className="text-center" style={{ width: "42px" }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={todosSeleccionados}
                          ref={(el) => { if (el) el.indeterminate = algunoSeleccionado; }}
                          onChange={toggleTodos}
                          title="Seleccionar todos"
                        />
                      </th>
                      <th>Serial</th>
                      <th>Producto</th>
                      <th>Almacen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriales.map((serial) => (
                      <tr
                        key={serial.id}
                        onClick={() => toggleSerial(serial.id)}
                        style={{ cursor: "pointer" }}
                        className={seleccionados.has(serial.id) ? "table-warning" : ""}
                      >
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={seleccionados.has(serial.id)}
                            onChange={() => toggleSerial(serial.id)}
                          />
                        </td>
                        <td className="fw-semibold">{serial.serial}</td>
                        <td>{serial.producto?.name || serial.cons_producto || "—"}</td>
                        <td>{serial.cons_almacen || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loadingData && seriales.length > 0 && (
            <div className="card-footer d-flex justify-content-between align-items-center gap-2">
              <span className="text-muted small">
                {seleccionados.size} de {seriales.length} seleccionado{seleccionados.size !== 1 ? "s" : ""}
              </span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  disabled={submitting || seleccionados.size === 0}
                  onClick={handleSubmit}
                >
                  {submitting ? "Revirtiendo..." : `Revertir ${seleccionados.size > 0 ? seleccionados.size : ""} serial(es)`}
                </button>
              </div>
            </div>
          )}

          {!loadingData && seriales.length === 0 && (
            <div className="card-footer text-end">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
