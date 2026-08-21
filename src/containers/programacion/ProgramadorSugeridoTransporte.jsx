import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaCog, FaCopy, FaMinus, FaPaperPlane, FaPlus, FaTrash } from 'react-icons/fa';
import { listarProgramacionCorte } from '@services/api/programacionCorte';
import { listarSemanas } from '@services/api/semanas';
import { encontrarModulo, actualizarModulo } from '@services/api/configuracion';
import { agregarRutas, buscarRutaPost } from '@services/api/rutas';
import { agregarProgramaciones } from '@services/api/programaciones';
import { agregarProductosViaje } from '@services/api/productos_viaje';

const MODULO_MOVIMIENTOS = 'ProgramadorMovimientosProceso';

// Mismos procesos de empaque disponibles en Programacion de Corte
// (ProgramacionCorte.jsx PROCESOS_OPCIONES). Se listan todos aca, no solo
// los que ya tengan almacen configurado, para poder mapear el movimiento de
// cualquiera de ellos.
const PROCESOS_OPCIONES = ['Finca', 'Local', 'Puerto', 'Contenedor Local'];

// Mismo contenedor demo que ya usa el Programador (ProgramadorTable.jsx) para
// marcar filas de prueba/relleno — se precarga cuando el movimiento requiere
// contenedor, y queda editable para poner el contenedor real.
const DEMO_CONTENEDOR = 'DEMO0000000';

// Mismo estilo compacto de celda que usa la tabla del Programador
// (programadorUtils.compactCellStyle), para que el borrador se vea igual.
const CELL_STYLE = {
  whiteSpace: 'nowrap',
  padding: '0.15rem 0.25rem',
  fontSize: '0.75rem',
  verticalAlign: 'middle',
};

// Los <Form.Control>/<Form.Select> size="sm" de bootstrap ya son compactos,
// pero su padding vertical por defecto sigue siendo alto para esta tabla
// densa — se reduce mas via className en cada input.
const COMPACT_INPUT_CLASS = 'py-0';

const normalizarComparacion = (valor) => String(valor || '').trim().toLowerCase();

