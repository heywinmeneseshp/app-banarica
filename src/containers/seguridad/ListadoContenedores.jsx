import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row, Button, ButtonGroup } from 'react-bootstrap';
import Image from "next/image";
import config from '@public/images/configuracion.png';
import styles from '@styles/header.module.css';
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import InsumoConfig from '@assets/InsumoConfig';
import ListadoConfig from '@assets/ListadoConfig';
import { encontrarModulo } from '@services/api/configuracion';
import { filtrarProductos } from '@services/api/productos';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarContenedor } from '@services/api/contenedores';
import { paginarCombos } from '@services/api/combos';
import * as XLSX from 'xlsx';
import Transbordar from '@assets/Seguridad/Listado/Transbordar';

const ListadoContenedores = () => {

  const formRef = useRef();
  const tablaRef = useRef();
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState();
  const [configuracionInsumos, setConfigInsumos] = useState([]);
  const [configuracionTabla, setConfigTabla] = useState([]);
  const [openConfig, setOpenConfig] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [embarques, setEmbarques] = useState([]);
  const [openConfigTabla, setOpenConfigTabla] = useState(false);
  const [openConfigInsumo, setOpenConfigInsumo] = useState(false);
  const [productos, setProductos] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [change, setChange] = useState(false);
  const [check, setCheck] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [bol, setBol] = useState({});
  const [openTransbordar, setOpenTransbordar] = useState(false);

  const coloresPastel = [
    "#d4d8d8",  // Oscurecido de #eaeded
    "#e2e5e5",  // Oscurecido de #fbfcfc
    "#e2ccba",  // Oscurecido de #fae5d3
    "#e3daae",  // Oscurecido de #fcf3cf
    "#b9d1c0",  // Oscurecido de #d4efdf
    "#b6d9d1",  // Oscurecido de #d1f2eb
    "#d9a3a3",  // Oscurecido de #f4c2c2 (Pastel Red)
    "#b1b1a8",  // Oscurecido de #cfcfc4 (Pastel Green)
    "#d4a7a8",  // Oscurecido de #f7c6c7 (Pastel Pink)
    "#b4bed1",  // Oscurecido de #d9e3f0 (Pastel Blue)
    "#c8a9da",  // Oscurecido de #e4d0f4 (Pastel Purple)
    "#c4cfb7",  // Oscurecido de #e2e8d3 (Pastel Lime)
    "#d0d0b5",  // Oscurecido de #f4f2d1 (Pastel Yellow)
    "#b4a8c8",  // Oscurecido de #d3c8e5 (Pastel Lavender)
    "#a6d9dc",  // Oscurecido de #d8f2f7 (Pastel Aqua)
    "#c3a8a8",  // Oscurecido de #e2cfcf (Pastel Rose)
    "#d2baa7",  // Oscurecido de #f3e3d3 (Pastel Peach)
    "#c5b5a7",  // Oscurecido de #e4d7d0 (Pastel Apricot)
    "#b4c4c8",  // Oscurecido de #d9e0e4 (Pastel Sky Blue)
    "#c0d9c0"   // Oscurecido de #e6f3e6 (Pastel Mint)
  ];


  const handleCellEdit = async (row, field, e) => {
    const value = e.target.innerText || e.target.value;
  
    // Validación para el campo "contenedor"
    if (field === "contenedor") {
      const regex = /^[A-Za-z]{4}[0-9]{7}$/;
      if (!regex.test(value)) {
        e.target.style.color = "#C70039";
        window.alert('El contenedor debe tener al menos 11 caracteres: 4 letras seguidas de 7 números.');
        return;
      }
      await actualizarContenedor(row.Contenedor.id, { [field]: value });
      e.target.style.color = "";
      setChange(!change);
      return;  // Salir de la función después de actualizar el contenedor
    }
  
    // Validación para el campo "cajas_unidades"
    if (field === "cajas_unidades") {
      if (isNaN(value) || value === '') {
        e.target.style.color = "#C70039";
        window.alert('El campo cajas debe ser un número.');
        return;
      }
      await actualizarListado(row.id, { [field]: parseInt(value, 10) });
      e.target.style.color = "";
      setChange(!change);
      return;  // Salir de la función después de actualizar las unidades
    }
  
    // Actualización para otros campos que no requieren validación específica
    await actualizarListado(row.id, { [field]: value });
    setChange(!change);
  };
  

  const toggleEdit = () => {
    setTableData([]);
    setIsEditable(!isEditable);
  };

  const handleConfig = () => {
    setOpenConfig(false);
    setOpenConfigTabla(false);
    setOpenConfigInsumo(false);
  };

  const handleOpenConfig = () => {
    setOpenConfig(true);
  };

  const onChangeCasilla = async (id, field) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;
    if (field == "embarque") {
      const { data } = await paginarEmbarques(1, 20, { bl: value });
      setEmbarques(data);
    }
    if (field == "producto") {
      const { data } = await paginarCombos(1, 20, value);
      setProductos(data);
    }
  };

  const handleDatalist = async (id, itemActualiza, linea) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (!value) return;
    if (itemActualiza == "almacen") {
      const res = almacenes.find(item => item.nombre == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${linea} el item ${itemActualiza} no existe`);
      };
      await actualizarListado(linea, { id_lugar_de_llenado: res.id });
    };
    if (itemActualiza == "embarque") {
      const res = embarques.find(item => item.bl == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${linea} el item ${itemActualiza} no existe`);
      };
      await actualizarListado(linea, { id_embarque: res.id });
    };
    if (itemActualiza == "producto") {
      const res = productos.find(item => item.nombre == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${linea} el item ${itemActualiza} no existe`);
      };
      await actualizarListado(linea, { id_producto: res.id });
    };
    setChange(!change);
    inputElement.style.color = "";
  };

  const duplicarLinea = async () => {
    check.map(async (item, index) => {
      if (item) {
        const object = { ...tableData[index] };
        const idListado = object.id;
        await duplicarListado(idListado);
        setChange(!change);
        setLimit((limit * 1) + 1);
      }
    });
  };

  const eliminarLinea = async () => {
    check.map(async (item, index) => {
      if (item) {
        const object = { ...tableData[index] };
        const idListado = object.id;
        await actualizarListado(idListado, { habilitado: false });
        setChange(!change);
        setLimit((limit * 1) + 1);
      }
    });
  };

  const handleTransbordar = async () => {
    setOpenTransbordar(true);
  };

  const aplicarColor = (data = []) => {
    const booking = data.map(item => item.Contenedor.contenedor);
    const countOccurrences = booking.reduce((acc, bl) => {
      acc[bl] = (acc[bl] || 0) + 1;
      return acc;
    }, {});
    // Identificar los valores duplicados
    const duplicados = Object.keys(countOccurrences).filter(bl => countOccurrences[bl] > 1);
    // Asignar colores a los valores duplicados
    const colorMapping = {};
    let colorIndex = 0;
    booking.forEach(bl => {
      if (duplicados.includes(bl)) {
        colorMapping[bl] = coloresPastel[colorIndex % coloresPastel.length];
        colorIndex++;
      }
    });
    setBol(colorMapping);
  };

  const listar = async () => {
    const modulo = await encontrarModulo("Relación_listado");
    const configTabla = localStorage.getItem("ListadoConfig") || `[ "Fecha",
      "Sem", "BoL", "Naviera", "Destino", "Llenado", "Contenedor", "Insumos de segurdad",
      "Producto", "Cajas", "Peso Neto" ]`;
    setConfigTabla(configTabla);
    const consecutivos = JSON.parse(modulo[0]?.detalles || "[]");
    if (consecutivos.length > 0) {
      const insumos = await filtrarProductos({ producto: { consecutivo: consecutivos } });
      const result = consecutivos.map(consecutivo => insumos.find(e => e.consecutivo === consecutivo));
      setConfigInsumos(result);
    }
    const embarques = await paginarEmbarques(1, 20, {});
    const producto = await paginarCombos(1, 20, "");
    setProductos(producto.data);
    setEmbarques(embarques.data);
    const formData = new FormData(formRef.current);
    const object = {
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
      habilitado: true,
    };
    const listadoList = await paginarListado(pagination, limit, object);
    let almacenList = localStorage.getItem('almacenByUser');
    const boolList = new Array(listadoList.data.length).fill(false);
    setCheck(boolList);
    almacenList = JSON.parse(almacenList);
    setAlmacenes(almacenList);
    setTableData(listadoList.data);
    setTotal(listadoList.total);
    console.log(listadoList.data);
    aplicarColor(listadoList.data);
  };

  const handleChecks = (index) => {
    let newListCheck = [...check];
    newListCheck[index] = !newListCheck[index];
    setCheck(newListCheck);
    setCheckAll(false);
  };


  const handleExport = () => {
    // Convertir tabla a hoja de cálculo
    const ws = XLSX.utils.table_to_sheet(tablaRef.current);
    const wb = XLSX.utils.book_new();

    // Extraer los valores de los inputs y agregarlos a la hoja de cálculo
    const table = tablaRef.current;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cellIndex) => {
        if (cell.querySelector('input')) {
          const input = cell.querySelector('input');
          ws[XLSX.utils.encode_cell({ r: rowIndex + 1, c: cellIndex })] = { v: input.value, t: 's' }; // 'v' es el valor, 't' es el tipo de datos (string)
        }
      });
    });

    // Eliminar la primera columna
    const range = XLSX.utils.decode_range(ws['!ref']); // Obtener el rango de celdas
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C < range.e.c; C++) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        const newAddress = XLSX.utils.encode_cell({ r: R, c: C - 1 });
        ws[newAddress] = ws[address];
        delete ws[address];
      }
    }
    range.e.c -= 1;
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Añadir la hoja de cálculo al libro y exportar
    XLSX.utils.book_append_sheet(wb, ws, "Listado de Contenedores");
    XLSX.writeFile(wb, "Listado de Contenedores.xlsx");
  };


  useEffect(() => {
    listar();
  }, [openConfigTabla, openConfigInsumo, isEditable, pagination, limit, change, openTransbordar]);

  return (

    <>
      <h2 className="mb-2">{"Listad de Contenedores"}</h2>
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
            className={`btn btn-sm m-1 ${isEditable ? 'btn-success' : 'btn-warning'}`}
            onClick={toggleEdit}
          >
            {isEditable ? 'Guardar Edición' : 'Permitir Edición'}
          </button>
        </Col>

        <Col className="d-flex justify-content-end">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: "5px 5px",
            padding: "auto",
            width: '25px', // Puedes ajustar el ancho según tus necesidades
            height: '25px', // Puedes ajustar la altura según tus necesidades
            overflow: 'hidden',
            cursor: "pointer"
          }}>
            <Image
              className={styles.imgConfig}
              onClick={() => handleOpenConfig()}
              src={config}
              alt="configuración"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain' // Asegura que la imagen se ajuste dentro del contenedor sin distorsionarse
              }} />
          </div>
          <div className="d-flex align-items-center me-1">
            <span className="me-2 ms-2">Limite:</span>
            <Form.Control
              type="number"
              className="form-control-sm"
              defaultValue={limit}
              style={{ maxWidth: "60px" }}
              onChange={e => {
                setLimit(!e.target.value ? 1 : e.target.value);
                setPagination(1);
              }}
              min={1}
            />
          </div>
          <button className="btn btn-sm m-1 btn-primary">
            {'Cargue masivo'}
          </button>
          <button onClick={duplicarLinea} className="btn btn-sm m-1 btn-warning">
            {'Duplicar línea'}
          </button>
          <button onClick={handleTransbordar} className="btn btn-sm m-1 btn-info">
            {'Transbordar'}
          </button>
          <button type="button" onClick={eliminarLinea} className="btn btn-sm m-1 btn-danger">
            {'Eliminar línea'}
          </button>
        </Col>
      </Row>

      {/* Tabla */}
      <table ref={tablaRef} className="table table-striped table-bordered table-sm mt-2">
        <thead>
          <tr>
            {<th className="text-custom-small text-center">
              <input
                className="form-check-input"
                type="checkbox" id={`checkboxAll`}
                name={`checkboxAll`}
                checked={checkAll}
                onChange={() => {
                  const newCheck = !checkAll;
                  setCheckAll(newCheck);
                  setCheck(new Array(check.length).fill(newCheck));
                }}
              ></input>
            </th>}
            {configuracionTabla.includes("Fecha") && <th className="text-custom-small text-center">Fecha</th>}
            {configuracionTabla.includes("Sem") && <th className="text-custom-small text-center text-white bg-secondary">Sem</th>}
            {configuracionTabla.includes("Bookin") && <th className="text-custom-small text-center text-white bg-secondary">Booking</th>}
            {configuracionTabla.includes("BoL") && <th className="text-custom-small text-center">BoL</th>}
            {configuracionTabla.includes("Naviera") && <th className="text-custom-small text-center text-white bg-secondary">Naviera</th>}
            {configuracionTabla.includes("Buque") && <th className="text-custom-small text-center text-white bg-secondary">Buque</th>}
            {configuracionTabla.includes("Destino") && <th className="text-custom-small text-center text-white bg-secondary">Destino</th>}
            {configuracionTabla.includes("Llenado") && <th className="text-custom-small text-center">Llenado</th>}
            {configuracionTabla.includes("Contenedor") && <th className="text-custom-small text-center">Contenedor</th>}
            {/*Kits e insumos*/}
            {configuracionTabla.includes("Insumos de segurdad") && configuracionInsumos.map((item, key) => {
              let title = item.name.charAt(0).toUpperCase() + item.name.toLowerCase().slice(1);
              return (<th className='text-custom-small text-center text-white bg-secondary' key={key}>{title}</th>);
            })}
            {/*Kits e insumos fin*/}
            {configuracionTabla.includes("Producto") && <th className="text-custom-small text-center">Producto</th>}
            {configuracionTabla.includes("Cajas") && <th className="text-custom-small text-center">Cajas</th>}
            {configuracionTabla.includes("Pallets") && <th className="text-custom-small text-center text-white bg-secondary">Pallets</th>}
            {configuracionTabla.includes("Peso Bruto") && <th className="text-custom-small text-center text-white bg-secondary">Peso Bruto</th>}
            {configuracionTabla.includes("Peso Neto") && <th className="text-custom-small text-center text-white bg-secondary">Peso Neto</th>}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => {
            const seriales = row?.serial_de_articulos;
            const cajas = row?.cajas_unidades;
            const cajasPallet = row?.combo?.cajas_por_palet;
            const pallets = Math.ceil(cajas / cajasPallet);
            const pesoBruto = (row?.combo?.peso_bruto * cajas)?.toFixed(1);
            const pesoNeto = (row?.combo?.peso_neto * cajas)?.toFixed(1);





            return (
              <tr key={row.id}>
                <td className="text-custom-small text-center">
                  <input
                    className="form-check-input"
                    type="checkbox" id={`check-${index}`}
                    name={`check-${index}`}
                    checked={check[index]}
                    onChange={() => handleChecks(index)}
                  ></input>

                </td>
                {configuracionTabla.includes("Fecha") && <td className="text-custom-small text-center">
                  {isEditable ? (
                    <input
                      type="date"
                      defaultValue={row?.fecha?.slice(0, 10)}  // Valor por defecto (YYYY-MM-DD)
                      onBlur={(e) => handleCellEdit(row, "fecha", e)}
                      className="date-input custom-input"
                      style={{ width: "90px", padding: "0", boxSizing: "border-box" }}
                    />
                  ) : (
                    row.fecha?.slice(0, 10)  // Mostrar solo la fecha en modo no editable
                  )}
                </td>}
                {configuracionTabla.includes("Sem") && <td style={{ width: "70px", padding: "0", boxSizing: "border-box" }} className="text-custom-small text-center" >{row?.Embarque?.semana?.consecutivo}</td>}
                {configuracionTabla.includes("Booking") && <td className="text-custom-small text-center" >{row?.Embarque?.booking}</td>}
                {configuracionTabla.includes("BoL") && <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-embarques`}
                    style={{ width: "100px", padding: "0", margin: "auto" }}
                    id={`${row.id}-embarque`}
                    defaultValue={row.Embarque?.bl}
                    disabled={!isEditable}
                    onChange={() => onChangeCasilla(`${row.id}-embarque`, 'embarque')}
                    onBlur={() => handleDatalist(`${row.id}-embarque`, `embarque`, row.id)}
                    className="form-control custom-input"
                  />
                  <datalist id={`${row.id}-embarques`}>
                    {embarques.map((item, index) => (
                      <option key={index} value={item.bl} />
                    ))}
                  </datalist>
                </td>}
                {configuracionTabla.includes("Naviera") && <td className="text-custom-small text-center" >{row?.Embarque?.Naviera?.cod}</td>}
                {configuracionTabla.includes("Buque") && <td className="text-custom-small text-center" >{row?.Embarque?.Buque?.buque}</td>}
                {configuracionTabla.includes("Destino") && <td className="text-custom-small text-center" >{row?.Embarque?.Destino?.cod}</td>}
                {configuracionTabla.includes("Llenado") && <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-almacenes`}
                    id={`${row.id}-almacen`}
                    defaultValue={row.almacen?.nombre}
                    style={{ width: "110px", padding: "0", margin: "auto" }}
                    disabled={!isEditable}
                    onBlur={() => handleDatalist(`${row.id}-almacen`, `almacen`, row.id)}
                    className="form-control custom-input"
                  />
                  <datalist id={`${row.id}-almacenes`}>
                    {almacenes.map((item, index) => (
                      <option key={index} value={item.nombre} />
                    ))}
                  </datalist>
                </td>}
                {configuracionTabla.includes("Contenedor") && <td style={{ backgroundColor: `${bol[row?.Contenedor?.contenedor]}` }} className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row, "contenedor", e)}>{row?.Contenedor?.contenedor}</td>}
                {/*Kits e insumos*/}
                {configuracionTabla.includes("Insumos de segurdad") && configuracionInsumos.map((itemConfig, key) => {
                  let serial = seriales.filter(item2 => itemConfig.consecutivo === item2.cons_producto);
                  const latestItem = serial.reduce((latest, current) => {
                    return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
                  }, serial[0]);
                  return (<td className="text-custom-small text-center" key={key}>{latestItem?.serial}</td>);
                })}
                {/*Kits e fin*/}
                {configuracionTabla.includes("Producto") && <td className="text-custom-small text-center">
                  <input
                    list="productos"
                    id={`${row.id}-producto`}
                    disabled={!isEditable}

                    defaultValue={row?.combo?.nombre}
                    onChange={() => onChangeCasilla(`${row.id}-producto`, 'producto')}
                    onBlur={() => handleDatalist(`${row.id}-producto`, `producto`, row.id)}
                    className="form-control custom-input"
                  />
                  <datalist id="productos">
                    {productos.map((item, index) => (
                      <option key={index} value={item.nombre} />
                    ))}
                  </datalist>
                </td>}
                {configuracionTabla.includes("Cajas") && <td style={{ width: "60px", padding: "0", margin: "auto" }} className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row, "cajas_unidades", e)}>{cajas}</td>}
                {configuracionTabla.includes("Pallets") && <td className="text-custom-small text-center" >{pallets}</td>}
                {configuracionTabla.includes("Peso Bruto") && <td className="text-custom-small text-center">{pesoBruto}</td>}
                {configuracionTabla.includes("Peso Neto") && <td className="text-custom-small text-center" >{pesoNeto}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>

      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
      {openConfigInsumo && <InsumoConfig handleConfig={handleConfig} modulo_confi={"Relación_listado"} />}
      {openConfigTabla && <ListadoConfig handleConfig={handleConfig} modulo_confi={"Tabla_listado"} />}

      {openConfig && <div className={styles2.fondo}>
        <div className={styles2.floatingform}>
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <span className="fw-bold">Configuración</span>
              <button
                type="button"
                onClick={handleConfig} // Close or go back
                className="btn-close"
                aria-label="Close"
              />
            </div>
            <div className="card-body">
              <ButtonGroup aria-label="Basic example">
                <Button onClick={() => {
                  setOpenConfigTabla(true);
                  setOpenConfig(false);
                }} variant="secondary">Campos</Button>
                <Button onClick={() => {
                  setOpenConfigInsumo(true);
                  setOpenConfig(false);
                }} variant="secondary">Insumos</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>}

      {/*Formulario Transbordo*/}
      {openTransbordar && <Transbordar setOpen={setOpenTransbordar} />}



    </>
  );
};

export default ListadoContenedores;
