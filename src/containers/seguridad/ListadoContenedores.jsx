import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Form, Col, Row, Button } from 'react-bootstrap';
import { FaQrcode } from 'react-icons/fa';
import Image from "next/image";
import config from '@public/images/configuracion.png';
import styles from '@styles/header.module.css';
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import InsumoConfig from '@assets/InsumoConfig';
import ListadoConfig from '@assets/ListadoConfig';
import CrearQRCode from '@components/seguridad/CrearQRcode';
import { encontrarModulo } from '@services/api/configuracion';
import { filtrarProductos } from '@services/api/productos';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarContenedor } from '@services/api/contenedores';
import { paginarCombos } from '@services/api/combos';
import { useAuth } from '@hooks/useAuth';
import * as XLSX from 'xlsx';
import Transbordar from '@assets/Seguridad/Listado/Transbordar';
import CargarExcel from '@assets/Seguridad/Listado/CargueMasivo';
import endPoints from '@services/api';

// Constantes
const COLORES_PASTEL = [
  "#FFCDD2", "#F8BBD0", "#E1BEE7", "#D1C4E9", "#C5CAE9",
  "#BBDEFB", "#B3E5FC", "#B2EBF2", "#B2DFDB", "#C8E6C9",
  "#DCEDC8", "#F0F4C3", "#FFF9C4", "#FFECB3", "#FFE0B2",
  "#FFCCBC", "#D7CCC8", "#F5F5F5", "#CFD8DC", "#FFE082"
];

const VALIDACIONES = {
  contenedor: /^[A-Za-z]{4}[0-9]{7}$/,
  cajas: /^\d+$/
};

const CONFIG_TABLA_DEFAULT = `["Fecha","Sem","BoL","Naviera","Destino","Llenado","Contenedor","Insumos de segurdad","Producto","Cajas","Peso Neto", "QR"]`;

const FILTER_FIELDS = [
  { id: "semana", label: "Sem", placeholder: "Ingrese la semana" },
  { id: "cliente", label: "Cliente", placeholder: "Ingrese Cliente" },
  { id: "booking", label: "Booking", placeholder: "Ingrese el Booking" },
  { id: "BoL", label: "Bill of Loading", placeholder: "Ingrese el BL" },
  { id: "naviera", label: "Naviera", placeholder: "Ingrese la Naviera" },
  { id: "destino", label: "Destino", placeholder: "Ingrese el Buque" },
  { id: "llenado", label: "Llenado", placeholder: "Lugar de Llenado" },
  { id: "contenedor", label: "Contenedor", placeholder: "DUMY0000001" },
  { id: "producto", label: "Producto", placeholder: "Ingrese el Producto" },
];

