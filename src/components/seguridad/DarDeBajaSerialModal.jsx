import { useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import Loader from "@components/shared/Loader";
import { darDeBajaSerial } from "@services/api/seguridad";

const MOTIVOS = ["Avería", "Obsolescencia", "Pérdida", "Robo", "Destrucción", "Donación", "Otro"];

export default function DarDeBajaSerialModal({ seriales, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo) {
      window.alert("Debes seleccionar un motivo de baja.");
      return;
    }
    if (!window.confirm(
      `¿Dar de baja ${seriales.length} serial(es) por motivo "${motivo}"?\nEsta accion no se puede deshacer.`
    )) return;

    setSubmitting(true);
    try {
      const result = await darDeBajaSerial({
        serial_ids: seriales.map((s) => s.id),
        motivo,
        observacion: observacion.trim() || undefined,
      });
      window.alert(result?.message || `${seriales.length} serial(es) dado(s) de baja.`);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      window.alert(error?.message || "No fue posible dar de baja los seriales.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform} style={{ maxWidth: "560px" }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold text-danger">Dar de baja seriales</span>
            <button type="button" onClick={onClose} className="btn-close" aria-label="Cerrar" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <Loader loading={submitting} />

              <div className="alert alert-warning py-2 mb-3">
                <strong>{seriales.length} serial(es)</strong> seleccionado(s) para dar de baja. Esta
                accion es <strong>irreversible</strong> y los seriales no podran reutilizarse.
              </div>

              <div className="mb-3">
                <label htmlFor="motivo" className="form-label fw-semibold">Motivo de baja <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  disabled={submitting}
                >
                  <option value="">-- Seleccionar motivo --</option>
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label htmlFor="observacion" className="form-label fw-semibold">Observacion</label>
                <textarea
                  className="form-control"
                  id="observacion"
                  rows={3}
                  maxLength={200}
                  placeholder="Descripcion adicional (opcional)"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  disabled={submitting}
                />
                <div className="form-text text-end">{observacion.length}/200</div>
              </div>

              <div className="table-responsive" style={{ maxHeight: "200px", overflowY: "auto" }}>
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>Serial</th>
                      <th>Producto</th>
                      <th>Almacen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriales.map((s) => (
                      <tr key={s.id} className="table-danger">
                        <td className="fw-semibold">{s.serial}</td>
                        <td>{s.producto?.name || s.cons_producto || "—"}</td>
                        <td>{s.cons_almacen || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-footer d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger btn-sm" disabled={submitting || !motivo}>
                {submitting ? "Procesando..." : `Dar de baja ${seriales.length} serial(es)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
