import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaFilePdf } from 'react-icons/fa';

const MANUAL_URL = '/manuales/manual-programador.pdf';

function ProgramadorAyudaModal({ show, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title className="h6 mb-0">¿Cómo funciona el Programador?</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: '0.9rem' }}>
        <p>
          El Programador es la tabla donde se registran y siguen los movimientos de transporte. Cada línea es un
          movimiento (cargue, entrega, etc.) con su fecha, origen, destino, productos, booking, vehículo, conductor,
          horas, contenedor, seriales y evidencias.
        </p>

        <h6 className="fw-bold mt-3">Crear y cargar movimientos</h6>
        <ul className="ps-3">
          <li><strong>Nuevo movimiento:</strong> crea una línea (o varias con el cargue masivo desde Excel).</li>
          <li>
            <strong>Sugerir transporte:</strong> arma un borrador desde la Programación de Corte de una semana. Ahí puede
            completar vehículo, conductor, productos, contenedor y <strong>seriales</strong> antes de enviarlo al Programador.
          </li>
          <li><strong>Descargar Excel:</strong> exporta lo que está filtrado.</li>
        </ul>

        <h6 className="fw-bold mt-3">Estados</h6>
        <p className="mb-1">
          Toda línea nueva o modificada queda <strong>Pendiente</strong>. <strong>Actualizar pendientes</strong> la
          sincroniza con el Listado y pasa a <strong>Actualizado</strong>; desde ahí solo un super administrador puede editarla.
        </p>

        <h6 className="fw-bold mt-3">Editar</h6>
        <ul className="ps-3">
          <li>Necesita el permiso de edición y presionar <strong>Permitir edición</strong>; al terminar, <strong>Guardar edición</strong>.</li>
          <li>Horas, vehículo y conductor solo se editan dentro de los días permitidos (ver el icono de información junto a los botones).</li>
          <li>
            Cada línea admite <strong>todos los productos</strong> que necesite: <strong>+</strong> agrega una fila y{' '}
            <strong>−</strong> la quita.
          </li>
          <li>Cada cambio queda registrado en el <strong>Historial</strong>.</li>
        </ul>

        <h6 className="fw-bold mt-3">Columnas</h6>
        <p className="mb-1">
          En <strong>Configurar columnas</strong> elija qué ver (hay casilla <em>Seleccionar todas</em>) y guárdelo como una
          configuración con nombre. Usted ve las suyas y las globales; las globales las administra un super administrador.
        </p>

        <h6 className="fw-bold mt-3">Seriales, evidencias y filtros</h6>
        <p className="mb-0">
          Use <strong>Agregar serial</strong> y <strong>Evidencia</strong> en cada línea. Los filtros de arriba se aplican al
          escribir y la tabla muestra 200 líneas por página.
        </p>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <a
          href={MANUAL_URL}
          download="Manual-Programador.pdf"
          className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
        >
          <FaFilePdf /> Descargar manual (PDF)
        </a>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProgramadorAyudaModal;