// Hook personalizado para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ListadoContenedores = () => {
  const { getUser } = useAuth();
  const formRef = useRef();
  const tablaRef = useRef();
  const user = getUser();

  // Estado para filtros
  const [filters, setFilters] = useState({
    semana: '', cliente: '', booking: '', BoL: '', naviera: '',
    destino: '', llenado: '', contenedor: '', producto: '',
    fecha_inicial: '', fecha_final: ''
  });

  // Estado principal
  const [state, setState] = useState({
    tableData: [], pagination: 1, limit: 50, total: 0,
    configuracionInsumos: [], configuracionTabla: JSON.parse(localStorage.getItem("ListadoConfig") || CONFIG_TABLA_DEFAULT),
    almacenes: JSON.parse(localStorage.getItem('almacenByUser') || '[]'), embarques: [], productos: [],
    check: [], checkAll: false, bol: {}, openConfig: false, openConfigTabla: false,
    openConfigInsumo: false, openTransbordar: false, openMasivo: false, isEditable: false,
    openQR: false, loading: false
  });

  // Debounce para filtros
  const debouncedFilters = useDebounce(filters, 500);

  // Memoized values
  const selectedItems = useMemo(() => 
    state.check
      .map((checked, index) => checked ? state.tableData[index] : null)
      .filter(Boolean),
    [state.check, state.tableData]
  );

  // Actualización optimizada del estado
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Funciones de utilidad
  const aplicarColor = useCallback((data = []) => {
    const contenedoresCount = data.reduce((acc, item) => {
      const contenedor = item.Contenedor?.contenedor;
      if (contenedor) acc[contenedor] = (acc[contenedor] || 0) + 1;
      return acc;
    }, {});

    const duplicados = Object.keys(contenedoresCount).filter(bl => contenedoresCount[bl] > 1);
    const colorMapping = duplicados.reduce((acc, bl, index) => {
      acc[bl] = COLORES_PASTEL[index % COLORES_PASTEL.length];
      return acc;
    }, {});

    updateState({ bol: colorMapping });
  }, [updateState]);

  // Handlers principales
  const handleCellEdit = useCallback(async (row, field, e) => {
    const value = e.target.innerText || e.target.value;

    if (field === "contenedor" && !VALIDACIONES.contenedor.test(value)) {
      e.target.style.color = "#C70039";
      alert('El contenedor debe tener 4 letras seguidas de 7 números.');
      return;
    }

    if (field === "cajas_unidades" && (!VALIDACIONES.cajas.test(value) || value === '')) {
      e.target.style.color = "#C70039";
      alert('El campo cajas debe ser un número.');
      return;
    }

    try {
      const updateData = field === "cajas_unidades" ? parseInt(value, 10) : value;
      
      if (field === "contenedor") {
        await actualizarContenedor(row.Contenedor.id, { [field]: updateData });
      } else {
        await actualizarListado(row.id, { [field]: updateData });
      }
      
      e.target.style.color = "";
      listar();
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el registro');
    }
  }, []);

  const handleDatalist = useCallback(async (id, itemActualiza, linea) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;

    let res;

    try {
      const lookupData = {
        almacen: { data: state.almacenes, field: "id_lugar_de_llenado", key: "nombre" },
        embarque: { data: state.embarques, field: "id_embarque", key: "bl" },
        producto: { data: state.productos, field: "id_producto", key: "nombre" }
      };

      const config = lookupData[itemActualiza];
      if (!config) return;

      res = config.data.find(item => item[config.key] === value);
      
      if (!res) {
        inputElement.style.color = "#C70039";
        alert(`En la fila ${linea} el item ${itemActualiza} no existe`);
        return;
      }

      await actualizarListado(linea, { [config.field]: res.id });
      inputElement.style.color = "";
      listar();
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el registro');
    }
  }, [state.almacenes, state.embarques, state.productos]);

  const onChangeCasilla = useCallback(async (id, field) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;

    try {
      const endpoints = {
        embarque: () => paginarEmbarques(1, 20, { bl: value }),
        producto: () => paginarCombos(1, 20, value)
      };

      if (endpoints[field]) {
        const { data } = await endpoints[field]();
        updateState({ [`${field}s`]: data });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }, [updateState]);

  // Operaciones en lote
  const ejecutarOperacionLote = useCallback(async (operacion, mensajeExito, mensajeError) => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un item');
      return;
    }

    try {
      await operacion(selectedItems);
      listar();
    } catch (error) {
      console.error(mensajeError, error);
      alert(mensajeError);
    }
  }, [selectedItems]);

  const duplicarLinea = useCallback(() => 
    ejecutarOperacionLote(
      async (items) => {
        await Promise.all(items.map(item => duplicarListado(item.id)));
        updateState({ limit: state.limit + items.length });
      },
      'Error al duplicar las líneas seleccionadas'
    ), [state.limit, updateState, ejecutarOperacionLote]
  );

  const eliminarLinea = useCallback(() => 
    ejecutarOperacionLote(
      async (items) => {
        await Promise.all(items.map(item => 
          actualizarListado(item.id, { habilitado: false })
        ));
        updateState({
          limit: Math.max(1, state.limit - items.length),
          check: new Array(state.check.length).fill(false),
          checkAll: false
        });
      },
      'Error al eliminar las líneas seleccionadas'
    ), [state.limit, state.check.length, updateState, ejecutarOperacionLote]
  );

  // Handlers simples
  const toggleEdit = useCallback(() => {
    updateState({ isEditable: !state.isEditable });
  }, [state.isEditable, updateState]);

  const handleConfig = useCallback(() => {
    updateState({ openConfig: false, openConfigTabla: false, openConfigInsumo: false });
  }, [updateState]);

  const handleOpenConfig = useCallback(() => {
    updateState({ openConfig: true });
  }, [updateState]);

  const handleTransbordar = useCallback(() => {
    updateState({ openTransbordar: true });
  }, [updateState]);

  const handleCargueMasivo = useCallback(() => {
    updateState({ openMasivo: true });
  }, [updateState]);

  const handleChecks = useCallback((index) => {
    const newCheck = [...state.check];
    newCheck[index] = !newCheck[index];
    updateState({ check: newCheck, checkAll: false });
  }, [state.check, updateState]);

  const handleCheckAll = useCallback(() => {
    const newCheckAll = !state.checkAll;
    updateState({
      checkAll: newCheckAll,
      check: new Array(state.check.length).fill(newCheckAll)
    });
  }, [state.checkAll, state.check.length, updateState]);

  const handleExport = useCallback(() => {
    try {
      const ws = XLSX.utils.table_to_sheet(tablaRef.current);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Listado de Contenedores");
      XLSX.writeFile(wb, "Listado de Contenedores.xlsx");
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el archivo Excel');
    }
  }, []);

  const renderHeader = useCallback((name, highlight = false, label = null) => {
    return state.configuracionTabla.includes(name) && (
      <th className={`text-custom-small text-center ${highlight ? 'text-white bg-secondary' : ''}`}>
        {label || name}
      </th>
    );
  }, [state.configuracionTabla]);

  // Función principal de carga de datos
  const listar = useCallback(async () => {
    updateState({ loading: true });
    
    try {
      const [modulo, embarquesRes, productoRes] = await Promise.all([
        encontrarModulo(`Relación_listado_${user.username}`),
        paginarEmbarques(1, 20, {}),
        paginarCombos(1, 20, "")
      ]);

      // Configuración de insumos
      const detalles = JSON.parse(modulo[0]?.detalles || '{"tags":[]}');
      const consecutivos = detalles.tags;

      let insumosConfig = [];
      if (consecutivos.length > 0) {
        const insumos = await filtrarProductos({ producto: { consecutivo: consecutivos } });
        insumosConfig = consecutivos.map(consecutivo =>
          insumos.find(e => e.consecutivo === consecutivo)
        ).filter(Boolean);
      }

      // Preparar filtros
      const filterParams = Object.entries({
        contenedor: debouncedFilters.contenedor,
        booking: debouncedFilters.booking,
        bl: debouncedFilters.BoL,
        destino: debouncedFilters.destino,
        naviera: debouncedFilters.naviera,
        cliente: debouncedFilters.cliente,
        semana: debouncedFilters.semana,
        buque: debouncedFilters.destino,
        fecha_inicial: debouncedFilters.fecha_inicial,
        fecha_final: debouncedFilters.fecha_final,
        llenado: debouncedFilters.llenado,
        producto: debouncedFilters.producto,
        habilitado: true
      }).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});

      const listadoList = await paginarListado(state.pagination, state.limit, filterParams);

      updateState({
        tableData: listadoList.data,
        total: listadoList.total,
        configuracionInsumos: insumosConfig,
        embarques: embarquesRes.data,
        productos: productoRes.data,
        check: new Array(listadoList.data.length).fill(false),
        loading: false
      });

      aplicarColor(listadoList.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos del listado');
      updateState({ loading: false });
    }
  }, [
    state.pagination, state.limit, user.username, aplicarColor, 
    updateState, debouncedFilters
  ]);

  // Handler optimizado para cambios en filtros
  const handleFilterChange = useCallback((field, value) => {
    updateFilters({ [field]: value });
    if (state.pagination !== 1) {
      updateState({ pagination: 1 });
    }
  }, [state.pagination, updateFilters, updateState]);

  // Efectos optimizados
  useEffect(() => {
    listar();
  }, [state.pagination, state.limit, debouncedFilters, state.openTransbordar, state.openMasivo, listar]);

  useEffect(() => {
    if (!state.openConfigTabla && !state.openConfigInsumo && !state.isEditable) {
      listar();
    }
  }, [state.openConfigTabla, state.openConfigInsumo, state.isEditable, listar]);

  return (
    <>
      <h2 className="mb-2">{"Listado de Contenedores"}</h2>
      <div className="line"></div>

      {/* Filtros optimizados */}
      <Form ref={formRef} className="">
        <Row xs={1} sm={2} md={4} lg={6} className="">
          {FILTER_FIELDS.map(({ id, label, placeholder }) => (
            <Col key={id}>
              <Form.Group className="mb-0" controlId={id}>
                <Form.Label className='mt-1 mb-1'>{label}</Form.Label>
                <Form.Control 
                  className='form-control-sm' 
                  type="text" 
                  name={id}
                  value={filters[id]}
                  onChange={(e) => handleFilterChange(id, e.target.value)}
                  placeholder={placeholder} 
                />
              </Form.Group>
            </Col>
          ))}

          {/* Fechas */}
          <Col>
            <Form.Group className="mb-0" controlId="fecha_inicial">
              <Form.Label className='mt-1 mb-1'>Fecha inicial</Form.Label>
              <Form.Control 
                className='form-control-sm' 
                name="fecha_inicial" 
                value={filters.fecha_inicial}
                onChange={(e) => handleFilterChange('fecha_inicial', e.target.value)}
                type="date" 
              />
            </Form.Group>
          </Col>

          <Col>
            <Form.Group className="mb-0" controlId="fecha_final">
              <Form.Label className='mt-1 mb-1'>Fecha final</Form.Label>
              <Form.Control 
                className='form-control-sm' 
                name='fecha_final' 
                value={filters.fecha_final}
                onChange={(e) => handleFilterChange('fecha_final', e.target.value)}
                type="date" 
              />
            </Form.Group>
          </Col>

          <Col>
            <button 
              type='button' 
              onClick={handleExport} 
              className={`btn mt-30px w-100 btn-sm btn-success`} 
              disabled={state.loading}
            >
              {state.loading ? 'Cargando...' : 'Descargar excel'}
            </button>
          </Col>
        </Row>
      </Form>

      {/* Botones de Control */}
      <Row className="mb-2 mt-4">
        <Col md={3} className="d-flex justify-content-start">
          <button
            className={`btn btn-sm m-1 ${state.isEditable ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleEdit}
          >
            {state.isEditable ? 'Bloquear Edición' : 'Permitir Edición'}
          </button>
        </Col>

        <Col className="d-flex justify-content-end">
          <span style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            margin: "5px 5px", padding: "auto", height: '25px', overflow: 'hidden', cursor: "pointer"
          }} className="text-sm">
            Mostrando {state.tableData.length} de {state.total}
          </span>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            margin: "5px 5px", padding: "auto", width: '25px', height: '25px', overflow: 'hidden', cursor: "pointer"
          }}>
            <Image
              className={styles.imgConfig}
              onClick={handleOpenConfig}
              src={config}
              alt="configuración"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div className="d-flex align-items-center me-1">
            <span className="me-2 ms-2">Limite:</span>
            <Form.Control
              type="number"
              className="form-control-sm"
              value={state.limit}
              style={{ maxWidth: "60px" }}
              onChange={e => {
                const newLimit = Math.min(200, Math.max(1, parseInt(e.target.value) || 1));
                updateState({ limit: newLimit, pagination: 1 });
              }}
              min={1}
              max={200}
            />
          </div>
          <button onClick={handleCargueMasivo} className="btn btn-sm m-1 btn-primary">
            {'Cargue masivo'}
          </button>
          <button onClick={duplicarLinea} className="btn btn-sm m-1 btn-warning">
            {'Duplicar línea'}
          </button>
          <button onClick={eliminarLinea} className="btn btn-sm m-1 btn-danger">
            {'Eliminar línea'}
          </button>
          <button onClick={handleTransbordar} className="btn btn-sm m-1 btn-info">
            {'Transbordar'}
          </button>
        </Col>
      </Row>

      {/* Tabla - Se mantiene igual */}
      <table ref={tablaRef} className="table table-striped table-bordered table-sm mt-2">
        <thead>
          <tr>
            <th className="text-custom-small text-center">
              <input
                className="form-check-input"
                type="checkbox"
                checked={state.checkAll}
                onChange={handleCheckAll}
              />
            </th>
            {renderHeader("Fecha")}
            {renderHeader("Sem", true)}
            {renderHeader("Bookin", true, "Booking")}
            {renderHeader("BoL")}
            {renderHeader("Naviera", true)}
            {renderHeader("Buque", true)}
            {renderHeader("Destino", true)}
            {renderHeader("Llenado")}
            {renderHeader("Contenedor")}
            {state.configuracionTabla.includes("Insumos de segurdad") &&
              state.configuracionInsumos.map((item, idx) => {
                const title = item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase();
                return (
                  <th className="text-custom-small text-center text-white bg-secondary" key={idx}>
                    {title}
                  </th>
                );
              })}
            {renderHeader("Producto")}
            {renderHeader("Cajas")}
            {renderHeader("Pallets", true)}
            {renderHeader("Peso Bruto", true)}
            {renderHeader("Peso Neto", true)}
            {renderHeader("QR", true)}
          </tr>
        </thead>
        <tbody>
          {state.tableData.map((row, index) => {
            const { serial_de_articulos: seriales, cajas_unidades: cajas, combo, Contenedor, Embarque, almacen, fecha } = row;
            const pallets = Math.ceil(cajas / combo?.cajas_por_palet || 1);
            const pesoBruto = (combo?.peso_bruto * cajas).toFixed(1);
            const pesoNeto = (combo?.peso_neto * cajas).toFixed(1);
            const cajasPorContenedor = (combo?.cajas_por_palet * (combo?.palets_por_contenedor - 1)) + (combo?.cajas_por_mini_palet || 0);
            const sumaToriaCajas = state.tableData
              .filter(item => item.Contenedor?.contenedor === Contenedor?.contenedor)
              .reduce((acc, item) => acc + item.cajas_unidades, 0);
            const existeRechazo = cajasPorContenedor === sumaToriaCajas ? "" : "text-danger";

            return (
              <tr key={row.id}>
                <td className="text-custom-small text-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={state.check[index]}
                    onChange={() => handleChecks(index)}
                  />
                </td>
                {state.configuracionTabla.includes("Fecha") && (
                  <td className="text-custom-small text-center">
                    {state.isEditable ? (
                      <input
                        type="date"
                        defaultValue={fecha?.slice(0, 10)}
                        onBlur={e => handleCellEdit(row, "fecha", e)}
                        className="date-input custom-input"
                        style={{ width: "90px", padding: 0 }}
                      />
                    ) : (
                      fecha?.slice(0, 10)
                    )}
                  </td>
                )}
                {state.configuracionTabla.includes("Sem") && (
                  <td className="text-custom-small text-center" style={{ width: "70px" }}>
                    {Embarque?.semana?.consecutivo}
                  </td>
                )}
                {state.configuracionTabla.includes("Bookin") && (
                  <td className="text-custom-small text-center">{Embarque?.booking}</td>
                )}
                {state.configuracionTabla.includes("BoL") && (
                  <td className="text-custom-small text-center">
                    <input
                      list={`${row.id}-embarques`}
                      id={`${row.id}-embarque`}
                      style={{ width: "100px", padding: 0 }}
                      defaultValue={Embarque?.bl}
                      disabled={!state.isEditable}
                      onChange={() => onChangeCasilla(`${row.id}-embarque`, 'embarque')}
                      onBlur={() => handleDatalist(`${row.id}-embarque`, 'embarque', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id={`${row.id}-embarques`}>
                      {state.embarques.map((item, i) => <option key={i} value={item.bl} />)}
                    </datalist>
                  </td>
                )}
                {state.configuracionTabla.includes("Naviera") && (
                  <td className="text-custom-small text-center">{Embarque?.Naviera?.cod}</td>
                )}
                {state.configuracionTabla.includes("Buque") && (
                  <td className="text-custom-small text-center">{Embarque?.Buque?.buque}</td>
                )}
                {state.configuracionTabla.includes("Destino") && (
                  <td className="text-custom-small text-center">{Embarque?.Destino?.cod}</td>
                )}
                {state.configuracionTabla.includes("Llenado") && (
                  <td className="text-custom-small text-center">
                    <input
                      list={`${row.id}-almacenes`}
                      id={`${row.id}-almacen`}
                      defaultValue={almacen?.nombre}
                      style={{ width: "110px", padding: 0 }}
                      disabled={!state.isEditable}
                      onBlur={() => handleDatalist(`${row.id}-almacen`, 'almacen', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id={`${row.id}-almacenes`}>
                      {state.almacenes.map((item, i) => <option key={i} value={item.nombre} />)}
                    </datalist>
                  </td>
                )}
                {state.configuracionTabla.includes("Contenedor") && (
                  <td
                    className="text-custom-small text-center"
                    style={{ backgroundColor: state.bol[Contenedor?.contenedor] }}
                    contentEditable={state.isEditable}
                    onBlur={(e) => handleCellEdit(row, "contenedor", e)}
                  >
                    {Contenedor?.contenedor}
                  </td>
                )}
                {state.configuracionTabla.includes("Insumos de segurdad") &&
                  state.configuracionInsumos.map((itemConfig, key) => {
                    const serial = seriales.filter(s => s.cons_producto === itemConfig.consecutivo);
                    const colorClass = serial.length > 1 ? "text-danger" : "green";
                    const latestItem = serial.reduce((latest, current) =>
                      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest, serial[0]
                    );
                    return (
                      <td className={`text-custom-small text-center ${colorClass}`} key={key}>
                        {latestItem?.serial}
                      </td>
                    );
                  })}
                {state.configuracionTabla.includes("Producto") && (
                  <td className="text-custom-small text-center">
                    <input
                      list="productos"
                      id={`${row.id}-producto`}
                      defaultValue={combo?.nombre}
                      disabled={!state.isEditable}
                      onBlur={() => handleDatalist(`${row.id}-producto`, 'producto', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id="productos">
                      {state.productos.map((item, i) => <option key={i} value={item.nombre} />)}
                    </datalist>
                  </td>
                )}
                {state.configuracionTabla.includes("Cajas") && (
                  <td
                    className={`text-custom-small text-center ${existeRechazo}`}
                    style={{ width: "60px" }}
                    contentEditable={state.isEditable}
                    onBlur={(e) => handleCellEdit(row, "cajas_unidades", e)}
                  >
                    {cajas}
                  </td>
                )}
                {state.configuracionTabla.includes("Pallets") && (
                  <td className="text-custom-small text-center">{pallets}</td>
                )}
                {state.configuracionTabla.includes("Peso Bruto") && (
                  <td className="text-custom-small text-center">{pesoBruto}</td>
                )}
                {state.configuracionTabla.includes("Peso Neto") && (
                  <td className="text-custom-small text-center">{pesoNeto}</td>
                )}
                {state.configuracionTabla.includes("QR") && (
                  <td className="text-custom-small text-center">
                    <button style={{ all: 'unset', cursor: 'pointer' }}
                      onClick={() => updateState({ openQR: Contenedor })}>
                      <FaQrcode />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <Paginacion
        setPagination={(page) => updateState({ pagination: page })}
        pagination={state.pagination}
        total={state.total}
        limit={state.limit}
      />

      {state.openConfigInsumo && <InsumoConfig handleConfig={handleConfig} modulo_confi={"Relación_listado_" + user.username} />}
      {state.openConfigTabla && <ListadoConfig handleConfig={handleConfig} modulo_confi={"Tabla_listado"} />}

      {state.openConfig && <div className={styles2.fondo}>
        <div className={styles2.floatingform}>
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <span className="fw-bold">Configuración</span>
              <button type="button" onClick={handleConfig} className="btn-close" aria-label="Close" />
            </div>
            <div className="card-body">
              <div className="container">
                <div className="row">
                  <div className="col-12 col-md-6 mb-2">
                    <Button className="w-100" onClick={() => updateState({ openConfigTabla: true, openConfig: false })} variant="secondary">
                      Campos
                    </Button>
                  </div>
                  <div className="col-12 col-md-6">
                    <Button className="w-100" onClick={() => updateState({ openConfigInsumo: true, openConfig: false })} variant="secondary">
                      Insumos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {state.openTransbordar && <Transbordar setOpen={(open) => updateState({ openTransbordar: open })} />}
      {state.openQR && <CrearQRCode setOpenQR={(open) => updateState({ openQR: open })} contenedor={state.openQR} />}
      {state.openMasivo && <CargarExcel setOpenMasivo={(open) => updateState({ openMasivo: open })}
        titulo={"Contenedores"}
        endPointCargueMasivo={endPoints.listado.create + "/masivo"}
        encabezados={{
          fecha: null, bl: null, contenedor: null, id_lugar_de_llenado: null, id_producto: null, cajas_unidades: null,
        }}
      />}
    </>
  );
};

export default ListadoContenedores;