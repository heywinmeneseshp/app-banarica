import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap';
import { FaMinusCircle } from 'react-icons/fa';
import { filtrarProductos } from '@services/api/productos';
import { encontrarUnSerial } from '@services/api/seguridad';
import { crearProgramacionSerialesMasivo } from '@services/api/programacionSeriales';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { encontrarModulo } from '@services/api/configuracion';

const MOTIVO_PROGRAMADOR = 'Uso Transportadora';

function ProgramadorSerialesModal({
  show,
  programacion,
  seriales = [],
  onClose,
  onSaved,
}) {
  const formRef = useRef(null);
  const [articulos, setArticulos] = useState([]);
  const [semanas, setSemanas] = useState([]);
  const [semanaActual, setSemanaActual] = useState('');
  const [almacenByUser, setAlmacenByUser] = useState([]);
  const [articulo, setArticulo] = useState('');
  const [inputs, setInputs] = useState([]);
  const [errores, setErrores] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const serialesActuales = useMemo(() => (
    (seriales || []).filter((item) => String(item?.programacion_id || item?.programacionId || '') === String(programacion?.id || ''))
  ), [programacion?.id, seriales]);

  useEffect(() => {
    if (!show) {
      setArticulo('');
      setInputs([]);
      setErrores(new Set());
      return;
    }

    const cargarDatos = async () => {
      const almacenes = JSON.parse(localStorage.getItem('almacenByUser') || '[]')?.map((item) => item.consecutivo) || [];
      const body = { producto: { serial: true }, stock: { cons_almacen: almacenes, isBlock: false } };

      const [productos, weeks, currentWeek] = await Promise.all([
        filtrarProductos(body),
        filtrarSemanaRangoMes(1, 1),
        encontrarModulo('Semana'),
      ]);

      setArticulos(productos || []);
      setSemanas(weeks || []);
      setSemanaActual(currentWeek?.[0]?.semana_actual || programacion?.semana || '');
      setAlmacenByUser(almacenes);
    };

    cargarDatos().catch((error) => {
      console.error('Error cargando datos de seriales del programador:', error);
      window.alert('No fue posible cargar los datos para agregar seriales.');
    });
  }, [programacion?.semana, show]);

  const getToday = () => new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    const item = articulos.find((producto) => producto.name === articulo);
    if (!item) {
      window.alert('Selecciona un articulo valido.');
      return;
    }

    setInputs((prev) => ([
      ...prev,
      {
        id: Date.now(),
        name: item.name,
        value: '',
        cons_producto: item.consecutivo,
      },
    ]));
    setArticulo('');
  };

  const handleRemove = (id) => {
    setInputs((prev) => prev.filter((item) => item.id !== id));
    setErrores((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleInputChange = (id, value) => {
    setInputs((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!programacion?.id) {
      window.alert('No fue posible identificar la linea del programador.');
      return;
    }
    if (!inputs.length) {
      window.alert('Debe agregar al menos un articulo.');
      return;
    }

    const duplicados = inputs.reduce((map, item) => {
      const key = item.value.trim().toUpperCase();
      if (key) map.set(key, [...(map.get(key) || []), item.id]);
      return map;
    }, new Map());
    const nextErrores = new Set();
    duplicados.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => nextErrores.add(id));
    });

    if (nextErrores.size) {
      setErrores(nextErrores);
      window.alert('Existen seriales duplicados.');
      return;
    }

    try {
      setSaving(true);
      const serialesValidos = [];

      for (const input of inputs) {
        const value = input.value.trim();
        const encontrados = await encontrarUnSerial({
          bag_pack: value,
          available: true,
          cons_producto: input.cons_producto,
          cons_almacen: almacenByUser,
        });

        if (!Array.isArray(encontrados) || encontrados.length === 0) {
          nextErrores.add(input.id);
        } else {
          serialesValidos.push(value);
        }
      }

      if (nextErrores.size) {
        setErrores(nextErrores);
        window.alert('Uno o mas seriales no existen, no estan disponibles o no pertenecen al articulo seleccionado.');
        return;
      }

      const formData = new FormData(formRef.current);
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const semana = formData.get('semana') || programacion?.semana || '';
      const fecha = formData.get('fecha') || programacion?.fecha || getToday();

      const response = await crearProgramacionSerialesMasivo(serialesValidos.map((serial) => ({
        programacion_id: programacion.id,
        bag_pack: serial,
        id_contenedor: null,
        fecha_uso: fecha,
        semana,
        id_usuario: usuario?.id,
        motivo_de_uso: MOTIVO_PROGRAMADOR,
      })));
      const actualizados = response?.data || response || [];

      window.alert('Seriales agregados a la linea.');
      onSaved?.(actualizados);
      onClose?.();
    } catch (error) {
      console.error('Error agregando seriales al programador:', error);
      window.alert(error.message || 'No fue posible agregar los seriales.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onClose} centered size="lg">
      <Modal.Header closeButton={!saving}>
        <Modal.Title>Seriales de la linea</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="small text-muted mb-3">
          {programacion?.productoLabel || 'Articulo sin definir'} | {programacion?.blLabel || programacion?.bl || 'Sin BL'} | {programacion?.contenedorLabel || 'Sin contenedor'}
        </div>

        {serialesActuales.length > 0 && (
          <div className="table-responsive mb-3">
            <Table bordered size="sm" className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Articulo</th>
                  <th>Serial</th>
                  <th>Contenedor</th>
                </tr>
              </thead>
              <tbody>
                {serialesActuales.map((item) => (
                  <tr key={item.id || item.serial || item.bag_pack}>
                    <td>{item?.serial_articulo?.producto?.name || item?.producto?.name || item?.Producto?.name || item?.cons_producto || '-'}</td>
                    <td>{item?.serial_articulo?.bag_pack || item?.serial_articulo?.serial || item?.bag_pack || item?.serial || '-'}</td>
                    <td>{item?.contenedor?.contenedor || item?.serial_articulo?.contenedor?.contenedor || item?.Contenedor?.contenedor || item?.id_contenedor || 'Pendiente'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        <Form ref={formRef} onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Fecha</InputGroup.Text>
                <Form.Control name="fecha" type="date" required defaultValue={programacion?.fecha || getToday()} />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Semana</InputGroup.Text>
                <Form.Select name="semana" required defaultValue={programacion?.semana || semanaActual}>
                  <option value=""></option>
                  {semanas.map((item) => (
                    <option key={item.consecutivo} value={item.consecutivo}>
                      {item.consecutivo}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>Motivo</InputGroup.Text>
                <Form.Control value={MOTIVO_PROGRAMADOR} disabled readOnly />
              </InputGroup>
            </Col>
            <Col md={12}>
              <div className="d-flex gap-2">
                <InputGroup>
                  <InputGroup.Text>Articulo</InputGroup.Text>
                  <Form.Control
                    list="programador-articulos-seriales"
                    value={articulo}
                    onChange={(event) => setArticulo(event.target.value)}
                    placeholder="Seleccione el articulo"
                  />
                  <datalist id="programador-articulos-seriales">
                    {articulos.map((item) => (
                      <option key={item.consecutivo || item.id} value={item.name} />
                    ))}
                  </datalist>
                </InputGroup>
                <Button type="button" variant="primary" onClick={handleAdd}>
                  Agregar
                </Button>
              </div>
            </Col>

            {inputs.map((item) => (
              <Col md={12} className="d-flex align-items-center gap-2" key={item.id}>
                <InputGroup>
                  <InputGroup.Text>{item.name}</InputGroup.Text>
                  <Form.Control
                    required
                    value={item.value}
                    onChange={(event) => handleInputChange(item.id, event.target.value)}
                    className={errores.has(item.id) ? 'is-invalid' : ''}
                  />
                </InputGroup>
                <FaMinusCircle
                  size={20}
                  color="#dc3545"
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => handleRemove(item.id)}
                  title="Eliminar este articulo"
                />
              </Col>
            ))}
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline-secondary" onClick={onClose} disabled={saving}>
          Cerrar
        </Button>
        <Button type="button" variant="success" onClick={() => formRef.current?.requestSubmit()} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProgramadorSerialesModal;
