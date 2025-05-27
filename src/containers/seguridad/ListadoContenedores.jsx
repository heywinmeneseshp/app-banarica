import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row, Button } from 'react-bootstrap';
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
import { useAuth } from '@hooks/useAuth';
import * as XLSX from 'xlsx';
import Transbordar from '@assets/Seguridad/Listado/Transbordar';
import CargarExcel from '@assets/Seguridad/Listado/CargueMasivo';
import endPoints from '@services/api';

const ListadoContenedores = () => {
  const { getUser } = useAuth();
  const formRef = useRef();
  const tablaRef = useRef();
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState(1);
  const [limit, setLimit] = useState(50);
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
  const [check, setCheck] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [bol, setBol] = useState({});
  const [openTransbordar, setOpenTransbordar] = useState(false);
  const [openMasivo, setOpenMasivo] = useState(false);
  const user = getUser();
  //const [noVerElimnados, setNoVerEliminados] = useState(true);


  const coloresPastel = [
  "#FFCDD2", // Rosado pastel
  "#F8BBD0", // Rosa
  "#E1BEE7", // Lila
  "#D1C4E9", // Lavanda
  "#C5CAE9", // Azul suave
  "#BBDEFB", // Azul cielo
  "#B3E5FC", // Azul celeste
  "#B2EBF2", // Aguamarina
  "#B2DFDB", // Verde menta
  "#C8E6C9", // Verde suave
  "#DCEDC8", // Verde lima
  "#F0F4C3", // Amarillo pálido
  "#FFF9C4", // Amarillo claro
  "#FFECB3", // Amarillo dorado
  "#FFE0B2", // Durazno
  "#FFCCBC", // Coral pastel
  "#D7CCC8", // Beige tostado
  "#F5F5F5", // Blanco humo
  "#CFD8DC", // Gris azulado (el único gris claro que se ve bien)
  "#FFE082"  // Amarillo pastel fuerte
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
      return;  // Salir de la función después de actualizar las unidades
    }

    // Actualización para otros campos que no requieren validación específica
    await actualizarListado(row.id, { [field]: value });
  };


  const toggleEdit = () => {
    //setTableData([]);
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

  const renderHeader = (name, highlight = false, label = null) => {
  return configuracionTabla.includes(name) && (
    <th className={`text-custom-small text-center ${highlight ? 'text-white bg-secondary' : ''}`}>
      {label || name}
    </th>
  );
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
    inputElement.style.color = "";
  };

  const duplicarLinea = async () => {
    const promises = check.map(async (item, index) => {
      if (item) {
        const object = { ...tableData[index] };
        const idListado = object.id;
        await duplicarListado(idListado);
      }
    });

    // Esperar a que todas las promesas se resuelvan antes de actualizar el límite
    await Promise.all(promises);

    // Actualizar el límite solo después de duplicar todas las líneas
    setLimit((prevLimit) => prevLimit + 1);
  };


  const eliminarLinea = async () => {
    check.map(async (item, index) => {
      if (item) {
        const object = { ...tableData[index] };
        const idListado = object.id;
        actualizarListado(idListado, { habilitado: false });
      }
    });
    setLimit((prevLimit) => prevLimit - 1);
    // Esperar a que todas las promesas se resuelvan antes de actualizar el límite
  };




  const handleTransbordar = async () => {
    setOpenTransbordar(true);
  };

  const handleCargueMasivo = async () => {
    setOpenMasivo(true);
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
    const modulo = await encontrarModulo("Relación_listado_"+user.username);
    const configTabla = localStorage.getItem("ListadoConfig") || `[ "Fecha",
      "Sem", "BoL", "Naviera", "Destino", "Llenado", "Contenedor", "Insumos de segurdad",
      "Producto", "Cajas", "Peso Neto" ]`;
    setConfigTabla(configTabla);
    const consecutivos = JSON.parse(modulo[0]?.detalles).tags;
    console.log(consecutivos);
    console.log(modulo);
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
      habilitado: true
    };
    const listadoList = await paginarListado(pagination, limit, object);
    let almacenList = localStorage.getItem('almacenByUser');
    const boolList = new Array(listadoList.data.length).fill(false);
    setCheck(boolList);
    almacenList = JSON.parse(almacenList);
    setAlmacenes(almacenList);
    setTableData(listadoList.data);
    setTotal(listadoList.total);
    aplicarColor(listadoList.data);
  };

  const handleChecks = (index) => {
    let newListCheck = [...check];
    newListCheck[index] = !newListCheck[index];
    setCheck(newListCheck);
    setCheckAll(false);
  };


 const handleExport = () => {
  const ws = XLSX.utils.table_to_sheet(tablaRef.current);
  const wb = XLSX.utils.book_new();

  // Extraer valores de los inputs manualmente
  const table = tablaRef.current;
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, cellIndex) => {
      const input = cell.querySelector('input');
      if (input) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: cellIndex });
        ws[cellAddress] = { v: input.value, t: 's' };
      }
    });
  });

  // Obtener el rango actual
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Eliminar la primera columna correctamente (copiar todas las demás una posición a la izquierda)
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c + 1; C <= range.e.c; C++) {
      const oldAddr = XLSX.utils.encode_cell({ r: R, c: C });
      const newAddr = XLSX.utils.encode_cell({ r: R, c: C - 1 });
      if (ws[oldAddr]) {
        ws[newAddr] = ws[oldAddr];
      } else {
        delete ws[newAddr]; // Evita celdas vacías innecesarias
      }
    }
  }

  // Ahora eliminamos las celdas originales de la primera columna
  for (let R = range.s.r; R <= range.e.r; R++) {
    const firstColAddr = XLSX.utils.encode_cell({ r: R, c: range.s.c + (range.s.c === 0 ? 0 : 1) });
    delete ws[firstColAddr];
  }

  // Actualizamos el rango
  range.s.c += 1;
  range.e.c -= 1;
  ws['!ref'] = XLSX.utils.encode_range(range);

  XLSX.utils.book_append_sheet(wb, ws, "Listado de Contenedores");
  XLSX.writeFile(wb, "Listado de Contenedores.xlsx");
};





  useEffect(() => {
    listar();
  }, [openConfigTabla, openConfigInsumo, isEditable, pagination, limit, openTransbordar, openMasivo]);

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
            className={`btn btn-sm m-1 ${isEditable ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleEdit}
          >
            {isEditable ? 'Bloquear Edición' : 'Permitir Edición'}
          </button>
        </Col>

        <Col className="d-flex justify-content-end">
          <span style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: "5px 5px",
            padding: "auto",
            height: '25px', // Puedes ajustar la altura según tus necesidades
            overflow: 'hidden',
            cursor: "pointer"
          }} className="text-sm">
            Mostrando {tableData.length} de {total}
          </span>
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
                id="checkboxAll"
                name="checkboxAll"
                checked={checkAll}
                onChange={() => {
                  const newCheck = !checkAll;
                  setCheckAll(newCheck);
                  setCheck(new Array(check.length).fill(newCheck));
                }}
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
            {configuracionTabla.includes("Insumos de segurdad") &&
              configuracionInsumos.map((item, idx) => {
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
          </tr>
        </thead>

        <tbody>
          {tableData.map((row, index) => {
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
            const sumaToriaCajas = tableData
              .filter(item => item.Contenedor?.contenedor === Contenedor?.contenedor)
              .reduce((acc, item) => acc + item.cajas_unidades, 0);

            const existeRechazo = cajasPorContenedor === sumaToriaCajas ? "" : "text-danger";
            return (
              <tr key={row.id}>
                <td className="text-custom-small text-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`check-${index}`}
                    name={`check-${index}`}
                    checked={check[index]}
                    onChange={() => handleChecks(index)}
                  />
                </td>

                {configuracionTabla.includes("Fecha") && (
                  <td className="text-custom-small text-center">
                    {isEditable ? (
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

                {configuracionTabla.includes("Sem") && (
                  <td className="text-custom-small text-center" style={{ width: "70px" }}>
                    {Embarque?.semana?.consecutivo}
                  </td>
                )}

                {configuracionTabla.includes("Bookin") && (
                  <td className="text-custom-small text-center">{Embarque?.booking}</td>
                )}

                {configuracionTabla.includes("BoL") && (
                  <td className="text-custom-small text-center">
                    <input
                      list={`${row.id}-embarques`}
                      id={`${row.id}-embarque`}
                      style={{ width: "100px", padding: 0 }}
                      defaultValue={Embarque?.bl}
                      disabled={!isEditable}
                      onChange={() => onChangeCasilla(`${row.id}-embarque`, 'embarque')}
                      onBlur={() => handleDatalist(`${row.id}-embarque`, 'embarque', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id={`${row.id}-embarques`}>
                      {embarques.map((item, i) => <option key={i} value={item.bl} />)}
                    </datalist>
                  </td>
                )}

                {configuracionTabla.includes("Naviera") && (
                  <td className="text-custom-small text-center">{Embarque?.Naviera?.cod}</td>
                )}
                {configuracionTabla.includes("Buque") && (
                  <td className="text-custom-small text-center">{Embarque?.Buque?.buque}</td>
                )}
                {configuracionTabla.includes("Destino") && (
                  <td className="text-custom-small text-center">{Embarque?.Destino?.cod}</td>
                )}

                {configuracionTabla.includes("Llenado") && (
                  <td className="text-custom-small text-center">
                    <input
                      list={`${row.id}-almacenes`}
                      id={`${row.id}-almacen`}
                      defaultValue={almacen?.nombre}
                      style={{ width: "110px", padding: 0 }}
                      disabled={!isEditable}
                      onBlur={() => handleDatalist(`${row.id}-almacen`, 'almacen', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id={`${row.id}-almacenes`}>
                      {almacenes.map((item, i) => <option key={i} value={item.nombre} />)}
                    </datalist>
                  </td>
                )}

                {configuracionTabla.includes("Contenedor") && (
                  <td
                    className="text-custom-small text-center"
                    style={{ backgroundColor: bol[Contenedor?.contenedor] }}
                    contentEditable={isEditable}
                    onBlur={(e) => handleCellEdit(row, "contenedor", e)}
                  >
                    {Contenedor?.contenedor}
                  </td>
                )}

                {/* Insumos */}
                {configuracionTabla.includes("Insumos de segurdad") &&
                  configuracionInsumos.map((itemConfig, key) => {
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

                {configuracionTabla.includes("Producto") && (
                  <td className="text-custom-small text-center">
                    <input
                      list="productos"
                      id={`${row.id}-producto`}
                      defaultValue={combo?.nombre}
                      disabled={!isEditable}
                      onBlur={() => handleDatalist(`${row.id}-producto`, 'producto', row.id)}
                      className="form-control custom-input"
                    />
                    <datalist id="productos">
                      {productos.map((item, i) => <option key={i} value={item.nombre} />)}
                    </datalist>
                  </td>
                )}

                {configuracionTabla.includes("Cajas") && (
                  <td
                    className={`text-custom-small text-center ${existeRechazo}`}
                    style={{ width: "60px" }}
                    contentEditable={isEditable}
                    onBlur={(e) => handleCellEdit(row, "cajas_unidades", e)}
                  >
                    {cajas}
                  </td>
                )}

                {configuracionTabla.includes("Pallets") && (
                  <td className="text-custom-small text-center">{pallets}</td>
                )}

                {configuracionTabla.includes("Peso Bruto") && (
                  <td className="text-custom-small text-center">{pesoBruto}</td>
                )}

                {configuracionTabla.includes("Peso Neto") && (
                  <td className="text-custom-small text-center">{pesoNeto}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>


      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
      {openConfigInsumo && <InsumoConfig handleConfig={handleConfig} modulo_confi={"Relación_listado_"+user.username } />}
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

              <div className="container">
                <div className="row">
                  <div className="col-12 col-md-6 mb-2">
                    <Button
                      className="w-100"
                      onClick={() => {
                        setOpenConfigTabla(true);
                        setOpenConfig(false);
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
                        setOpenConfigInsumo(true);
                        setOpenConfig(false);
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
      {openTransbordar && <Transbordar setOpen={setOpenTransbordar} />}
      {openMasivo && <CargarExcel setOpenMasivo={setOpenMasivo}

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
