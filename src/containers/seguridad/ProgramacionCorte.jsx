import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import { FaTrash, FaFileExcel, FaCog, FaPlus, FaChevronDown, FaChevronRight, FaArrowLeft } from 'react-icons/fa';
import { Button, Col, Collapse, Form, Modal, Row } from 'react-bootstrap';
import Loader from '@components/shared/Loader';
import styles2 from '@components/shared/Formularios/Formularios.module.css';
import excel from '@hooks/useExcel';
import { listarProgramacionCorte, cargarProgramacionCorte, eliminarProgramacionCorte, comparativaProgramacionCorte, listadoRelacionadoProgramacionCorte } from '@services/api/programacionCorte';
import { listarSemanas } from '@services/api/semanas';
import { encontrarModulo, actualizarModulo } from '@services/api/configuracion';
import { listarAlmacenes } from '@services/api/almacenes';
import { useAuth } from '@hooks/useAuth';
import ListadoContenedores from '@containers/seguridad/ListadoContenedores';

const COLUMNAS_ESPERADAS = ['Fecha', 'Booking', 'Transportadora', 'Proceso de Empaque', 'Finca', 'Producto', 'Cajas'];
const PROCESOS_OPCIONES = ['Finca', 'Local', 'Puerto', 'Contenedor Local'];

const normalizarFecha = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number' && valor > 20000) {
    // Un serial de Excel es solo un conteo de dias (sin hora ni zona), asi que
    // esta cuenta ya da medianoche UTC del dia correcto sin importar la zona
    // horaria de quien sube el archivo. Sumarle el getTimezoneOffset() local
    // (como se hacia antes) desplazaba la fecha segun la maquina del usuario.
    const fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
    return fecha.toISOString().slice(0, 10);
  }
  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const partes = texto.split(/[/.-]/);
  if (partes.length === 3) {
    const [a, b, c] = partes.map((p) => p.padStart(2, '0'));
    return partes[0].length === 4 ? `${a}-${b}-${c}` : `${c}-${b}-${a}`;
  }
  return texto;
};

const mapColumna = (nombre) => {
  const limpio = String(nombre || '').trim().toLowerCase();
  if (limpio === 'fecha') return 'fecha';
  if (limpio === 'booking') return 'booking';
  if (limpio === 'transportadora') return 'transportadora';
  if (limpio === 'proceso de empaque') return 'proceso_empaque';
  if (limpio === 'finca') return 'finca';
  if (limpio === 'producto' || limpio === 'combo') return 'combo';
  if (limpio === 'cajas') return 'cajas';
  return null;
};

const BADGE_ESTADO = {
  coincide: 'success',
  difiere: 'warning',
  solo_programacion: 'info',
  solo_listado: 'secondary'
};

const LABEL_ESTADO = {
  coincide: 'Coincide',
  difiere: 'Difiere',
  solo_programacion: 'Solo programacion',
  solo_listado: 'Solo listado'
};

