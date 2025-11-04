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

// Constantes fuera del componente
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

const ListadoContenedores = () => {
  const { getUser } = useAuth();
  const formRef = useRef();
  const tablaRef = useRef();
  const user = getUser();

  // Estado unificado
  const [state, setState] = useState({
    tableData: [],
    pagination: 1,
    limit: 50,
    total: 0,
    configuracionInsumos: [],
    configuracionTabla: JSON.parse(localStorage.getItem("ListadoConfig") || CONFIG_TABLA_DEFAULT),
    almacenes: JSON.parse(localStorage.getItem('almacenByUser') || '[]'),
    embarques: [],
    productos: [],
    check: [],
    checkAll: false,
    bol: {},
    openConfig: false,
    openConfigTabla: false,
    openConfigInsumo: false,
    openTransbordar: false,
    openMasivo: false,
    isEditable: false,
    openQR: false
  });

  // Actualización optimizada del estado
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handlers optimizados
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
      const updateData = field === "cajas_unidades"
        ? parseInt(value, 10)
        : value;

      if (field === "contenedor") {
        await actualizarContenedor(row.Contenedor.id, { [field]: updateData });
      } else {
        await actualizarListado(row.id, { [field]: updateData });
      }
      e.target.style.color = "";
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el registro');
    }
  }, []);

  const toggleEdit = useCallback(() => {
    updateState({ isEditable: !state.isEditable });
  }, [state.isEditable, updateState]);

  const handleConfig = useCallback(() => {
    updateState({
      openConfig: false,
      openConfigTabla: false,
      openConfigInsumo: false
    });
  }, [updateState]);

  const handleOpenConfig = useCallback(() => {
    updateState({ openConfig: true });
  }, [updateState]);

  const onChangeCasilla = useCallback(async (id, field) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;

    try {
      if (field === "embarque") {
        const { data } = await paginarEmbarques(1, 20, { bl: value });
        updateState({ embarques: data });
      } else if (field === "producto") {
        const { data } = await paginarCombos(1, 20, value);
        updateState({ productos: data });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }, [updateState]);

  const renderHeader = useCallback((name, highlight = false, label = null) => {
    return state.configuracionTabla.includes(name) && (
      <th className={`text-custom-small text-center ${highlight ? 'text-white bg-secondary' : ''}`}>
        {label || name}
      </th>
    );
  }, [state.configuracionTabla]);

  const handleDatalist = useCallback(async (id, itemActualiza, linea) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;

    let res;
    let updateField;
    let updateValue;

    try {
      switch (itemActualiza) {
        case "almacen":
          res = state.almacenes.find(item => item.nombre === value);
          updateField = "id_lugar_de_llenado";
          updateValue = res?.id;
          break;
        case "embarque":
          res = state.embarques.find(item => item.bl === value);
          updateField = "id_embarque";
          updateValue = res?.id;
          break;
        case "producto":
          res = state.productos.find(item => item.nombre === value);
          updateField = "id_producto";
          updateValue = res?.id;
          break;
        default:
          return;
      }

      if (!res) {
        inputElement.style.color = "#C70039";
        alert(`En la fila ${linea} el item ${itemActualiza} no existe`);
        return;
      }

      await actualizarListado(linea, { [updateField]: updateValue });
      inputElement.style.color = "";
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el registro');
    }
  }, [state.almacenes, state.embarques, state.productos]);

  const duplicarLinea = useCallback(async () => {
    const selectedItems = state.check
      .map((checked, index) => checked ? state.tableData[index] : null)
      .filter(Boolean);

    if (selectedItems.length === 0) return;

    try {
      const promises = selectedItems.map(item => duplicarListado(item.id));
      await Promise.all(promises);
      updateState({ limit: state.limit + selectedItems.length });
    } catch (error) {
      console.error('Error al duplicar líneas:', error);
      alert('Error al duplicar las líneas seleccionadas');
    }
  }, [state.check, state.tableData, state.limit, updateState]);

  const eliminarLinea = useCallback(async () => {
    const selectedItems = state.check
      .map((checked, index) => checked ? state.tableData[index] : null)
      .filter(Boolean);

    if (selectedItems.length === 0) return;

    try {
      const promises = selectedItems.map(item =>
        actualizarListado(item.id, { habilitado: false })
      );
      await Promise.all(promises);
      updateState({
        limit: Math.max(1, state.limit - selectedItems.length),
        check: new Array(state.check.length).fill(false),
        checkAll: false
      });
    } catch (error) {
      console.error('Error al eliminar líneas:', error);
      alert('Error al eliminar las líneas seleccionadas');
    }
  }, [state.check, state.tableData, state.limit, updateState]);

  const handleTransbordar = useCallback(() => {
    updateState({ openTransbordar: true });
  }, [updateState]);

  const handleCargueMasivo = useCallback(() => {
    updateState({ openMasivo: true });
  }, [updateState]);

  const aplicarColor = useCallback((data = []) => {
    const contenedoresCount = data.reduce((acc, item) => {
      const contenedor = item.Contenedor?.contenedor;
      if (contenedor) {
        acc[contenedor] = (acc[contenedor] || 0) + 1;
      }
      return acc;
    }, {});

    const duplicados = Object.keys(contenedoresCount).filter(bl => contenedoresCount[bl] > 1);
    const colorMapping = duplicados.reduce((acc, bl, index) => {
      acc[bl] = COLORES_PASTEL[index % COLORES_PASTEL.length];
      return acc;
    }, {});

    updateState({ bol: colorMapping });
  }, [updateState]);

  const handleChecks = useCallback((index) => {
    const newCheck = [...state.check];
    newCheck[index] = !newCheck[index];
    updateState({
      check: newCheck,
      checkAll: false
    });
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

  const listar = useCallback(async () => {
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

      // Filtros del formulario
      const formData = new FormData(formRef.current);
      const filters = {
        contenedor: formData.get('contenedor') || '',
        booking: formData.get('booking') || '',
        bl: formData.get('BoL') || '',
        destino: formData.get('destino') || '',
        naviera: formData.get('naviera') || '',
        cliente: formData.get('cliente') || '',
        semana: formData.get('semana') || '',
        buque: formData.get('buque') || '',
        fecha_inicial: formData.get('fecha_inicial'),
        fecha_final: formData.get('fecha_final'),
        llenado: formData.get('llenado') || '',
        producto: formData.get('producto') || '',
        habilitado: true
      };

      const listadoList = await paginarListado(state.pagination, state.limit, filters);

      updateState({
        tableData: listadoList.data,
        total: listadoList.total,
        configuracionInsumos: insumosConfig,
        embarques: embarquesRes.data,
        productos: productoRes.data,
        check: new Array(listadoList.data.length).fill(false)
      });

      aplicarColor(listadoList.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos del listado');
    }
  }, [state.pagination, state.limit, user.username, aplicarColor, updateState]);

  // Efecto optimizado
  useEffect(() => {
    listar();
  }, [
    state.openConfigTabla,
    state.openConfigInsumo,
    state.isEditable,
    state.pagination,
    state.limit,
    state.openTransbordar,
    state.openMasivo,
    listar
  ]);

  // Ahora reemplaza todas las referencias en el JSX
  // Por ejemplo, donde antes usabas tableData ahora usa state.tableData
  // Donde usabas setPagination ahora usa updateState({ pagination: valor })

  return (
    <>
      <h2 className="mb-2">{"Listado de Contenedores"}</h2>
      <div className="line"></div>

      {/* Filtros */}
      <Form ref={formRef} className="">
        <Row xs={1} sm={2} md={4} lg={6} className="">

          {/* Semana*/}
          <Col>
            <Form.Group className="mb-0" controlId="semana">
              <Form.Label className='mt-1 mb-1'>Sem</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="semana" onChange={listar} placeholder="Ingrese la semana" />
            </Form.Group>
          </Col>
          {/* Cliente */}
          <Col>
            <Form.Group className="mb-0" controlId="cliente">
              <Form.Label className='mt-1 mb-1'>Cliente</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="cliente" onChange={listar} placeholder="Ingrese Cliente" />
            </Form.Group>
          </Col>
          {/* Booking */}
          <Col>
            <Form.Group className="mb-0" controlId="booking">
              <Form.Label className='mt-1 mb-1'>Booking</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="booking" onChange={listar} placeholder="Ingrese el Booking" />
            </Form.Group>
          </Col>
          {/* Booking */}
          <Col>
            <Form.Group className="mb-0" controlId="BoL">
              <Form.Label className='mt-1 mb-1'>Bill of Loading</Form.Label>
              <Form.Control className='form-control-sm' name='BoL' type="text" onChange={listar} placeholder="Ingrese el BL" />
            </Form.Group>
          </Col>
          {/* Naviera */}
          <Col>
            <Form.Group className="mb-0" controlId="naviera">
              <Form.Label className='mt-1 mb-1'>Naviera</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="naviera" onChange={listar} placeholder="Ingrese la Naviera" />
            </Form.Group>
          </Col>
          {/*Buque*/}
          <Col>
            <Form.Group className="mb-0" controlId="destino">
              <Form.Label className='mt-1 mb-1'>Destino</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="destino" onChange={listar} placeholder="Ingrese el Buque" />
            </Form.Group>
          </Col>
          {/*Llenado*/}
          <Col>
            <Form.Group className="mb-0" controlId="llenado">
              <Form.Label className='mt-1 mb-1'>Llenado</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="llenado" onChange={listar} placeholder="Lugar de Llenado" />
            </Form.Group>
          </Col>
          {/*Contenedor*/}
          <Col>
            <Form.Group className="mb-0" controlId="contenedor">
              <Form.Label className='mt-1 mb-1'>Contenedor</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="contenedor" onChange={listar} placeholder="DUMY0000001" />
            </Form.Group>
          </Col>
          {/*Producto*/}
          <Col>
            <Form.Group className="mb-0" controlId="producto">
              <Form.Label className='mt-1 mb-1'>Producto</Form.Label>
              <Form.Control className='form-control-sm' type="text" name="producto" onChange={listar} placeholder="Ingrese el Producto" />
            </Form.Group>
          </Col>
          {/* Fecha Cargue */}
          <Col>
            <Form.Group className="mb-0" controlId="fecha_inicial">
              <Form.Label className='mt-1 mb-1'>Fecha incial</Form.Label>
              <Form.Control className='form-control-sm' name="fecha_inicial" onChange={listar} type="date" />
            </Form.Group>
          </Col>

          {/* Fecha Descargue */}
          <Col>
            <Form.Group className="mb-0" controlId="fecha_final">
              <Form.Label className='mt-1 mb-1'>Fecha final</Form.Label>
              <Form.Control className='form-control-sm' name='fecha_final' onChange={listar} type="date" />
            </Form.Group>
          </Col>
          <Col>
            <button type='button' onClick={handleExport} className={`btn  mt-30px w-100 btn-sm btn-success`} >
              {'Descargar excel'}
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: "5px 5px",
            padding: "auto",
            height: '25px',
            overflow: 'hidden',
            cursor: "pointer"
          }} className="text-sm">
            Mostrando {state.tableData.length} de {state.total}
          </span>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: "5px 5px",
            padding: "auto",
            width: '25px',
            height: '25px',
            overflow: 'hidden',
            cursor: "pointer"
          }}>
            <Image
              className={styles.imgConfig}
              onClick={handleOpenConfig}
              src={config}
              alt="configuración"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }} />
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

      {/* Tabla */}
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

            {/* Insumos de seguridad */}
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
            const {
              serial_de_articulos: seriales,
              cajas_unidades: cajas,
              combo,
              Contenedor,
              Embarque,
              almacen,
              fecha,
            } = row;

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

                {/* Insumos */}
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
                      onClick={() => {
                        updateState({ openQR: Contenedor });
                      }}>
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
              <button
                type="button"
                onClick={handleConfig}
                className="btn-close"
                aria-label="Close"
              />
            </div>
            <div className="card-body">
              <div className="container">
                <div className="row">
                  <div className="col-12 col-md-6 mb-2">
                    <Button
                      className="w-100"
                      onClick={() => {
                        updateState({ openConfigTabla: true, openConfig: false });
                      }}
                      variant="secondary"
                    >
                      Campos
                    </Button>
                  </div>
                  <div className="col-12 col-md-6">
                    <Button
                      className="w-100"
                      onClick={() => {
                        updateState({ openConfigInsumo: true, openConfig: false });
                      }}
                      variant="secondary"
                    >
                      Insumos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/*Formulario Transbordo*/}
      {state.openTransbordar && <Transbordar setOpen={(open) => updateState({ openTransbordar: open })} />}
      {state.openQR && <CrearQRCode setOpenQR={(open) => updateState({ openQR: open })} contenedor={state.openQR} />}
      {state.openMasivo && <CargarExcel setOpenMasivo={(open) => updateState({ openMasivo: open })}
        titulo={"Contenedores"}
        endPointCargueMasivo={endPoints.listado.create + "/masivo"}
        encabezados={{
          fecha: null,
          bl: null,
          contenedor: null,
          id_lugar_de_llenado: null,
          id_producto: null,
          cajas_unidades: null,
        }}
      />}
    </>
  );
};

export default ListadoContenedores;