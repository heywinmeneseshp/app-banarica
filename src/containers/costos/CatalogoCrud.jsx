import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import Paginacion from '@components/shared/Tablas/Paginacion';
import useAlert from '@hooks/useAlert';
import Alertas from '@components/shared/Alertas';
import { costosEnviar, costosGet } from './costosApi';
import CargaMasivaCostos from './CargaMasivaCostos';

const LIMITE = 30;
const COLORES = ['#6c757d', '#fd7e14', '#0dcaf0', '#198754', '#6f42c1', '#dc3545', '#20c997', '#0d6efd', '#d63384', '#ffc107'];

const BOTON_CUADRADO = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 25, width: 25, margin: 'auto' };

// CRUD de un catalogo de Costos logisticos con el mismo aspecto que las tablas de Maestros:
// buscador, boton Nuevo, tabla con editar/eliminar, paginacion y formulario en ventana.
//  columnas: [{ etiqueta, campo, render?(fila) }]
//  campos:   [{ clave, etiqueta, tipo: 'text'|'number'|'select'|'color', requerido, soloAlCrear, opciones, ayuda }]
//  eliminar(fila) => { ruta, cuerpo? }   (el metodo siempre es DELETE)
//  filtrosExtra: [{ clave, etiqueta, opciones: [{ valor, etiqueta }], aplicar(fila, valor) }]
export default function CatalogoCrud({
  titulo, singular, endpoint, claveFila = 'id', columnas, campos, vacio, eliminar, masivo, filtrarTexto,
  filtrosExtra = [], renderAviso, antesDeGuardar, onCambio, anchoModal,
}) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({});
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null); // null | { ...fila }
  const [esNuevo, setEsNuevo] = useState(false);
  const [error, setError] = useState('');
  const { alert, setAlert, toogleAlert } = useAlert();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await costosGet(endpoint);
      setFilas(Array.isArray(data) ? data : []);
    } catch (e) {
      setAlert({ active: true, mensaje: e.message, color: 'danger', autoClose: true });
    }
    setCargando(false);
  }, [endpoint, setAlert]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return filas.filter((fila) => {
      if (t && !filtrarTexto(fila).some((v) => String(v ?? '').toLowerCase().includes(t))) return false;
      return filtrosExtra.every((f) => !filtros[f.clave] || f.aplicar(fila, filtros[f.clave]));
    });
  }, [filas, texto, filtros, filtrarTexto, filtrosExtra]);

  useEffect(() => { setPagina(1); }, [texto, filtros]);

  const pagina_ = visibles.slice((pagina - 1) * LIMITE, pagina * LIMITE);

  const nuevo = () => { setEsNuevo(true); setError(''); setEditando({ ...vacio }); };
  const editar = (fila) => {
    setEsNuevo(false);
    setError('');
    const copia = {};
    campos.forEach((c) => { copia[c.clave] = fila[c.clave] ?? ''; });
    setEditando({ ...fila, ...copia });
  };

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const cuerpo = { ...editando };
    if (antesDeGuardar) {
      const problema = antesDeGuardar(cuerpo, esNuevo);
      if (problema) { setError(problema); return; }
    }
    const r = await costosEnviar('POST', endpoint, cuerpo);
    if (!r.ok) { setError(r.error || 'No fue posible guardar'); return; }
    setEditando(null);
    setAlert({ active: true, mensaje: `El ${singular} se guardo correctamente`, color: 'success', autoClose: true });
    await cargar();
    onCambio?.();
  }

  async function borrar(fila) {
    if (!window.confirm(`¿Eliminar este ${singular}?`)) return;
    const { ruta, cuerpo } = eliminar(fila);
    const r = await costosEnviar('DELETE', ruta, cuerpo);
    if (!r.ok) { setAlert({ active: true, mensaje: r.error || 'No fue posible eliminar', color: 'danger', autoClose: true }); return; }
    await cargar();
    onCambio?.();
  }

  return (
    <div className="container-fluid">
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">{titulo}</h2>
          <div className="line mt-2" />
        </div>
        <Badge bg="secondary" pill className="fs-6">{visibles.length} de {filas.length}</Badge>
      </div>

      {renderAviso?.({ filas, filtros, setFiltros })}

      <Row className="g-2 align-items-center mb-3">
        <Col xs={12} md="auto">
          <Button variant="success" size="sm" className="px-3 text-nowrap w-100" type="button" onClick={nuevo}>
            <FaPlus className="me-1" /> Nuevo
          </Button>
        </Col>
        <Col xs={12} md>
          <div className="d-flex border rounded bg-white">
            <input
              type="text"
              className="form-control form-control-sm border-0 shadow-none"
              placeholder="Buscar..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <span className="px-3 d-flex align-items-center"><FaSearch className="text-muted" size={14} /></span>
          </div>
        </Col>
        {filtrosExtra.map((f) => (
          <Col xs={12} md="auto" key={f.clave}>
            <Form.Select size="sm" value={filtros[f.clave] || ''} onChange={(e) => setFiltros((p) => ({ ...p, [f.clave]: e.target.value }))} aria-label={f.etiqueta}>
              <option value="">{f.etiqueta}</option>
              {f.opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </Form.Select>
          </Col>
        ))}
        {masivo && (
          <Col xs={12} md="auto">
            <CargaMasivaCostos apiUrl={masivo.apiUrl} templateName={masivo.templateName} columns={masivo.columns} notas={masivo.notas} onDone={() => { cargar(); onCambio?.(); }} />
          </Col>
        )}
      </Row>

      <div className="table-responsive">
        <table className="table table-bordered table-sm table-hover">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.etiqueta} className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{c.etiqueta}</th>
              ))}
              <th className="text-custom-small text-center align-middle" style={{ padding: 2, width: 40 }}>Editar</th>
              <th className="text-custom-small text-center align-middle" style={{ padding: 2, width: 40 }}>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={columnas.length + 2} className="text-center py-4">
                <div className="spinner-border spinner-border-sm" role="status" /><span className="ms-2">Cargando...</span>
              </td></tr>
            )}
            {!cargando && pagina_.length === 0 && (
              <tr><td colSpan={columnas.length + 2} className="text-center py-4 text-muted">
                {filas.length === 0 ? `Aun no hay ${titulo.toLowerCase()} registrados` : 'No se encontraron resultados'}
              </td></tr>
            )}
            {!cargando && pagina_.map((fila) => (
              <tr key={fila[claveFila]}>
                {columnas.map((c) => (
                  <td key={c.etiqueta} className="text-custom-small text-center align-middle" style={{ padding: 2 }}>
                    {c.render ? c.render(fila) : (fila[c.campo] ?? '—')}
                  </td>
                ))}
                <td className="align-middle" style={{ padding: 2 }}>
                  <button type="button" className="btn btn-warning btn-sm" style={BOTON_CUADRADO} title="Editar" onClick={() => editar(fila)}><FaEdit /></button>
                </td>
                <td className="align-middle" style={{ padding: 2 }}>
                  <button type="button" className="btn btn-danger btn-sm" style={BOTON_CUADRADO} title="Eliminar" onClick={() => borrar(fila)}><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacion setPagination={setPagina} pagination={pagina} total={visibles.length} limit={LIMITE} />

      <Modal show={Boolean(editando)} onHide={() => setEditando(null)} centered size={anchoModal}>
        {editando && (
          <Form onSubmit={guardar}>
            <Modal.Header closeButton>
              <Modal.Title className="h6 mb-0">{esNuevo ? `Nuevo ${singular}` : `Editar ${singular}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
              <Row className="g-3">
                {campos.map((c) => (
                  <Col xs={12} md={c.ancho || 6} key={c.clave}>
                    <Form.Group>
                      <Form.Label className="small mb-1">{c.etiqueta}{c.requerido && <span className="text-danger"> *</span>}</Form.Label>
                      {c.tipo === 'select' ? (
                        <Form.Select size="sm" required={c.requerido} value={editando[c.clave] ?? ''} onChange={(e) => setEditando((p) => ({ ...p, [c.clave]: e.target.value }))}>
                          {c.sinOpcion && <option value="">{c.sinOpcion}</option>}
                          {(c.opciones || []).map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                        </Form.Select>
                      ) : c.tipo === 'color' ? (
                        <div className="d-flex flex-wrap align-items-center gap-1">
                          {COLORES.map((col) => (
                            <button
                              key={col}
                              type="button"
                              aria-label={`Color ${col}`}
                              onClick={() => setEditando((p) => ({ ...p, [c.clave]: col }))}
                              style={{ width: 24, height: 24, background: col, borderRadius: 4, padding: 0, border: editando[c.clave] === col ? '2px solid #000' : '1px solid #ced4da' }}
                            />
                          ))}
                          <Form.Control type="color" size="sm" style={{ width: 34, height: 28, padding: 2 }} value={editando[c.clave] || '#6c757d'} onChange={(e) => setEditando((p) => ({ ...p, [c.clave]: e.target.value }))} />
                          <span className="badge ms-2" style={{ background: editando[c.clave] || '#6c757d' }}>{editando.nombre || 'Vista previa'}</span>
                        </div>
                      ) : (
                        <Form.Control
                          size="sm"
                          type={c.tipo || 'text'}
                          step={c.tipo === 'number' ? 'any' : undefined}
                          required={c.requerido}
                          disabled={c.soloAlCrear && !esNuevo}
                          placeholder={c.placeholder}
                          value={editando[c.clave] ?? ''}
                          onChange={(e) => setEditando((p) => ({ ...p, [c.clave]: e.target.value }))}
                        />
                      )}
                      {c.ayuda && <Form.Text className="text-muted">{c.ayuda}</Form.Text>}
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button variant="primary" size="sm" type="submit">Guardar</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
}