// Sugerido de transporte: arma un borrador de movimientos de Programador a
// partir de lo que ya se cargo en Programacion de Corte, para que el
// programador de transporte no tenga que crear cada linea desde cero. La
// finca de cada linea sale de la relacion proceso de empaque -> almacen que
// ya se configura en Programacion de Corte; el movimiento (Cargue, Entrega,
// etc.) sale de una relacion propia de este modulo (proceso de empaque ->
// movimiento), porque es un concepto de transporte, no de empaque.
export default function ProgramadorSugeridoTransporte({ ubicaciones, vehiculos, combos, tiposMovimiento, transportadoras, isSuperAdmin, setAlert, onEnviado }) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [draftMovimientos, setDraftMovimientos] = useState([]);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  const [showSemanaModal, setShowSemanaModal] = useState(false);
  const [semanas, setSemanas] = useState([]);
  const [semanaSugerido, setSemanaSugerido] = useState('');
  const [fechaSugerido, setFechaSugerido] = useState('');
  const [generandoSugerido, setGenerandoSugerido] = useState(false);

  const [showSugeridoModal, setShowSugeridoModal] = useState(false);
  const [sugeridoBorrador, setSugeridoBorrador] = useState([]);
  const [enviandoFilaId, setEnviandoFilaId] = useState(null);

  const abrirConfig = async () => {
    setShowConfigModal(true);
    try {
      const configRes = await encontrarModulo(MODULO_MOVIMIENTOS, { syncWeeks: false }).catch(() => []);
      let relaciones = [];
      try {
        const detalles = typeof configRes?.[0]?.detalles === 'string'
          ? JSON.parse(configRes[0].detalles)
          : (configRes?.[0]?.detalles || {});
        relaciones = Array.isArray(detalles.procesos_movimientos) ? detalles.procesos_movimientos : [];
      } catch {
        relaciones = [];
      }
      setDraftMovimientos(relaciones.filter((r) => r && r.proceso && r.movimiento));
    } catch (error) {
      console.error('Error al cargar configuracion de movimientos:', error);
      setAlert({ active: true, mensaje: 'No fue posible cargar la configuracion.', color: 'danger', autoClose: true });
    }
  };

  const guardarConfig = async () => {
    const limpios = draftMovimientos.filter((r) => r?.proceso && r?.movimiento);
    const unicos = [];
    const vistos = new Set();
    for (const r of limpios) {
      const clave = String(r.proceso).trim().toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      unicos.push({ proceso: String(r.proceso).trim(), movimiento: String(r.movimiento).trim() });
    }

    setGuardandoConfig(true);
    try {
      await actualizarModulo({
        modulo: MODULO_MOVIMIENTOS,
        detalles: JSON.stringify({ procesos_movimientos: unicos }),
      });
      setDraftMovimientos(unicos);
      setShowConfigModal(false);
    } catch (error) {
      console.error('Error al guardar configuracion de movimientos:', error);
      setAlert({ active: true, mensaje: 'No fue posible guardar la configuracion.', color: 'danger', autoClose: true });
    } finally {
      setGuardandoConfig(false);
    }
  };

  const abrirSelectorSemana = async () => {
    setShowSemanaModal(true);
    try {
      const res = await listarSemanas();
      const ordenadas = [...(res || [])].sort((a, b) => String(b?.consecutivo || '').localeCompare(String(a?.consecutivo || '')));
      setSemanas(ordenadas);

      if (!semanaSugerido) {
        let semanaActual = ordenadas[0]?.consecutivo || '';
        try {
          const moduloSemana = await encontrarModulo('Semana', { syncWeeks: false });
          const consecutivoActual = `S${String(moduloSemana?.[0]?.semana_actual ?? '').padStart(2, '0')}-${moduloSemana?.[0]?.anho_actual ?? ''}`;
          const existeActual = ordenadas.some(
            (s) => String(s?.consecutivo || '').toLowerCase() === consecutivoActual.toLowerCase()
          );
          if (existeActual) semanaActual = consecutivoActual;
        } catch (error) {
          console.warn('No fue posible obtener la semana actual; se usara la mas reciente.', error);
        }
        if (semanaActual) setSemanaSugerido(semanaActual);
      }
    } catch (error) {
      console.error('Error al cargar semanas:', error);
    }
  };

  const generarSugerido = async () => {
    if (!semanaSugerido) {
      window.alert('Elija una semana.');
      return;
    }
    setGenerandoSugerido(true);
    try {
      const [filasCorte, configAlmacenRes, configMovimientoRes] = await Promise.all([
        listarProgramacionCorte(),
        encontrarModulo('ProgramacionCorte', { syncWeeks: false }).catch(() => []),
        encontrarModulo(MODULO_MOVIMIENTOS, { syncWeeks: false }).catch(() => []),
      ]);

      // Si el usuario no es Super Admin, solo se le sugieren las lineas de su(s)
      // propia(s) transportadora(s) asignada(s) — comparando el texto de la
      // columna "Transportadora" de Programacion de Corte contra la razon
      // social de las transportadoras que ese usuario tiene permitidas.
      const transportadorasPermitidas = new Set((transportadoras || []).map((t) => normalizarComparacion(t.razon_social)));

      const filasSemana = (Array.isArray(filasCorte) ? filasCorte : []).filter((fila) => {
        const semanaCoincide = String(fila?.Embarque?.semana?.consecutivo || '').toLowerCase() === semanaSugerido.toLowerCase();
        if (!semanaCoincide) return false;
        if (fechaSugerido && String(fila?.fecha || '').trim().slice(0, 10) !== fechaSugerido) return false;
        if (!isSuperAdmin && !transportadorasPermitidas.has(normalizarComparacion(fila?.transportadora))) return false;
        return true;
      });
      if (filasSemana.length === 0) {
        window.alert(fechaSugerido
          ? 'No hay programacion de corte cargada para esa semana y fecha (con su transportadora, si aplica).'
          : 'No hay programacion de corte cargada para esa semana (con su transportadora, si aplica).');
        return;
      }

      let procesosAlmacen = [];
      try {
        const detalles = typeof configAlmacenRes?.[0]?.detalles === 'string'
          ? JSON.parse(configAlmacenRes[0].detalles)
          : (configAlmacenRes?.[0]?.detalles || {});
        procesosAlmacen = Array.isArray(detalles.procesos_almacenes) ? detalles.procesos_almacenes : [];
      } catch {
        procesosAlmacen = [];
      }
      let procesosMovimiento = [];
      try {
        const detalles = typeof configMovimientoRes?.[0]?.detalles === 'string'
          ? JSON.parse(configMovimientoRes[0].detalles)
          : (configMovimientoRes?.[0]?.detalles || {});
        procesosMovimiento = Array.isArray(detalles.procesos_movimientos) ? detalles.procesos_movimientos : [];
      } catch {
        procesosMovimiento = [];
      }

      const procesoAAlmacen = new Map(
        procesosAlmacen.filter((p) => p?.proceso && p?.almacen).map((p) => [normalizarComparacion(p.proceso), String(p.almacen).trim()])
      );
      const procesoAMovimiento = new Map(
        procesosMovimiento.filter((p) => p?.proceso && p?.movimiento).map((p) => [normalizarComparacion(p.proceso), String(p.movimiento).trim()])
      );
      const requiereContenedorPorMovimiento = new Map(
        (tiposMovimiento || []).map((m) => [normalizarComparacion(m.movimiento), Boolean(m.requiere_contenedor)])
      );
      const ubicacionPorNombre = new Map(
        (ubicaciones || []).map((u) => [normalizarComparacion(u.ubicacion), u])
      );

      const grupos = new Map();
      filasSemana.forEach((fila) => {
        const procesoKey = normalizarComparacion(fila.proceso_empaque);
        const finca = procesoAAlmacen.get(procesoKey) || String(fila.finca || '').trim();
        const movimiento = procesoAMovimiento.get(procesoKey) || '';
        const requiereContenedor = requiereContenedorPorMovimiento.get(normalizarComparacion(movimiento)) || false;
        // Con contenedor: la finca es el destino (el origen lo elige el
        // usuario). Sin contenedor: la finca es el origen (el destino lo
        // elige el usuario).
        const fincaUbicacion = ubicacionPorNombre.get(normalizarComparacion(finca));
        // La finca va en la clave: varias fincas distintas pueden compartir el
        // mismo proceso de empaque (ej. "Finca"), y cada una debe quedar en su
        // propia linea del borrador — agrupar solo por proceso mezclaba las
        // cajas de fincas distintas en una sola linea.
        const key = `${fila.fecha}|${fila.booking}|${fila.proceso_empaque}|${normalizarComparacion(finca)}`;
        const producto = String(fila.combo?.nombre || 'Sin producto').trim();
        const cajas = Number(fila.cajas) || 0;

        const existente = grupos.get(key) || {
          id: key,
          fecha: fila.fecha,
          booking: fila.booking,
          movimiento,
          requiereContenedor,
          contenedor: requiereContenedor ? DEMO_CONTENEDOR : '',
          origen: requiereContenedor ? '' : finca,
          origenId: requiereContenedor ? '' : (fincaUbicacion?.id || ''),
          destino: requiereContenedor ? finca : '',
          destinoId: requiereContenedor ? (fincaUbicacion?.id || '') : '',
          vehiculo: '',
          vehiculoId: '',
          productos: [],
        };

        const productoExistente = existente.productos.find((p) => p.producto === producto);
        if (productoExistente) {
          productoExistente.cajas += cajas;
        } else {
          existente.productos.push({ producto, cajas });
        }

        grupos.set(key, existente);
      });

      const borrador = Array.from(grupos.values()).sort(
        (a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.booking).localeCompare(String(b.booking))
      );

      setSugeridoBorrador(borrador);
      setShowSemanaModal(false);
      setShowSugeridoModal(true);
    } catch (error) {
      console.error('Error al generar el sugerido de transporte:', error);
      window.alert('No fue posible generar el sugerido de transporte.');
    } finally {
      setGenerandoSugerido(false);
    }
  };

  const actualizarFila = (id, campo, valor) => {
    setSugeridoBorrador((prev) => prev.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila)));
  };

  // Cambiar el movimiento a mano debe recalcular si requiere contenedor
  // (el borrador solo lo calculaba una vez, al generarse, con el movimiento
  // que trajo del mapeo de proceso de empaque). Si el nuevo movimiento no lo
  // requiere, el contenedor deja de tener sentido y se limpia; si si lo
  // requiere y estaba vacio, se precarga el demo por defecto.
  const cambiarMovimientoFila = (id, nuevoMovimiento) => {
    const requiereContenedor = Boolean(
      (tiposMovimiento || []).find((m) => normalizarComparacion(m.movimiento) === normalizarComparacion(nuevoMovimiento))?.requiere_contenedor
    );
    setSugeridoBorrador((prev) => prev.map((fila) => {
      if (fila.id !== id) return fila;
      return {
        ...fila,
        movimiento: nuevoMovimiento,
        requiereContenedor,
        contenedor: requiereContenedor ? (fila.contenedor || DEMO_CONTENEDOR) : '',
      };
    }));
  };

  const actualizarProducto = (filaId, index, campo, valor) => {
    setSugeridoBorrador((prev) => prev.map((fila) => {
      if (fila.id !== filaId) return fila;
      const productos = fila.productos.map((p, i) => (i === index ? { ...p, [campo]: valor } : p));
      return { ...fila, productos };
    }));
  };

  const agregarProducto = (filaId) => {
    setSugeridoBorrador((prev) => prev.map((fila) => (
      fila.id === filaId ? { ...fila, productos: [...fila.productos, { producto: '', cajas: 0 }] } : fila
    )));
  };

  const eliminarProducto = (filaId, index) => {
    setSugeridoBorrador((prev) => prev.map((fila) => (
      fila.id === filaId ? { ...fila, productos: fila.productos.filter((_, i) => i !== index) } : fila
    )));
  };

  const eliminarFila = (id) => {
    setSugeridoBorrador((prev) => prev.filter((fila) => fila.id !== id));
  };

  const duplicarFila = (fila) => {
    const copia = {
      ...fila,
      id: `${fila.id}__dup${Date.now()}`,
      productos: fila.productos.map((p) => ({ ...p })),
    };
    setSugeridoBorrador((prev) => {
      const idx = prev.findIndex((f) => f.id === fila.id);
      const siguiente = [...prev];
      siguiente.splice(idx + 1, 0, copia);
      return siguiente;
    });
  };

  const enviarFila = async (fila) => {
    if (!fila.movimiento) {
      window.alert('Este proceso de empaque no tiene un movimiento configurado (boton "Configurar movimientos").');
      return;
    }
    if (!fila.origenId || !fila.destinoId) {
      window.alert('Elija origen y destino antes de enviar.');
      return;
    }
    if (!fila.vehiculoId) {
      window.alert('Elija un vehiculo antes de enviar.');
      return;
    }
    if (!fila.productos.some((p) => Number(p.cajas) > 0)) {
      window.alert('Esta fila no tiene cajas para enviar.');
      return;
    }

    setEnviandoFilaId(fila.id);
    try {
      let rutaId;
      try {
        const ruta = await buscarRutaPost({ ubicacion1: fila.origenId, ubicacion2: fila.destinoId });
        rutaId = ruta?.data?.id;
      } catch {
        const nuevaRuta = await agregarRutas({ ubicacion1: fila.origenId, ubicacion2: fila.destinoId });
        rutaId = nuevaRuta?.data?.id;
      }
      if (!rutaId) {
        throw new Error('No fue posible resolver la ruta origen-destino.');
      }

      const creado = await agregarProgramaciones({
        movimiento: fila.movimiento,
        fecha: fila.fecha,
        bl: fila.booking,
        contenedor: fila.contenedor || '',
        ruta_id: rutaId,
        vehiculo_id: fila.vehiculoId,
        activo: true,
      });
      const programacionId = creado?.data?.id || creado?.id;
      if (!programacionId) {
        throw new Error('La programacion se creo pero no se pudo obtener su id.');
      }

      for (const p of fila.productos) {
        if (!(Number(p.cajas) > 0)) continue;
        const combo = (combos || []).find((c) => normalizarComparacion(c.nombre) === normalizarComparacion(p.producto));
        if (!combo) {
          console.warn(`No se encontro el producto "${p.producto}" en el catalogo de combos; se omite en productos_viajes.`);
          continue;
        }
        await agregarProductosViaje({
          programacion_id: programacionId,
          producto_id: combo.id,
          cantidad: p.cajas,
          unidad_de_medida: 'cajas',
          activo: true,
        });
      }

      eliminarFila(fila.id);
      onEnviado?.();
      setAlert({ active: true, mensaje: 'Movimiento enviado al Programador.', color: 'success', autoClose: true });
    } catch (error) {
      console.error('Error al enviar la fila del borrador a Programador:', error);
      window.alert(error?.message || 'No fue posible enviar este movimiento al Programador.');
    } finally {
      setEnviandoFilaId(null);
    }
  };

  return (
    <>
      <span className="d-inline-flex gap-2">
        <Button variant="light" size="sm" onClick={abrirSelectorSemana}>
          Sugerir transporte
        </Button>
        {isSuperAdmin && (
          <Button variant="outline-light" size="sm" onClick={abrirConfig}>
            <FaCog className="me-1" /> Configurar movimientos
          </Button>
        )}
      </span>

      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Movimiento por proceso de empaque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Relacione un proceso de empaque con un movimiento de vehiculo para el sugerido de transporte.
            Si el movimiento requiere contenedor, la finca del proceso se usa como destino; si no, como origen.
          </p>
          {draftMovimientos.length === 0 && (
            <p className="text-muted small">Aun no hay relaciones configuradas.</p>
          )}
          {draftMovimientos.map((item, idx) => (
            <div className="row g-2 mb-2 align-items-center" key={idx}>
              <div className="col-5">
                <Form.Select
                  value={item.proceso}
                  onChange={(e) => {
                    const nuevo = [...draftMovimientos];
                    nuevo[idx] = { ...nuevo[idx], proceso: e.target.value };
                    setDraftMovimientos(nuevo);
                  }}
                >
                  <option value="">Proceso de empaque...</option>
                  {PROCESOS_OPCIONES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-5">
                <Form.Select
                  value={item.movimiento}
                  onChange={(e) => {
                    const nuevo = [...draftMovimientos];
                    nuevo[idx] = { ...nuevo[idx], movimiento: e.target.value };
                    setDraftMovimientos(nuevo);
                  }}
                >
                  <option value="">Movimiento...</option>
                  {(tiposMovimiento || []).map((m) => (
                    <option key={m.id} value={m.movimiento}>{m.movimiento}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-2 text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setDraftMovimientos(draftMovimientos.filter((_, i) => i !== idx))}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setDraftMovimientos([...draftMovimientos, { proceso: '', movimiento: '' }])}
            >
              <FaPlus className="me-1" /> Agregar relacion
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={guardarConfig} disabled={guardandoConfig}>
            {guardandoConfig ? 'Guardando...' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSemanaModal} onHide={() => setShowSemanaModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sugerir transporte</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Semana de Programacion de Corte</Form.Label>
            <Form.Control
              list="sugerido-transporte-semanas"
              value={semanaSugerido}
              onChange={(e) => setSemanaSugerido(e.target.value)}
              placeholder="Escriba o elija una semana..."
              autoComplete="off"
            />
            <datalist id="sugerido-transporte-semanas">
              {semanas.map((s) => (
                <option key={s.id} value={s.consecutivo} />
              ))}
            </datalist>
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Fecha (opcional)</Form.Label>
            <Form.Control
              type="date"
              value={fechaSugerido}
              onChange={(e) => setFechaSugerido(e.target.value)}
            />
            <Form.Text className="text-muted">
              Dejar vacio para sugerir toda la semana; elegir un dia para sugerir solo ese dia.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowSemanaModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={generarSugerido} disabled={generandoSugerido}>
            {generandoSugerido ? 'Generando...' : 'Generar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <datalist id="sugerido-transporte-productos">
        {(combos || []).map((c) => <option key={c.id} value={c.nombre} />)}
      </datalist>

      <style>{`.sugerido-transporte-modal.modal-dialog { max-width: 90vw; width: 90vw; }`}</style>
      <Modal
        show={showSugeridoModal}
        onHide={() => setShowSugeridoModal(false)}
        centered
        size="xl"
        dialogClassName="sugerido-transporte-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Borrador de transporte sugerido
            {semanaSugerido ? ` - Semana ${semanaSugerido}` : ''}
            {fechaSugerido ? ` - ${fechaSugerido}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sugeridoBorrador.length === 0 ? (
            <div className="text-muted">No hay filas en el borrador.</div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <table
                className="table table-striped table-bordered table-sm text-center align-middle mb-0"
                style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
              >
                <thead
                  className="align-middle"
                  style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', position: 'sticky', top: 0, zIndex: 2 }}
                >
                  <tr>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Fecha</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Booking</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Movimiento</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Origen</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Destino</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Vehiculo</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={{ ...CELL_STYLE, whiteSpace: 'normal', minWidth: '170px' }}>Productos / Cajas</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}>Contenedor</th>
                    <th className="text-custom-small text-center text-white bg-secondary" style={CELL_STYLE}></th>
                  </tr>
                </thead>
                <tbody>
                  {sugeridoBorrador.map((fila) => (
                    <tr key={fila.id}>
                      <td style={{ ...CELL_STYLE, minWidth: '110px' }}>
                        <Form.Control
                          type="date"
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.fecha || ''}
                          onChange={(e) => actualizarFila(fila.id, 'fecha', e.target.value)}
                        />
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '90px' }}>
                        <Form.Control
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.booking || ''}
                          onChange={(e) => actualizarFila(fila.id, 'booking', e.target.value)}
                        />
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '110px' }}>
                        <Form.Select
                          size="sm"
                          className={`${COMPACT_INPUT_CLASS} ${!fila.movimiento ? 'border-danger' : ''}`}
                          value={fila.movimiento || ''}
                          onChange={(e) => cambiarMovimientoFila(fila.id, e.target.value)}
                        >
                          <option value="">Sin mapear...</option>
                          {(tiposMovimiento || []).map((m) => (
                            <option key={m.id} value={m.movimiento}>{m.movimiento}</option>
                          ))}
                        </Form.Select>
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '110px' }}>
                        <Form.Select
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.origenId || ''}
                          onChange={(e) => {
                            const ubicacion = (ubicaciones || []).find((u) => String(u.id) === e.target.value);
                            actualizarFila(fila.id, 'origenId', e.target.value);
                            actualizarFila(fila.id, 'origen', ubicacion?.ubicacion || '');
                          }}
                        >
                          <option value="">{fila.origen || 'Elegir...'}</option>
                          {(ubicaciones || []).map((u) => (
                            <option key={u.id} value={u.id}>{u.ubicacion}</option>
                          ))}
                        </Form.Select>
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '110px' }}>
                        <Form.Select
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.destinoId || ''}
                          onChange={(e) => {
                            const ubicacion = (ubicaciones || []).find((u) => String(u.id) === e.target.value);
                            actualizarFila(fila.id, 'destinoId', e.target.value);
                            actualizarFila(fila.id, 'destino', ubicacion?.ubicacion || '');
                          }}
                        >
                          <option value="">{fila.destino || 'Elegir...'}</option>
                          {(ubicaciones || []).map((u) => (
                            <option key={u.id} value={u.id}>{u.ubicacion}</option>
                          ))}
                        </Form.Select>
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '90px' }}>
                        <Form.Select
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.vehiculoId || ''}
                          onChange={(e) => {
                            const vehiculo = (vehiculos || []).find((v) => String(v.id) === e.target.value);
                            actualizarFila(fila.id, 'vehiculoId', e.target.value);
                            actualizarFila(fila.id, 'vehiculo', vehiculo?.placa || '');
                          }}
                        >
                          <option value="">Elegir...</option>
                          {(vehiculos || []).map((v) => (
                            <option key={v.id} value={v.id}>{v.placa}</option>
                          ))}
                        </Form.Select>
                      </td>
                      <td style={{ ...CELL_STYLE, whiteSpace: 'normal', textAlign: 'left' }}>
                        {fila.productos.map((p, index) => (
                          <div key={index} className="d-flex gap-1 mb-1 align-items-center">
                            <input
                              list="sugerido-transporte-productos"
                              value={p.producto}
                              onChange={(e) => actualizarProducto(fila.id, index, 'producto', e.target.value)}
                              placeholder="Producto..."
                              title={p.producto}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              style={{ maxWidth: '130px', fontSize: '0.75rem' }}
                            />
                            <input
                              type="number"
                              value={p.cajas}
                              onChange={(e) => actualizarProducto(fila.id, index, 'cajas', Number(e.target.value))}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              style={{ maxWidth: '70px', fontSize: '0.75rem' }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger border-0"
                              title="Quitar producto"
                              onClick={() => eliminarProducto(fila.id, index)}
                            >
                              <FaMinus size={11} />
                            </button>
                            {index === fila.productos.length - 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary border-0"
                                title="Agregar producto"
                                onClick={() => agregarProducto(fila.id)}
                              >
                                <FaPlus size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                        {fila.productos.length === 0 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0"
                            title="Agregar producto"
                            onClick={() => agregarProducto(fila.id)}
                          >
                            <FaPlus size={11} />
                          </button>
                        )}
                      </td>
                      <td style={{ ...CELL_STYLE, minWidth: '100px' }}>
                        <Form.Control
                          size="sm"
                          className={COMPACT_INPUT_CLASS}
                          value={fila.contenedor || ''}
                          onChange={(e) => actualizarFila(fila.id, 'contenedor', e.target.value)}
                          disabled={!fila.requiereContenedor}
                        />
                      </td>
                      <td style={CELL_STYLE} className="text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success border-0 me-1"
                          title="Enviar al Programador"
                          disabled={enviandoFilaId === fila.id}
                          onClick={() => enviarFila(fila)}
                        >
                          <FaPaperPlane />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary border-0 me-1"
                          title="Duplicar fila"
                          onClick={() => duplicarFila(fila)}
                        >
                          <FaCopy />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0"
                          title="Eliminar fila"
                          onClick={() => eliminarFila(fila.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowSugeridoModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
