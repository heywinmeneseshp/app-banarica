import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaEnvelope, FaEnvelopeOpen, FaPaperclip } from 'react-icons/fa';
import { listarMisMensajes, marcarMensajeLeido, marcarTodosMensajesLeidos } from '@services/api/comunicados';

const fechaLocal = (valor) => (valor ? new Date(valor).toLocaleString('es-CO') : '');

// Bandeja de comunicados recibidos dentro de la app (el mismo comunicado
// tambien llega por correo).
export default function MensajesModal({ show, onClose, onCambioNoLeidos }) {
  const [mensajes, setMensajes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);

  const cargar = useCallback(async (pagina) => {
    setCargando(true);
    setError('');
    try {
      const res = await listarMisMensajes({ page: pagina });
      setMensajes(res.items || []);
      setMeta(res.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      setAbierto(null);
      cargar(page);
    }
  }, [show, page, cargar]);

  const abrir = async (mensaje) => {
    setAbierto(mensaje);
    if (!mensaje.leido) {
      try {
        await marcarMensajeLeido(mensaje.id);
        setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, leido: true } : m)));
        onCambioNoLeidos?.();
      } catch (err) {
        console.warn('No fue posible marcar el mensaje como leido:', err);
      }
    }
  };

  const marcarTodos = async () => {
    try {
      await marcarTodosMensajesLeidos();
      setMensajes((prev) => prev.map((m) => ({ ...m, leido: true })));
      onCambioNoLeidos?.();
    } catch (err) {
      setError(err?.message || 'No fue posible marcar los mensajes como leidos.');
    }
  };

  const hayNoLeidos = mensajes.some((m) => !m.leido);

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">{abierto ? 'Mensaje' : 'Mis mensajes'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="small">
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {abierto ? (
          <>
            <p className="fw-semibold mb-1">{abierto.asunto}</p>
            <p className="text-secondary mb-3">
              Recibido el {fechaLocal(abierto.recibido)}{abierto.enviado_por ? ` — enviado por ${abierto.enviado_por}` : ''}
            </p>
            <div style={{ whiteSpace: 'pre-line' }}>{abierto.mensaje}</div>
            {abierto.adjuntos?.length > 0 && (
              <div className="mt-3 text-secondary">
                <FaPaperclip /> Adjuntos enviados a su correo: {abierto.adjuntos.map((a) => a.nombre).join(', ')}
              </div>
            )}
          </>
        ) : (
          <>
            {cargando && <div className="text-center text-secondary py-3">Cargando...</div>}
            {!cargando && mensajes.length === 0 && (
              <div className="text-center text-secondary py-4">No tiene mensajes.</div>
            )}
            {!cargando && mensajes.map((m) => (
              <button
                key={m.id}
                type="button"
                className="d-flex w-100 align-items-start gap-3 text-start border-0 border-bottom bg-transparent py-2"
                onClick={() => abrir(m)}
              >
                <span className={m.leido ? 'text-secondary' : 'text-success'} style={{ paddingTop: 2 }}>
                  {m.leido ? <FaEnvelopeOpen /> : <FaEnvelope />}
                </span>
                <span className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className={`d-block text-truncate ${m.leido ? '' : 'fw-bold'}`}>{m.asunto}</span>
                  <span className="d-block text-secondary text-truncate">{m.mensaje}</span>
                </span>
                <span className="text-secondary text-nowrap" style={{ fontSize: '0.75rem' }}>{fechaLocal(m.recibido)}</span>
              </button>
            ))}
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        {abierto ? (
          <Button variant="outline-secondary" size="sm" onClick={() => setAbierto(null)}>Volver a la lista</Button>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" onClick={marcarTodos} disabled={!hayNoLeidos}>Marcar todos como leidos</Button>
            {meta.totalPages > 1 && (
              <>
                <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
                <span className="small text-secondary">{meta.page}/{meta.totalPages}</span>
                <Button variant="outline-secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}>Siguiente</Button>
              </>
            )}
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
}
