import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import {
  FaAt, FaCheckCircle, FaClock, FaEye, FaFileAlt, FaPaperclip, FaPaperPlane, FaSearch, FaTimesCircle, FaUser, FaUsers,
} from 'react-icons/fa';
import {
  buscarComunicado, enviarComunicado, listarComunicados, listarDestinatarios,
} from '@services/api/comunicados';

const MAX_ADJUNTOS = 5;
const MAX_ADJUNTO_MB = 8;
const MAX_MENSAJE = 5000;

const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Selector simple: lista de opciones aun no elegidas + etiquetas con "x".
function SelectorMultiple({ opciones, seleccionados, onChange, placeholder }) {
  const disponibles = opciones.filter((o) => !seleccionados.some((s) => s.valor === o.valor));
  return (
    <>
      <Form.Select
        size="sm"
        value=""
        onChange={(e) => {
          const elegido = opciones.find((o) => o.valor === e.target.value);
          if (elegido) onChange([...seleccionados, elegido]);
        }}
      >
        <option value="">{placeholder}</option>
        {disponibles.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
      </Form.Select>
      {seleccionados.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {seleccionados.map((s) => (
            <span key={s.valor} className="badge rounded-pill bg-white text-secondary border d-inline-flex align-items-center gap-2 py-1 px-2">
              {s.etiqueta}
              <button
                type="button"
                className="btn-close"
                style={{ fontSize: '0.55rem' }}
                aria-label="Quitar"
                onClick={() => onChange(seleccionados.filter((x) => x.valor !== s.valor))}
              />
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export default function Comunicados() {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [rolesSel, setRolesSel] = useState([]);
  const [usuariosSel, setUsuariosSel] = useState([]);
  const [correoInput, setCorreoInput] = useState('');
  const [correos, setCorreos] = useState([]);
  const [correoError, setCorreoError] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);
  const [adjuntoError, setAdjuntoError] = useState('');
  const fileInputRef = useRef(null);

  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState('');
  const [resultado, setResultado] = useState(null);

  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [historialError, setHistorialError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });

  const [detalle, setDetalle] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const cargarHistorial = useCallback(async (pagina, texto) => {
    setCargandoHistorial(true);
    setHistorialError('');
    try {
      const res = await listarComunicados({ page: pagina, search: texto });
      setHistorial(res.items || []);
      setMeta(res.meta || { page: 1, total: 0, totalPages: 1 });
    } catch (error) {
      setHistorialError(error.message);
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await listarDestinatarios();
        setRolesDisponibles((res.roles || []).map((r) => ({ valor: r, etiqueta: r })));
        setUsuariosDisponibles((res.usuarios || []).map((u) => ({ valor: u.username, etiqueta: `${u.nombre} (${u.username})` })));
      } catch (error) {
        setFormError(error.message);
      }
    })();
  }, []);

  useEffect(() => {
    cargarHistorial(page, busqueda.trim());
    // la busqueda se aplica solo con Enter / boton (ver buscar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, cargarHistorial]);

  const buscar = () => {
    if (page === 1) cargarHistorial(1, busqueda.trim());
    else setPage(1);
  };

  const agregarCorreo = () => {
    const valor = correoInput.trim().toLowerCase();
    if (!valor) return;
    if (!emailValido(valor)) {
      setCorreoError(`"${valor}" no parece un correo valido.`);
      return;
    }
    if (!correos.includes(valor)) setCorreos((c) => [...c, valor]);
    setCorreoInput('');
    setCorreoError('');
  };

  const agregarArchivos = (lista) => {
    setAdjuntoError('');
    const nuevos = Array.from(lista || []);
    if (nuevos.length === 0) return;
    const combinados = [...adjuntos];
    for (const f of nuevos) {
      if (combinados.some((a) => a.name === f.name && a.size === f.size)) continue;
      if (f.size > MAX_ADJUNTO_MB * 1024 * 1024) {
        setAdjuntoError(`"${f.name}" pesa mas de ${MAX_ADJUNTO_MB} MB: no se agrego.`);
        continue;
      }
      combinados.push(f);
    }
    if (combinados.length > MAX_ADJUNTOS) {
      setAdjuntoError(`Maximo ${MAX_ADJUNTOS} adjuntos por comunicado.`);
      combinados.length = MAX_ADJUNTOS;
    }
    setAdjuntos(combinados);
  };

  const totalSeleccionados = rolesSel.length + usuariosSel.length + correos.length;
  const listo = asunto.trim() && mensaje.trim() && totalSeleccionados > 0;

  const handleEnviar = async (event) => {
    event.preventDefault();
    setFormError('');
    setResultado(null);
    if (totalSeleccionados === 0) {
      setFormError('Seleccione al menos un rol, usuario o correo manual.');
      return;
    }
    if (!window.confirm(`¿Enviar el comunicado a ${totalSeleccionados} destinatario(s) seleccionado(s)? Un rol se expande a todos sus usuarios activos.`)) return;

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('asunto', asunto);
      formData.append('mensaje', mensaje);
      formData.append('correos', JSON.stringify(correos));
      formData.append('roles', JSON.stringify(rolesSel.map((r) => r.valor)));
      formData.append('usuarios', JSON.stringify(usuariosSel.map((u) => u.valor)));
      adjuntos.forEach((archivo) => formData.append('adjuntos', archivo));

      const enviado = await enviarComunicado(formData);
      setResultado(enviado);
      setAsunto('');
      setMensaje('');
      setRolesSel([]);
      setUsuariosSel([]);
      setCorreos([]);
      setAdjuntos([]);
      setPage(1);
      cargarHistorial(1, busqueda.trim());
    } catch (error) {
      setFormError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const abrirDetalle = async (comunicado) => {
    setDetalle(null);
    setDetalleAbierto(true);
    try {
      setDetalle(await buscarComunicado(comunicado.id));
    } catch (error) {
      setHistorialError(error.message);
      setDetalleAbierto(false);
    }
  };

  const fechaLocal = (valor) => (valor ? new Date(valor).toLocaleString('es-CO') : '');

  return (
    <div className="container-fluid p-3" style={{ maxWidth: 1200 }}>
      <h4 className="mb-1">Comunicados</h4>
      <p className="text-secondary">
        Envie un correo a roles completos, usuarios puntuales o direcciones sueltas, con adjuntos si hace falta.
      </p>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm p-3">
            <Form onSubmit={handleEnviar}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-medium">Asunto <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  maxLength={200}
                  required
                  placeholder="Ej. Mantenimiento programado del sistema"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between">
                  <Form.Label className="small fw-medium">Mensaje <span className="text-danger">*</span></Form.Label>
                  <span className="small text-secondary">{mensaje.length}/{MAX_MENSAJE}</span>
                </div>
                <Form.Control
                  as="textarea"
                  rows={7}
                  maxLength={MAX_MENSAJE}
                  required
                  placeholder="Escriba el mensaje que recibira cada destinatario..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                />
              </Form.Group>

              <p className="fw-semibold small text-secondary text-uppercase mb-2">Destinatarios</p>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <div className="rounded p-3 h-100 bg-light">
                    <div className="small fw-medium mb-2 d-flex align-items-center gap-2"><FaUsers /> Roles
                      {rolesSel.length > 0 && <span className="badge bg-success rounded-pill">{rolesSel.length}</span>}
                    </div>
                    <SelectorMultiple opciones={rolesDisponibles} seleccionados={rolesSel} onChange={setRolesSel} placeholder="Seleccione un rol..." />
                    <div className="form-text">Le llega a todos los usuarios activos de ese rol.</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="rounded p-3 h-100 bg-light">
                    <div className="small fw-medium mb-2 d-flex align-items-center gap-2"><FaUser /> Usuarios puntuales
                      {usuariosSel.length > 0 && <span className="badge bg-success rounded-pill">{usuariosSel.length}</span>}
                    </div>
                    <SelectorMultiple opciones={usuariosDisponibles} seleccionados={usuariosSel} onChange={setUsuariosSel} placeholder="Seleccione un usuario..." />
                    <div className="form-text">Personas especificas, sin importar su rol.</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="rounded p-3 bg-light">
                    <div className="small fw-medium mb-2 d-flex align-items-center gap-2"><FaAt /> Correos manuales
                      {correos.length > 0 && <span className="badge bg-success rounded-pill">{correos.length}</span>}
                    </div>
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control
                        size="sm"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={correoInput}
                        onChange={(e) => { setCorreoInput(e.target.value); setCorreoError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCorreo(); } }}
                      />
                      <Button type="button" size="sm" variant="outline-secondary" onClick={agregarCorreo}>Agregar</Button>
                    </div>
                    {correoError && <div className="text-danger small mb-2">{correoError}</div>}
                    <div className="d-flex flex-wrap gap-2">
                      {correos.map((c) => (
                        <span key={c} className="badge rounded-pill bg-white text-secondary border d-inline-flex align-items-center gap-2 py-1 px-2">
                          {c}
                          <button type="button" className="btn-close" style={{ fontSize: '0.55rem' }} aria-label="Quitar" onClick={() => setCorreos((x) => x.filter((y) => y !== c))} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="fw-semibold small text-secondary text-uppercase mb-2">Adjuntos (opcional)</p>
              <div
                className="rounded p-3 text-center mb-2"
                style={{ border: '2px dashed #d1d5db', backgroundColor: '#fafafa', cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); agregarArchivos(e.dataTransfer.files); }}
              >
                <div className="small">Arrastre archivos aqui o <span className="text-success fw-medium">haga clic para elegirlos</span></div>
                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  Maximo {MAX_ADJUNTOS} archivos de {MAX_ADJUNTO_MB} MB cada uno
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ''; }}
                />
              </div>
              {adjuntoError && <div className="text-danger small mb-2">{adjuntoError}</div>}
              {adjuntos.map((f, idx) => (
                <div key={`${f.name}-${f.size}`} className="d-flex align-items-center justify-content-between rounded px-3 py-2 small bg-light mb-1">
                  <span className="d-flex align-items-center gap-2 text-truncate">
                    <FaFileAlt className="flex-shrink-0 text-success" />
                    <span className="text-truncate">{f.name}</span>
                    <span className="text-secondary flex-shrink-0">({formatBytes(f.size)})</span>
                  </span>
                  <button type="button" className="btn-close flex-shrink-0" style={{ fontSize: '0.6rem' }} aria-label="Quitar adjunto" onClick={() => setAdjuntos((a) => a.filter((_, i) => i !== idx))} />
                </div>
              ))}

              {resultado && (
                <div className="alert alert-success py-2 small mt-3 mb-0">
                  Comunicado enviado: <strong>{resultado.enviados_ok}</strong> de <strong>{resultado.total_destinatarios}</strong> correo(s) entregados
                  {resultado.enviados_error > 0 && <> — <strong className="text-danger">{resultado.enviados_error}</strong> con error.</>}
                </div>
              )}
              {formError && <div className="alert alert-danger py-2 small mt-3 mb-0">{formError}</div>}

              <div className="d-flex justify-content-end mt-3">
                <Button type="submit" variant="success" size="sm" disabled={enviando || !listo} className="d-inline-flex align-items-center gap-2 px-4">
                  <FaPaperPlane /> {enviando ? 'Enviando...' : 'Enviar comunicado'}
                </Button>
              </div>
            </Form>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm p-3" style={{ position: 'sticky', top: '1rem' }}>
            <p className="fw-semibold small text-secondary text-uppercase mb-2">Resumen del envio</p>
            <div className="text-center rounded py-3 mb-3 bg-light">
              <div className="fw-bold" style={{ fontSize: '2rem', color: '#166534' }}>{totalSeleccionados}</div>
              <div className="small text-secondary">elemento(s) seleccionados</div>
            </div>
            <ul className="list-unstyled small mb-3">
              <li className="d-flex justify-content-between"><span><FaUsers className="me-2" />Roles</span><strong>{rolesSel.length}</strong></li>
              <li className="d-flex justify-content-between"><span><FaUser className="me-2" />Usuarios puntuales</span><strong>{usuariosSel.length}</strong></li>
              <li className="d-flex justify-content-between"><span><FaAt className="me-2" />Correos manuales</span><strong>{correos.length}</strong></li>
              <li className="d-flex justify-content-between"><span><FaPaperclip className="me-2" />Adjuntos</span><strong>{adjuntos.length}</strong></li>
            </ul>
            <p className="small text-secondary mb-0">
              Un rol se expande a todos sus usuarios activos al enviar. Si alguien aparece por mas de un lado (rol, usuario o
              correo suelto), recibe un solo correo.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2"><FaClock className="text-secondary" /> Historial</h6>
        <div className="d-flex gap-2" style={{ maxWidth: 300, width: '100%' }}>
          <Form.Control
            size="sm"
            placeholder="Buscar por asunto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
          />
          <Button type="button" size="sm" variant="outline-secondary" onClick={buscar}><FaSearch /></Button>
        </div>
      </div>
      {historialError && <div className="alert alert-danger py-2 small">{historialError}</div>}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr className="table-light small text-secondary">
                <th>Fecha</th><th>Asunto</th><th>Enviado por</th><th>Estado</th><th className="text-end">Ver</th>
              </tr>
            </thead>
            <tbody>
              {cargandoHistorial && <tr><td colSpan={5} className="text-center text-secondary py-3 small">Cargando...</td></tr>}
              {!cargandoHistorial && historial.length === 0 && (
                <tr><td colSpan={5} className="text-center text-secondary py-3 small">Todavia no se ha enviado ningun comunicado.</td></tr>
              )}
              {!cargandoHistorial && historial.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => abrirDetalle(c)}>
                  <td className="small text-secondary text-nowrap">{fechaLocal(c.createdAt)}</td>
                  <td className="small fw-medium">
                    {c.asunto}
                    {c.adjuntos?.length > 0 && (
                      <span className="text-secondary ms-2" title={c.adjuntos.map((a) => a.nombre).join(', ')}>
                        <FaPaperclip size={11} /> {c.adjuntos.length}
                      </span>
                    )}
                  </td>
                  <td className="small text-secondary">{c.created_by || '—'}</td>
                  <td className="small">
                    {c.enviados_error > 0
                      ? <span className="badge rounded-pill bg-danger-subtle text-danger">{c.enviados_ok}/{c.total_destinatarios} — {c.enviados_error} con error</span>
                      : <span className="badge rounded-pill bg-success-subtle text-success">{c.enviados_ok}/{c.total_destinatarios} entregados</span>}
                  </td>
                  <td className="text-end"><FaEye className="text-secondary" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
        <span className="small text-secondary">Pagina {meta.page} de {meta.totalPages} ({meta.total} comunicado(s))</span>
        {meta.totalPages > 1 && (
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <Button size="sm" variant="outline-secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}>Siguiente</Button>
          </div>
        )}
      </div>

      <Modal show={detalleAbierto} onHide={() => setDetalleAbierto(false)} centered size="lg" scrollable>
        <Modal.Header closeButton><Modal.Title className="h6 mb-0">Detalle del comunicado</Modal.Title></Modal.Header>
        <Modal.Body className="small">
          {!detalle ? <div className="text-center text-secondary py-3">Cargando...</div> : (
            <>
              <p className="fw-semibold mb-1">{detalle.asunto}</p>
              <p className="text-secondary" style={{ whiteSpace: 'pre-line' }}>{detalle.mensaje}</p>
              <p className="text-secondary">Enviado por <strong>{detalle.created_by || '—'}</strong> el {fechaLocal(detalle.createdAt)}</p>
              {detalle.destinatarios_resumen?.roles?.length > 0 && <div><strong>Roles:</strong> {detalle.destinatarios_resumen.roles.join(', ')}</div>}
              {detalle.destinatarios_resumen?.usuarios?.length > 0 && <div><strong>Usuarios:</strong> {detalle.destinatarios_resumen.usuarios.map((u) => u.nombre || u.username).join(', ')}</div>}
              {detalle.destinatarios_resumen?.correos?.length > 0 && <div><strong>Correos manuales:</strong> {detalle.destinatarios_resumen.correos.join(', ')}</div>}
              {detalle.adjuntos?.length > 0 && (
                <div className="mt-2">
                  <strong><FaPaperclip /> Adjuntos</strong>
                  <ul className="mb-0">{detalle.adjuntos.map((a) => <li key={a.nombre}>{a.nombre} <span className="text-secondary">({formatBytes(a.tamanioBytes)})</span></li>)}</ul>
                </div>
              )}
              <p className="fw-medium mt-3 mb-2">Resultado ({detalle.enviados_ok} de {detalle.total_destinatarios} entregados)</p>
              <table className="table table-sm mb-0">
                <thead><tr className="text-secondary"><th>Correo</th><th>Estado</th></tr></thead>
                <tbody>
                  {(detalle.resultados || []).map((r) => (
                    <tr key={r.email}>
                      <td>{r.nombre ? `${r.nombre} — ` : ''}{r.email}</td>
                      <td>
                        {r.ok
                          ? <span className="text-success"><FaCheckCircle /> Enviado</span>
                          : <span className="text-danger" title={r.error}><FaTimesCircle /> Error{r.error ? `: ${r.error}` : ''}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" size="sm" onClick={() => setDetalleAbierto(false)}>Cerrar</Button></Modal.Footer>
      </Modal>
    </div>
  );
}