const ProgramacionCorte = () => {
  const { getUser } = useAuth();
  const user = getUser();
  const isSuperAdmin = user?.id_rol === 'Super administrador';
  const router = useRouter();
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [semanas, setSemanas] = useState([]);
  const [semana, setSemana] = useState('');
  const [semanaFiltro, setSemanaFiltro] = useState('');
  const [bookingFiltro, setBookingFiltro] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [productoFiltro, setProductoFiltro] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [datosExcel, setDatosExcel] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [comparativa, setComparativa] = useState(null);
  const [cargandoComparativa, setCargandoComparativa] = useState(false);
  const [openTabla, setOpenTabla] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [draftProcesos, setDraftProcesos] = useState([]);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detalleFila, setDetalleFila] = useState(null);
  const [detalleComparativa, setDetalleComparativa] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState(null);
  const [detalleListado, setDetalleListado] = useState(null);
  const [detalleListadoLoading, setDetalleListadoLoading] = useState(false);
  const [listadoRelacionadoFiltros, setListadoRelacionadoFiltros] = useState(null);

  // Abre el Listado de Contenedores real (mismas columnas, misma edicion)
  // dentro de un modal, ya filtrado a la fecha/booking/lugar de
  // llenado/producto de esta fila de la comparativa.
  const abrirListadoRelacionado = (fila) => {
    setListadoRelacionadoFiltros({
      booking: fila.booking,
      llenado: fila.finca,
      producto: fila.producto,
      fecha_inicial: fila.fecha,
      fecha_final: fila.fecha,
    });
  };

  const cargarLista = async () => {
    setLoading(true);
    try {
      const res = await listarProgramacionCorte();
      setFilas(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Error al listar programacion de corte:', error);
      window.alert('No fue posible cargar la programacion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const semanasRes = await listarSemanas();
        const sortedWeeks = [...(semanasRes || [])].sort((a, b) =>
          String(b?.consecutivo || '').localeCompare(String(a?.consecutivo || ''))
        );
        setSemanas(sortedWeeks);

        let semanaInicial = sortedWeeks[0]?.consecutivo || '';
        try {
          const moduloSemana = await encontrarModulo('Semana', { syncWeeks: false });
          const consecutivoActual = `S${String(moduloSemana?.[0]?.semana_actual ?? '').padStart(2, '0')}-${moduloSemana?.[0]?.anho_actual ?? ''}`;
          const existeActual = sortedWeeks.some(
            (s) => String(s?.consecutivo || '').toLowerCase() === consecutivoActual.toLowerCase()
          );
          if (existeActual) semanaInicial = consecutivoActual;
        } catch (error) {
          console.warn('No fue posible obtener la semana actual; se usara la mas reciente.', error);
        }

        setSemana(semanaInicial);
        setSemanaFiltro(semanaInicial);
      } catch (error) {
        console.error('Error cargando semanas:', error);
        window.alert('No fue posible cargar las semanas.');
      }
    };
    init();
    cargarLista();
  }, []);

  const semanaEsValida = (valor) => semanas.some(
    (s) => String(s?.consecutivo || '').toLowerCase() === String(valor || '').trim().toLowerCase()
  );

  const filasFiltradas = useMemo(() => {
    const semanaTexto = semanaFiltro.trim().toLowerCase();
    const bookingTexto = bookingFiltro.trim().toLowerCase();
    const almacenTexto = almacenFiltro.trim().toLowerCase();
    const productoTexto = productoFiltro.trim().toLowerCase();

    return filas.filter((fila) => {
      if (semanaTexto && String(fila.Embarque?.semana?.consecutivo || '').toLowerCase() !== semanaTexto) {
        return false;
      }
      if (bookingTexto && !String(fila.booking || '').toLowerCase().includes(bookingTexto)) {
        return false;
      }
      if (almacenTexto
        && !String(fila.almacen?.nombre || '').toLowerCase().includes(almacenTexto)
        && !String(fila.finca || '').toLowerCase().includes(almacenTexto)
      ) {
        return false;
      }
      if (productoTexto && !String(fila.combo?.nombre || '').toLowerCase().includes(productoTexto)) {
        return false;
      }
      return true;
    });
  }, [filas, semanaFiltro, bookingFiltro, almacenFiltro, productoFiltro]);

  // La comparativa se trae completa para la semana; se le aplican aca los
  // mismos filtros (booking, lugar de llenado, producto) que a la
  // "Programacion cargada" de arriba, para que ambas tablas muestren lo mismo.
  const comparativaFilasFiltradas = useMemo(() => {
    if (!comparativa?.filas) return [];
    const bookingTexto = bookingFiltro.trim().toLowerCase();
    const almacenTexto = almacenFiltro.trim().toLowerCase();
    const productoTexto = productoFiltro.trim().toLowerCase();

    return comparativa.filas.filter((fila) => {
      if (bookingTexto && !String(fila.booking || '').toLowerCase().includes(bookingTexto)) {
        return false;
      }
      if (almacenTexto && !String(fila.finca || '').toLowerCase().includes(almacenTexto)) {
        return false;
      }
      if (productoTexto && !String(fila.producto || '').toLowerCase().includes(productoTexto)) {
        return false;
      }
      return true;
    });
  }, [comparativa, bookingFiltro, almacenFiltro, productoFiltro]);

  const comparativaTotales = useMemo(() => comparativaFilasFiltradas.reduce((acc, fila) => ({
    totalProgramacion: acc.totalProgramacion + Number(fila.cajasProgramacion || 0),
    totalListado: acc.totalListado + Number(fila.cajasListado || 0),
  }), { totalProgramacion: 0, totalListado: 0 }), [comparativaFilasFiltradas]);

  useEffect(() => {
    let cancelado = false;
    const cargarComparativa = async () => {
      const esValida = semanas.some(
        (s) => String(s?.consecutivo || '').toLowerCase() === String(semanaFiltro || '').trim().toLowerCase()
      );
      if (!esValida) {
        setComparativa(null);
        return;
      }
      setCargandoComparativa(true);
      try {
        const res = await comparativaProgramacionCorte(semanaFiltro);
        if (!cancelado) setComparativa(res);
      } catch (error) {
        console.error('Error al cargar la comparativa:', error);
        if (!cancelado) setComparativa(null);
      } finally {
        if (!cancelado) setCargandoComparativa(false);
      }
    };
    cargarComparativa();
    return () => { cancelado = true; };
  }, [semanaFiltro, semanas, refreshKey]);

  const abrirConfig = async () => {
    setOpenConfig(true);
    try {
      const [almacenesRes, configRes] = await Promise.all([
        listarAlmacenes().catch(() => []),
        encontrarModulo('ProgramacionCorte', { syncWeeks: false }).catch(() => [])
      ]);
      const lista = Array.isArray(almacenesRes)
        ? [...almacenesRes].sort((a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || '')))
        : [];
      setAlmacenes(lista);

      let procesos = [];
      try {
        const detalles = typeof configRes?.[0]?.detalles === 'string'
          ? JSON.parse(configRes[0].detalles)
          : (configRes?.[0]?.detalles || {});
        procesos = Array.isArray(detalles.procesos_almacenes) ? detalles.procesos_almacenes : [];
      } catch (error) {
        console.warn('Error al parsear config de procesos:', error);
      }
      setDraftProcesos(procesos.filter((p) => p && p.proceso && p.almacen));
    } catch (error) {
      console.error('Error al cargar configuracion:', error);
      window.alert('No fue posible cargar la configuracion.');
    }
  };

  const guardarConfig = async () => {
    const limpios = draftProcesos.filter((p) => p?.proceso && p?.almacen);
    const unicos = [];
    const vistos = new Set();
    for (const p of limpios) {
      const clave = String(p.proceso).trim().toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      unicos.push({ proceso: String(p.proceso).trim(), almacen: String(p.almacen).trim() });
    }

    setGuardandoConfig(true);
    try {
      await actualizarModulo({
        modulo: 'ProgramacionCorte',
        detalles: JSON.stringify({ procesos_almacenes: unicos })
      });
      setDraftProcesos(unicos);
      setOpenConfig(false);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Error al guardar configuracion:', error);
      window.alert('No fue posible guardar la configuracion.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const descargarPlantilla = () => {
    excel(
      [{ Fecha: '', Booking: '', Transportadora: '', 'Proceso de Empaque': '', Finca: '', Producto: '', Cajas: '' }],
      'Plantilla',
      'Cargue Masivo de Programacion de Corte'
    );
  };

  const handleArchivoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setArchivo(file);
    setResultado(null);
    if (!file) return;

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const crudas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

        const claves = crudas.length > 0 ? Object.keys(crudas[0]) : [];
        const indiceColumnas = claves.map(mapColumna);
        const faltantes = ['fecha', 'booking', 'transportadora', 'proceso_empaque', 'finca', 'combo', 'cajas']
          .filter((clave) => !indiceColumnas.includes(clave));
        if (faltantes.length > 0) {
          window.alert(`El archivo debe tener las columnas: ${COLUMNAS_ESPERADAS.join(', ')}`);
          setArchivo(null);
          setDatosExcel([]);
          return;
        }

        const filasNormalizadas = crudas.map((fila) => {
          const obtener = (clave) => {
            const i = indiceColumnas.indexOf(clave);
            return i >= 0 ? fila[claves[i]] : '';
          };
          return {
            fecha: normalizarFecha(obtener('fecha')),
            booking: String(obtener('booking') ?? '').trim(),
            transportadora: String(obtener('transportadora') ?? '').trim(),
            proceso_empaque: String(obtener('proceso_empaque') ?? '').trim(),
            finca: String(obtener('finca') ?? '').trim(),
            combo: String(obtener('combo') ?? '').trim(),
            cajas: Number(obtener('cajas'))
          };
        });

        setDatosExcel(filasNormalizadas);
      } catch (error) {
        console.error('Error al leer el archivo:', error);
        window.alert('No fue posible leer el archivo.');
        setArchivo(null);
        setDatosExcel([]);
      }
    };

    reader.onerror = (error) => {
      console.error('Error al leer el archivo: ', error);
      window.alert('No fue posible leer el archivo.');
    };
  };

  const procesarExcel = async () => {
    if (!archivo) {
      window.alert('Seleccione un archivo de Excel primero.');
      return;
    }

    if (!semana.trim() || !semanaEsValida(semana)) {
      window.alert('Seleccione una semana valida de la lista.');
      return;
    }

    if (datosExcel.length === 0) {
      window.alert('No hay datos para cargar. Verifique el archivo.');
      return;
    }

    setCargando(true);
    setResultado(null);

    try {
      const res = await cargarProgramacionCorte(datosExcel, semana);
      setResultado(res);
      if (res.abortado) {
        return;
      }
      setArchivo(null);
      setDatosExcel([]);
      setSemanaFiltro(semana);
      setOpenModal(false);
      await cargarLista();
    } catch (error) {
      console.error('Error al procesar el Excel:', error);
      window.alert(error?.response?.data?.message || 'No fue posible cargar el archivo.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarFila = async (id) => {
    if (!window.confirm('Desea eliminar esta fila de la programacion?')) return;
    try {
      await eliminarProgramacionCorte(id);
      await cargarLista();
    } catch (error) {
      window.alert('No fue posible eliminar la fila.');
    }
  };

  // Trae la comparativa de la semana de esa fila puntual (no depende del filtro
  // de semana activo en pantalla, para que el detalle funcione aunque se este
  // viendo "todas las semanas").
  const verDetalleFila = async (fila) => {
    const consecutivoSemana = fila.Embarque?.semana?.consecutivo;
    setDetalleFila(fila);
    setDetalleComparativa(null);
    setDetalleError(null);
    setDetalleListado(null);

    setDetalleListadoLoading(true);
    listadoRelacionadoProgramacionCorte(fila.id)
      .then((res) => setDetalleListado(res))
      .catch((error) => console.error('Error al cargar las lineas de Listado relacionadas:', error))
      .finally(() => setDetalleListadoLoading(false));

    if (!consecutivoSemana) {
      setDetalleError('Esta fila no tiene una semana asociada; no se puede calcular el detalle.');
      return;
    }

    setDetalleLoading(true);
    try {
      const res = await comparativaProgramacionCorte(consecutivoSemana);
      const producto = String(fila.combo?.nombre || 'Sin producto').trim();
      const match = res?.filas?.find(
        (c) => c.booking === fila.booking && c.finca === fila.finca && c.fecha === fila.fecha && c.producto === producto
      ) || null;
      setDetalleComparativa(match);
    } catch (error) {
      console.error('Error al cargar el detalle de la fila:', error);
      setDetalleError('No fue posible cargar el detalle de esta fila.');
    } finally {
      setDetalleLoading(false);
    }
  };

  const cerrarDetalleFila = () => {
    setDetalleFila(null);
    setDetalleListado(null);
    setDetalleComparativa(null);
    setDetalleError(null);
  };

  return (
    <>
      <Loader loading={loading} />
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-2">Programacion de Corte</h2>
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0 border-0 text-secondary"
            onClick={() => router.push('/Seguridad/Listado')}
            title="Volver al Listado de Contenedores"
            style={{ lineHeight: 1 }}
          >
            <FaArrowLeft size={17} />
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0 border-0 text-secondary"
              onClick={abrirConfig}
              title="Configuracion"
              style={{ lineHeight: 1 }}
            >
              <FaCog size={17} />
            </button>
          )}
        </div>
      </div>
      <div className="line"></div>

      <Form className="mt-3">
        <Row xs={1} sm={2} md={4} lg={5} className="align-items-end">
          <Col>
            <Form.Group className="mb-0">
              <Form.Label className="mt-1 mb-1">Semana</Form.Label>
              <Form.Control
                className="form-control-sm"
                type="text"
                list="programacion-corte-semanas-filtro"
                placeholder="Todas las semanas"
                value={semanaFiltro}
                onChange={(e) => setSemanaFiltro(e.target.value)}
              />
              <datalist id="programacion-corte-semanas-filtro">
                {semanas.map((s) => (
                  <option key={s.id} value={s.consecutivo} />
                ))}
              </datalist>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group className="mb-0">
              <Form.Label className="mt-1 mb-1">Booking</Form.Label>
              <Form.Control
                className="form-control-sm"
                type="text"
                placeholder="Todos"
                value={bookingFiltro}
                onChange={(e) => setBookingFiltro(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group className="mb-0">
              <Form.Label className="mt-1 mb-1">Lugar de llenado</Form.Label>
              <Form.Control
                className="form-control-sm"
                type="text"
                placeholder="Todos"
                value={almacenFiltro}
                onChange={(e) => setAlmacenFiltro(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group className="mb-0">
              <Form.Label className="mt-1 mb-1">Producto</Form.Label>
              <Form.Control
                className="form-control-sm"
                type="text"
                placeholder="Todos"
                title="Requiere seleccionar una semana valida (usa los datos de la comparativa)"
                value={productoFiltro}
                onChange={(e) => setProductoFiltro(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col>
            <Button variant="success" size="sm" className="w-100" onClick={() => setOpenModal(true)}>
              <FaFileExcel className="me-1" /> Cargar Excel
            </Button>
          </Col>
        </Row>
      </Form>

      <div className="card mt-3">
        <button
          type="button"
          className="card-header fw-bold d-flex justify-content-between align-items-center w-100 border-0 bg-dark text-white"
          onClick={() => setOpenTabla(!openTabla)}
          style={{ cursor: 'pointer' }}
        >
          <span>
            Programacion cargada ({filasFiltradas.length}{semanaFiltro ? ` - Semana ${semanaFiltro}` : ''})
          </span>
          <span>{openTabla ? <FaChevronDown /> : <FaChevronRight />}</span>
        </button>
        <Collapse in={openTabla}>
          <div className="table-responsive">
          <table className="table table-striped table-bordered table-sm mt-2 text-center align-middle mb-0">
            <thead className="align-middle">
              <tr>
                <th className="text-custom-small text-center text-white bg-secondary">Semana</th>
                <th className="text-custom-small text-center text-white bg-secondary">Fecha</th>
                <th className="text-custom-small text-center text-white bg-secondary">Booking</th>
                <th className="text-custom-small text-center text-white bg-secondary">Transportadora</th>
                <th className="text-custom-small text-center text-white bg-secondary">Proceso de Empaque</th>
                <th className="text-custom-small text-center text-white bg-secondary">Finca</th>
                <th className="text-custom-small text-center text-white bg-secondary">Producto</th>
                <th className="text-custom-small text-center text-white bg-secondary">Cajas</th>
                <th className="text-custom-small text-center text-white bg-secondary">Embarque</th>
                <th className="text-custom-small text-center text-white bg-secondary">Almacen</th>
                <th className="text-custom-small text-center text-white bg-secondary">Accion</th>
              </tr>
            </thead>
            <tbody className="align-middle">
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-custom-small text-center text-muted">
                    Aun no hay programacion para mostrar. Use el boton &quot;Cargar Excel&quot;.
                  </td>
                </tr>
              )}
              {filasFiltradas.map((fila) => (
                <tr
                  key={fila.id}
                  onClick={() => verDetalleFila(fila)}
                  style={{ cursor: 'pointer' }}
                  title="Ver detalle de productos, cajas y diferencia vs Listado"
                >
                  <td className="text-custom-small text-center">{fila.Embarque?.semana?.consecutivo || '-'}</td>
                  <td className="text-custom-small text-center text-nowrap">{fila.fecha}</td>
                  <td className="text-custom-small text-center">{fila.booking}</td>
                  <td className="text-custom-small text-center">{fila.transportadora}</td>
                  <td className="text-custom-small text-center">{fila.proceso_empaque}</td>
                  <td className="text-custom-small text-center">{fila.finca}</td>
                  <td className="text-custom-small text-center">{fila.combo?.nombre || '-'}</td>
                  <td className="text-custom-small text-center">{fila.cajas}</td>
                  <td className="text-custom-small text-center">{fila.Embarque?.bl || fila.id_embarque}</td>
                  <td className="text-custom-small text-center">{fila.almacen?.nombre || fila.id_almacen}</td>
                  <td className="text-custom-small text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarFila(fila.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Collapse>
      </div>

      <div className="card mt-3">
        <div className="card-header fw-bold bg-dark text-white">
          Comparativa vs Listado {comparativa ? `- Semana ${comparativa.semana}` : ''}
        </div>
        {cargandoComparativa ? (
          <div className="p-3 text-center text-muted">Cargando comparativa...</div>
        ) : !semanaEsValida(semanaFiltro) ? (
          <div className="p-3 text-muted">Seleccione una semana para comparar cajas por dia, booking y lugar de llenado.</div>
        ) : !comparativa || comparativa.filas.length === 0 ? (
          <div className="p-3 text-muted">Sin datos para comparar en esta semana.</div>
        ) : comparativaFilasFiltradas.length === 0 ? (
          <div className="p-3 text-muted">Ninguna fila de la comparativa coincide con los filtros actuales.</div>
        ) : (
          <>
            <div className="card-body py-2 d-flex flex-wrap gap-3">
              <span>Cajas programacion: <b>{comparativaTotales.totalProgramacion}</b></span>
              <span>Cajas listado: <b>{comparativaTotales.totalListado}</b></span>
              <span>Diferencia: <b>{comparativaTotales.totalProgramacion - comparativaTotales.totalListado}</b></span>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-sm mt-2 text-center align-middle mb-0">
                <thead className="align-middle">
                  <tr>
                    <th className="text-custom-small text-center text-white bg-secondary">Fecha</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Booking</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Proceso de empaque</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Lugar de llenado</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Producto</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Cajas programacion</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Cajas listado</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Diferencia</th>
                    <th className="text-custom-small text-center text-white bg-secondary">Estado</th>
                  </tr>
                </thead>
                <tbody className="align-middle">
                  {comparativaFilasFiltradas.map((fila, idx) => (
                    <tr
                      key={`${fila.fecha}-${fila.booking}-${fila.finca}-${fila.producto}-${idx}`}
                      onClick={() => abrirListadoRelacionado(fila)}
                      style={{ cursor: 'pointer' }}
                      title="Ver estas lineas en el Listado de Contenedores"
                    >
                      <td className="text-custom-small text-center text-nowrap">{fila.fecha}</td>
                      <td className="text-custom-small text-center">{fila.booking}</td>
                      <td className="text-custom-small text-center">{fila.procesoEmpaque}</td>
                      <td className="text-custom-small text-center">{fila.finca}</td>
                      <td className="text-custom-small text-center">{fila.producto}</td>
                      <td className="text-custom-small text-center">{fila.cajasProgramacion}</td>
                      <td className="text-custom-small text-center">{fila.cajasListado}</td>
                      <td className="text-custom-small text-center">{fila.diferencia}</td>
                      <td className="text-custom-small text-center">
                        <span className={`badge bg-${BADGE_ESTADO[fila.estado] || 'secondary'}`}>
                          {LABEL_ESTADO[fila.estado] || fila.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {openModal && (
        <div className={styles2.fondo}>
          <div className={styles2.floatingform}>
            <div className="card">
              <div className="card-header d-flex justify-content-between">
                <span>
                  <span className="fw-bold me-2">Cargar Archivo Excel</span>
                  <span>
                    <span className="fw-bold me-2">|</span>
                    <span>Programacion de Corte</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="btn-close"
                  aria-label="Close"
                />
              </div>
              <div className="card-body">
                <div className="container-fluid">
                  <div className="row mb-1">
                    <div className="col-12">
                      <p className="text-muted">
                        Para garantizar que el archivo cargado cumpla con el formato requerido, puedes descargar la{' '}
                        <button
                          className="btn btn-link p-0 m-0 align-baseline text-primary fw-bold"
                          style={{ textDecoration: 'none' }}
                          onClick={descargarPlantilla}
                        >
                          plantilla aqui
                        </button>.
                      </p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 mb-3">
                      <span className="form-label fw-bold">Semana a cargar:</span>
                      <input
                        type="text"
                        className="form-control"
                        list="programacion-corte-semanas"
                        placeholder="Semana a cargar"
                        value={semana}
                        onChange={(e) => setSemana(e.target.value)}
                      />
                      <datalist id="programacion-corte-semanas">
                        {semanas.map((s) => (
                          <option key={s.id} value={s.consecutivo} />
                        ))}
                      </datalist>
                      <small className="text-muted">
                        La programacion existente de esta semana sera reemplazada.
                      </small>
                    </div>
                    <div className="col-12 mb-3">
                      <span className="form-label fw-bold">Selecciona un archivo:</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="form-control"
                        onChange={handleArchivoChange}
                        disabled={cargando}
                      />
                    </div>
                    <div className="col-12 d-flex justify-content-between">
                      <Button
                        className="w-50 me-2"
                        variant="secondary"
                        onClick={() => setOpenModal(false)}
                        disabled={cargando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="w-50"
                        variant="primary"
                        onClick={procesarExcel}
                        disabled={cargando}
                      >
                        {cargando ? 'Cargando...' : 'Cargar'}
                      </Button>
                    </div>
                  </div>

                  {resultado && (
                    <div className="mt-4">
                      <div className={`alert ${resultado.abortado ? 'alert-danger' : 'alert-success'} mb-2`}>
                        {resultado.abortado ? (
                          <>
                            No se cargo ni se borro nada: hay filas con errores. Revise la tabla para corregir las filas marcadas.
                          </>
                        ) : (
                          <>
                            Se borraron <b>{resultado.borrados}</b> registros de la semana y se cargaron{' '}
                            <b>{resultado.creados}</b> nuevos.
                          </>
                        )}
                      </div>
                      {resultado.errores?.length > 0 && (
                        <div className="table-responsive" style={{ maxHeight: '240px' }}>
                          <table className="table table-sm table-bordered mb-0">
                            <thead>
                              <tr>
                                <th>Fila</th>
                                <th>Detalle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resultado.errores.map((err, idx) => (
                                <tr key={idx}>
                                  <td>{err.fila}</td>
                                  <td>{err.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal show={openConfig} onHide={() => setOpenConfig(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Configuracion de procesos de empaque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Relacione un proceso de empaque con un almacen para que la comparativa use ese almacen
            en lugar de la finca del Excel. Ejemplo: el proceso &quot;Puerto&quot; se compara contra el almacen &quot;PUERTO&quot;.
          </p>
          {draftProcesos.length === 0 && (
            <p className="text-muted small">Aun no hay relaciones configuradas.</p>
          )}
          {draftProcesos.map((item, idx) => (
            <div className="row g-2 mb-2 align-items-center" key={idx}>
              <div className="col-5">
                <Form.Select
                  value={item.proceso}
                  onChange={(e) => {
                    const nuevo = [...draftProcesos];
                    nuevo[idx] = { ...nuevo[idx], proceso: e.target.value };
                    setDraftProcesos(nuevo);
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
                  value={item.almacen}
                  onChange={(e) => {
                    const nuevo = [...draftProcesos];
                    nuevo[idx] = { ...nuevo[idx], almacen: e.target.value };
                    setDraftProcesos(nuevo);
                  }}
                >
                  <option value="">Almacen...</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.nombre}>{a.nombre}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-2 text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setDraftProcesos(draftProcesos.filter((_, i) => i !== idx))}
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
              onClick={() => setDraftProcesos([...draftProcesos, { proceso: '', almacen: '' }])}
            >
              <FaPlus className="me-1" /> Agregar relacion
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setOpenConfig(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardarConfig} disabled={guardandoConfig}>
            {guardandoConfig ? 'Guardando...' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(detalleFila)} onHide={cerrarDetalleFila} centered size="lg">
        <Modal.Header closeButton closeVariant="white" className="bg-dark text-white">
          <Modal.Title className="h6 mb-0">
            Detalle {detalleFila?.fecha} - Booking {detalleFila?.booking}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detalleLoading ? (
            <div className="text-center text-muted py-4">Cargando detalle...</div>
          ) : detalleError ? (
            <div className="alert alert-danger py-2 mb-0">{detalleError}</div>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-3 mb-3">
                <span>Lugar de llenado: <b>{detalleFila?.finca}</b></span>
                <span>Producto: <b>{detalleFila?.combo?.nombre || 'Sin producto'}</b></span>
                <span>Cajas programacion: <b>{detalleFila?.cajas}</b></span>
                <span>Cajas listado: <b>{detalleComparativa?.cajasListado ?? 0}</b></span>
                <span>Diferencia: <b>{detalleComparativa?.diferencia ?? (detalleFila?.cajas ?? 0)}</b></span>
                {detalleComparativa?.estado && (
                  <span className={`badge bg-${BADGE_ESTADO[detalleComparativa.estado] || 'secondary'} align-self-center`}>
                    {LABEL_ESTADO[detalleComparativa.estado] || detalleComparativa.estado}
                  </span>
                )}
              </div>

              {!detalleComparativa && (
                <div className="text-muted">No hay cajas registradas en el Listado para esta fecha/booking/lugar de llenado/producto.</div>
              )}

              <hr />
              <div className="fw-bold mb-2">Lineas relacionadas en Listado de Contenedores</div>
              {detalleListadoLoading ? (
                <div className="text-center text-muted py-2">Cargando lineas...</div>
              ) : !detalleListado?.lineas?.length ? (
                <div className="text-muted small">No se encontraron lineas de Listado para esta fecha/booking/lugar de llenado/producto.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered text-center align-middle mb-0">
                    <thead>
                      <tr>
                        <th className="text-custom-small text-white bg-secondary">Contenedor</th>
                        <th className="text-custom-small text-white bg-secondary">Lugar de llenado</th>
                        <th className="text-custom-small text-white bg-secondary">Producto</th>
                        <th className="text-custom-small text-white bg-secondary">Cajas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleListado.lineas.map((linea) => (
                        <tr key={linea.id}>
                          <td className="text-custom-small">{linea.contenedor || '-'}</td>
                          <td className="text-custom-small">{linea.almacen}</td>
                          <td className="text-custom-small">{linea.producto}</td>
                          <td className="text-custom-small">{linea.cajas_unidades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={cerrarDetalleFila}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <style>{`.listado-relacionado-modal .modal-dialog { max-width: 95vw; width: 95vw; }`}</style>
      <Modal
        show={Boolean(listadoRelacionadoFiltros)}
        onHide={() => {
          setListadoRelacionadoFiltros(null);
          // Puede haber editado cajas/producto/etc. dentro del Listado —
          // refrescar la comparativa para que se vea el cambio sin tener que
          // recargar la pagina entera.
          setRefreshKey((prev) => prev + 1);
        }}
        centered
        size="xl"
        fullscreen="lg-down"
        dialogClassName="listado-relacionado-modal"
      >
        <Modal.Header closeButton closeVariant="white" className="bg-dark text-white">
          <Modal.Title className="h6 mb-0">Listado de Contenedores relacionado</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          {listadoRelacionadoFiltros && (
            <ListadoContenedores initialFilters={listadoRelacionadoFiltros} embebido />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProgramacionCorte;