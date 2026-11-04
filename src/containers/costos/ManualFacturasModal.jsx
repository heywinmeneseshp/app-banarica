import React from 'react';
import { Accordion, Button, Modal } from 'react-bootstrap';

// Manual detallado del modulo Costos logisticos > Facturas.
export default function ManualFacturasModal({ show, onClose }) {
  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Manual de Costos logísticos — Facturas</Modal.Title>
      </Modal.Header>
      <Modal.Body className="small">
        <p>
          Este módulo registra las facturas (y notas) que generan costos logísticos, con el detalle de cada ítem y a qué
          contenedor, booking, semana o mes pertenece. Esa información es la base para repartir los costos entre
          contenedores y cajas en la siguiente etapa del módulo.
        </p>

        <Accordion defaultActiveKey="orden" alwaysOpen>
          <Accordion.Item eventKey="orden">
            <Accordion.Header>1. Por dónde empezar (orden recomendado)</Accordion.Header>
            <Accordion.Body>
              <ol className="mb-0">
                <li><strong>Proveedores:</strong> cree cada proveedor con su NIT. Una factura no se puede guardar con un NIT que no exista.</li>
                <li><strong>Maestro de ítems:</strong> cree los conceptos que se facturan (ej. Movilización) con su precio de referencia y su <em>tipo de costo</em>.</li>
                <li><strong>Tipos de documento y Estados de factura:</strong> ya vienen con valores por defecto; ajústelos si los necesita.</li>
                <li><strong>TRM:</strong> cargue la TRM diaria si va a registrar ítems en dólares (USD).</li>
                <li><strong>Registro de facturas:</strong> ahora sí, registre o cargue las facturas.</li>
              </ol>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="pestanas">
            <Accordion.Header>2. Las pestañas</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li><strong>Registro de facturas:</strong> crear, editar, filtrar, cambiar de estado y eliminar facturas; cargue masivo desde Excel.</li>
                <li><strong>Proveedores:</strong> catálogo de proveedores por NIT (nombre y razón social).</li>
                <li><strong>Maestro de ítems:</strong> conceptos con código, unidad, precio de referencia y tipo de costo. Al elegir un concepto en una factura se completan solos el valor unitario y el tipo de costo.</li>
                <li><strong>Tipos de documento:</strong> Factura, Nota Débito, Nota Crédito, etc. Cada uno tiene un <em>sentido</em>: <strong>Salida</strong> (suma al gasto) o <strong>Entrada</strong> (resta, como una nota crédito).</li>
                <li><strong>Estados de factura:</strong> el flujo de revisión (ej. Pendiente por revisión, Aprobada, Pagada), cada uno con su color.</li>
                <li><strong>TRM:</strong> tasa de cambio USD → COP por fecha.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="registrar">
            <Accordion.Header>3. Registrar una factura</Accordion.Header>
            <Accordion.Body>
              <p className="mb-1"><strong>Encabezado</strong> (botón “Nueva factura”):</p>
              <ul>
                <li><strong>Fecha, Tipo, N° factura y Proveedor</strong> (se elige por NIT).</li>
                <li><strong>Total declarado:</strong> opcional. Es el total que dice el documento.</li>
                <li><strong>Total calculado:</strong> solo lectura; es la suma de los ítems en pesos.</li>
                <li><strong>TRM:</strong> aparece solo si hay ítems en USD y muestra la TRM de la fecha de la factura.</li>
              </ul>
              <p className="mb-1"><strong>Ítems</strong> (botón “Agregar ítem”; el botón de copiar duplica una fila):</p>
              <ul className="mb-0">
                <li><strong>Concepto:</strong> escriba al menos 2 letras y elija del catálogo. Debe existir en el Maestro de ítems.</li>
                <li><strong>Divisa, Cantidad y Valor unitario:</strong> el subtotal es cantidad × valor unitario.</li>
                <li><strong>Tipo de costo:</strong> indica a qué contenedores aplica el costo (ej. solo los llenados en finca).</li>
                <li><strong>Distribución:</strong> “Por cajas” (proporcional a las cajas) o “Partes iguales”.</li>
                <li>Contenedor, Booking, Semana, Mes y Año: ver la sección siguiente.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="asociacion">
            <Accordion.Header>4. ¿A qué se asocia el costo? (Contenedor → Booking → Semana → Mes → Año)</Accordion.Header>
            <Accordion.Body>
              <p>
                Cada ítem se asocia al nivel más específico que usted conozca. El sistema calcula solo el <strong>nivel de asociación</strong>
                (contenedor, booking, semana, mes o año) y lo muestra en una etiqueta de color.
              </p>
              <ul className="mb-0">
                <li><strong>Con contenedor:</strong> busque el contenedor y elíjalo; se completan solos su booking y su semana.</li>
                <li><strong>Sin contenedor:</strong> marque <strong>N/A</strong> en Contenedor; se habilita el Booking. Al elegir un booking se completa la semana.</li>
                <li><strong>Sin booking:</strong> marque <strong>N/A</strong> en Booking; se habilita la Semana (ej. S25-2026). Al elegir una semana se completan el mes y el año.</li>
                <li><strong>Sin semana:</strong> marque <strong>N/A</strong> en Semana; se habilita el Mes (ej. Julio 2026).</li>
                <li><strong>Sin mes:</strong> marque <strong>N/A</strong> en Mes; se habilita el Año y el costo queda asociado a todo el año.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="total">
            <Accordion.Header>5. Cómo se calcula el total y qué significa la advertencia</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li><strong>Total calculado</strong> = suma de (cantidad × valor unitario) de cada ítem. Los ítems en USD se multiplican por la TRM de la fecha de la factura (o la más reciente anterior).</li>
                <li>Si hay ítems en USD y no existe ninguna TRM, se muestra “Sin TRM” y se usa 1; cargue la TRM en su pestaña.</li>
                <li>Si declara un <strong>total</strong> y no coincide con el calculado, se guarda el declarado y la factura queda con el icono <strong>⚠</strong> en el listado (filtro “Con advertencia de total”).</li>
                <li>Si no declara total, se guarda el calculado.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="validaciones">
            <Accordion.Header>6. Validaciones al guardar</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li>El <strong>NIT del proveedor</strong> debe existir en la pestaña Proveedores.</li>
                <li>Todos los <strong>conceptos</strong> deben existir en el Maestro de ítems.</li>
                <li>No se permite una factura <strong>repetida</strong>: mismo proveedor, mismo número y mismo año.</li>
                <li>Al editar una factura, sus ítems se reemplazan por los que quedan en el formulario.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="listado">
            <Accordion.Header>7. Trabajar con el registro</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li><strong>Filtros:</strong> por número, proveedor, tipo, estado, advertencia de total y rango de fechas. “Limpiar” los quita todos.</li>
                <li><strong>Estado:</strong> se cambia directo desde la lista (el color viene del catálogo de Estados).</li>
                <li><strong>Ver ítems:</strong> la flecha de cada fila despliega el detalle de ítems de la factura.</li>
                <li><strong>Editar / Eliminar:</strong> botones amarillo y rojo. También puede marcar varias facturas y usar “Eliminar seleccionadas”.</li>
                <li><strong>Balance:</strong> al pie, la suma de las facturas filtradas: los documentos de sentido Entrada suman y los de Salida restan.</li>
                <li>La lista se muestra de 30 en 30; use el paginador inferior.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="masivo">
            <Accordion.Header>8. Cargue masivo</Accordion.Header>
            <Accordion.Body>
              <p className="mb-1">
                El botón “Cargue masivo” (con su propio manual en el icono ⓘ) permite subir muchas facturas desde Excel o CSV.
                Resumen:
              </p>
              <ul className="mb-0">
                <li>Cada fila es un ítem; las filas con el mismo N Factura forman una sola factura.</li>
                <li>El <strong>nivel de asociación</strong> se deduce solo (contenedor, booking, semana, mes o año según lo que esté lleno); la columna es opcional.</li>
                <li>La vista previa muestra, por factura, si el total declarado cuadra con la suma de ítems y qué ítems están incompletos o con contenedor, booking o semana que no coinciden (se guardan en blanco).</li>
                <li>No se puede importar si hay NIT o conceptos que no existen; créelos primero.</li>
                <li>Al terminar se muestra cuántas facturas entraron y los errores (por ejemplo, facturas repetidas).</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="acceso">
            <Accordion.Header>9. Acceso y qué sigue</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li>El módulo está en el menú <strong>Costos logísticos → Facturas</strong>. El Super administrador lo ve siempre; a otros usuarios se les asigna el menú <code>costos</code> y el submenú <code>Facturas</code> al editar el usuario.</li>
                <li>El <strong>tipo de costo</strong> y el <strong>método de distribución</strong> de cada ítem se usarán en la siguiente etapa (motor de distribución y matriz de costos) para repartir cada factura entre contenedores y cajas.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
}
