import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@hooks/useAuth";
import { listarSeriales } from "@services/api/seguridad";
import DarDeBajaSerialModal from "@components/seguridad/DarDeBajaSerialModal";
import Loader from "@components/shared/Loader";

const PAGE_SIZE = 50;

export default function BajaSeriales() {
  const { almacenByUser } = useAuth();

  const [seriales, setSeriales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const [filtros, setFiltros] = useState({
    serial: "",
    bag_pack: "",
    s_pack: "",
    m_pack: "",
    l_pack: "",
    cons_almacen: "",
    cons_producto: "",
  });

  const almacenes = useMemo(() => almacenByUser || [], [almacenByUser]);

  const listar = useCallback(async (page = 1) => {
    setLoading(true);
    setSeleccionados(new Set());
    try {
      const body = {
        available: true,
        dado_de_baja: false,
        ...(filtros.serial ? { serial: filtros.serial } : {}),
        ...(filtros.bag_pack ? { bag_pack: filtros.bag_pack } : {}),
        ...(filtros.s_pack ? { s_pack: filtros.s_pack } : {}),
        ...(filtros.m_pack ? { m_pack: filtros.m_pack } : {}),
        ...(filtros.l_pack ? { l_pack: filtros.l_pack } : {}),
        ...(filtros.cons_almacen ? { cons_almacen: filtros.cons_almacen } : { cons_almacen: almacenes.map((a) => a.consecutivo) }),
        ...(filtros.cons_producto ? { cons_producto: filtros.cons_producto } : {}),
      };
      const result = await listarSeriales(page, PAGE_SIZE, body);
      setSeriales(result?.data || result || []);
      setTotal(result?.total ?? 0);
      setPagina(page);
    } catch {
      setSeriales([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, almacenes]);

  useEffect(() => {
    if (almacenes.length) listar(1);
  }, [almacenes]);

  const handleBuscar = (e) => {
    e.preventDefault();
    listar(1);
  };

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

  const todosSeleccionados = seriales.length > 0 && seleccionados.size === seriales.length;
  const algunoSeleccionado = seleccionados.size > 0 && seleccionados.size < seriales.length;
  const serialesSeleccionados = seriales.filter((s) => seleccionados.has(s.id));

  const totalPaginas = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 fw-bold">Dar de baja seriales</h5>
        {seleccionados.size > 0 && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setModalOpen(true)}
          >
            Dar de baja {seleccionados.size} serial(es)
          </button>
        )}
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <form onSubmit={handleBuscar} className="row g-2 align-items-end">

            <div className="col-auto">
              <label htmlFor="cons_almacen" className="form-label form-label-sm mb-1">Almacen</label>
              <select
                className="form-select form-select-sm"
                id="cons_almacen"
                value={filtros.cons_almacen}
                onChange={(e) => setFiltros((f) => ({ ...f, cons_almacen: e.target.value }))}
                style={{ minWidth: "160px" }}
              >
                <option value="">Todos mis almacenes</option>
                {almacenes.map((a) => (
                  <option key={a.consecutivo} value={a.consecutivo}>
                    {a.nombre || a.consecutivo}
                  </option>
                ))}
              </select>
            </div>


            <div className="col-auto">
              <label htmlFor="cons_producto" className="form-label form-label-sm mb-1">Producto</label>
              <input
                type="text"
                id="cons_producto"
                className="form-control form-control-sm"
                placeholder="Codigo producto"
                value={filtros.cons_producto}
                onChange={(e) => setFiltros((f) => ({ ...f, cons_producto: e.target.value }))}
              />
            </div>

            <div className="col-auto">
              <label htmlFor="serial" className="form-label form-label-sm mb-1">Serial interno</label>
              <input
                type="text"
                id="serial"
                className="form-control form-control-sm"
                placeholder="Buscar serial..."
                value={filtros.serial}
                onChange={(e) => setFiltros((f) => ({ ...f, serial: e.target.value }))}
              />
            </div>

            <div className="col-auto">
              <label htmlFor="bag_pack" className="form-label form-label-sm mb-1">Serial Externo</label>
              <input
                type="text"
                id="bag_pack"
                className="form-control form-control-sm"
                placeholder="Buscar serial..."
                value={filtros.bag_pack}
                onChange={(e) => setFiltros((f) => ({ ...f, bag_pack: e.target.value }))}
              />
            </div>

            {/**Arreglando */}
            <div className="col-auto">
              <label htmlFor="s_pack" className="form-label form-label-sm mb-1">S Pack
              </label>
              <input
                type="text"
                id="s_pack"
                className="form-control form-control-sm"
                placeholder=""
                value={filtros.s_pack}
                onChange={(e) => setFiltros((f) => ({ ...f, s_pack: e.target.value }))}
              />
            </div>

            <div className="col-auto">
              <label htmlFor="m_pack" className="form-label form-label-sm mb-1">M Pack
              </label>
              <input
                type="text"
                id="m_pack"
                className="form-control form-control-sm"
                placeholder=""
                value={filtros.m_pack}
                onChange={(e) => setFiltros((f) => ({ ...f, m_pack: e.target.value }))}
              />
            </div>

            <div className="col-auto">
              <label htmlFor="l_pack" className="form-label form-label-sm mb-1">L Pack
              </label>
              <input
                type="text"
                id="l_pack"
                className="form-control form-control-sm"
                placeholder=""
                value={filtros.l_pack}
                onChange={(e) => setFiltros((f) => ({ ...f, l_pack: e.target.value }))}
              />
            </div>

            {/**Arreglando */}


            <div className="col-auto">
              <button type="submit" className="btn btn-outline-primary btn-sm">
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <Loader loading={loading} />
          {!loading && seriales.length === 0 && (
            <div className="p-4 text-center text-muted">No se encontraron seriales disponibles.</div>
          )}
          {seriales.length > 0 && (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-striped table-bordered mb-0 align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center" style={{ width: "42px" }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={todosSeleccionados}
                          ref={(el) => { if (el) el.indeterminate = algunoSeleccionado; }}
                          onChange={toggleTodos}
                        />
                      </th>
                      <th>Serial</th>
                      <th>Producto</th>
                      <th>Almacen</th>
                      <th>Bag Pack</th>
                      <th>S Pack</th>
                      <th>M Pack</th>
                      <th>L Pack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriales.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => toggleSerial(s.id)}
                        style={{ cursor: "pointer" }}
                        className={seleccionados.has(s.id) ? "table-warning" : ""}
                      >
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={seleccionados.has(s.id)}
                            onChange={() => toggleSerial(s.id)}
                          />
                        </td>
                        <td className="fw-semibold text-center">{s.serial}</td>
                        <td className="text-center">{s.producto?.name || s.cons_producto || "—"}</td>
                        <td className="text-center">{s.cons_almacen || "—"}</td>
                        <td className="text-center">{s.bag_pack || "—"}</td>
                        <td className="text-center">{s.s_pack || "—"}</td>
                        <td className="text-center">{s.m_pack || "—"}</td>
                        <td className="text-center">{s.l_pack || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex justify-content-between align-items-center py-2">
                <span className="text-muted small">
                  {seleccionados.size > 0
                    ? `${seleccionados.size} seleccionado(s) — `
                    : ""}
                  Mostrando {seriales.length} de {total}
                </span>
                {totalPaginas > 1 && (
                  <div className="d-flex gap-1 align-items-center">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={pagina <= 1}
                      onClick={() => listar(pagina - 1)}
                    >
                      &laquo;
                    </button>
                    <span className="small px-2">
                      Pag. {pagina} / {totalPaginas}
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={pagina >= totalPaginas}
                      onClick={() => listar(pagina + 1)}
                    >
                      &raquo;
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <DarDeBajaSerialModal
          seriales={serialesSeleccionados}
          onClose={() => setModalOpen(false)}
          onSuccess={() => listar(1)}
        />
      )}
    </div>
  );
}
