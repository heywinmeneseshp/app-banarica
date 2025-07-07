import { useEffect, useRef, useState, useCallback } from 'react';
import { Form, Col, Row, Button } from 'react-bootstrap';
import excel from "@hooks/useExcel";
import useAlert from '@hooks/useAlert';
import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarEmbarques, crearEmbarques, paginarEmbarques } from '@services/api/embarques';
import { encontrarModulo } from '@services/api/configuracion';
import NuevoEmbarque from '@assets/Seguridad/Embarques/NuevoEmbarque';
import Alertas from '@assets/Alertas';
import { listarBuques } from '@services/api/buques';
import { listarNavieras } from '@services/api/navieras';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { listarClientes } from '@services/api/clientes';
import { listarDestinos } from '@services/api/destinos';
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import endPoints from '@services/api';

const inputs = [
  { id: 'semana', label: 'Semana', type: 'text', placeholder: 'Ingrese Sem' },
  { id: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Ingrese Cliente' },
  { id: 'booking', label: 'Booking', type: 'text', placeholder: 'Ingrese Booking' },
  { id: 'bl', label: 'Bill of Loading', type: 'text', placeholder: 'Ingrese Booking' },
  { id: 'naviera', label: 'Naviera', type: 'text', placeholder: 'Ingrese Naviera' },
  { id: 'destino', label: 'Destino', type: 'text', placeholder: 'Ingrese Destino' },
  { id: 'anuncio', label: 'Anuncio', type: 'text', placeholder: 'Ingrese Anuncio' },
  { id: 'viaje', label: 'Viaje', type: 'text', placeholder: 'Ingrese Viaje' },
  { id: 'buque', label: 'Buque', type: 'text', placeholder: 'Ingrese Buque' },
  { id: 'sae', label: 'SAE', type: 'text', placeholder: 'Ingrese SAE' }
];

const ListadoEmbarques = () => {
  const limitRef = useRef();
  const { alert, setAlert, toogleAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [semana, setSemana] = useState();
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(20);
  const [pagination, setPagination] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isEditable, setIsEditable] = useState(false);
  const [buques, setBuques] = useState([]);
  const [navieras, setNavieras] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [clientes, setCliente] = useState([]);
  const [semanas, setSemanas] = useState();
  const [cargueMasivo, setCargueMasivo] = useState(false);


  const handleCellEdit = async (id, field, value) => {
    setTableData(prevData => prevData.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
    await actualizarEmbarques(id, { [field]: value });
  };


  const handleDatalist = async (id, itemActualiza, embarque) => {
    const inputElement = document.getElementById(id);
    const value = inputElement.value;
    if (value == null || "" || undefined) return;
    if (itemActualiza == "buque") {
      const res = buques.find(item => item.buque == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${embarque} el item ${itemActualiza} no existe`);
      };
      await actualizarEmbarques(embarque, { id_buque: res.id });
    };
    if (itemActualiza == "naviera") {
      const res = navieras.find(item => item.navieras == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${embarque} el item ${itemActualiza} no existe`);
      };
      await actualizarEmbarques(embarque, { id_naviera: res.id });
    };
    if (itemActualiza == "semana") {
      const res = semanas.find(item => item.consecutivo == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${embarque} el item ${itemActualiza} no existe`);
      };
      await actualizarEmbarques(embarque, { id_semana: res.id });
    };
    if (itemActualiza == "cliente") {
      const res = clientes.find(item => item.cod == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${embarque} el item ${itemActualiza} no existe`);
      };
      await actualizarEmbarques(embarque, { id_cliente: res.id });
    };
    if (itemActualiza == "destino") {
      const res = destinos.find(item => item.cod == value);
      if (!res) {
        inputElement.style.color = "#C70039";
        return window.alert(`En la fila ${embarque} el item ${itemActualiza} no existe`);
      };
      await actualizarEmbarques(embarque, { id_destino: res.id });
    };
    inputElement.style.color = "";
  };


  const fetchInitialData = async () => {
    try {
      const [
        buquesList,
        navierasList,
        semanasList,
        clientesList,
        destinosList
      ] = await Promise.all([
        listarBuques(),
        listarNavieras(),
        filtrarSemanaRangoMes(1, 1),
        listarClientes(),
        listarDestinos()
      ]);

      setBuques(buquesList);
      setNavieras(navierasList);
      setSemanas(semanasList);
      setCliente(clientesList);
      setDestinos(destinosList);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Considera una estrategia de manejo de errores más específica o una UI de error
      alert('Ocurrió un error al cargar los datos iniciales. Por favor, inténtelo de nuevo.');
      // Puedes manejar el error de otras maneras según tu caso de uso
      // Ejemplo: enviar el error a un servicio de monitoreo
    }
  };


  const listar = useCallback(async () => {

    const dataObject = inputs.reduce((acc, field) => {
      const inputElement = document.getElementById(field.id);
      acc[field.id] = inputElement?.value || '';
      console.log(acc[field.id]);
      return acc;
    }, {});
    try {
      console.log(pagination, limit, dataObject);
      const { data, total } = await paginarEmbarques(pagination, limit, dataObject);
      setTableData(data);
      setTotal(total);
      console.log(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optionally, set state to indicate an error occurred
    }
  }, [pagination, limit, alert]);

  const toggleEdit = () => {
    setTableData([]);
    listar();
    setIsEditable(!isEditable);
  };

  const changesLimit = () => {
    if (limitRef.current.value) setLimit(limitRef.current.value);
    setPagination(1);
  };

  function decargarPlantilla() {
    const data = {
      "id_semana": null,
      "id_cliente": null,
      "booking": null,
      "bl": null,
      "id_naviera": null,
      "id_buque": null,
      "id_destino": null,
      "viaje": null,
      "sae": null,
      "anuncio": null,
    };
    excel([data], "Plantilla", "Plantilla de cargue");
  }

  useEffect(() => {
    const iniciar = async () => {
      await fetchInitialData();
      await listar();
      encontrarModulo("Semana").then(res => setSemana(res[0]?.semana_actual));
    };
    iniciar();
  }, [limit, pagination, alert]);


  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />

      <Form className="mb-3">
        <Row xs={1} sm={2} md={4} lg={6}>
          {inputs.map((field, index) => (
            <Col key={index}>
              <Form.Group className="mb-0" >
                <Form.Label className='mt-1 mb-1'>{field.label}</Form.Label>
                <Form.Control className='form-control-sm' type={field.type} id={field.id} onChange={listar} placeholder={field.placeholder} />
              </Form.Group>
            </Col>
          ))}
          <Col>
            <Button className="btn btn-sm btn-success w-100 mt-30px">
              {'Descargar excel'}
            </Button>
          </Col>
          <Col>
            <Button onClick={decargarPlantilla} className="btn btn-sm btn-warning w-100 mt-30px">
              {'Planilla de Cargue'}
            </Button>
          </Col>
        </Row>
      </Form>

      <Row className="mb-2 mt-4 g-2">
        <Col xs={12} sm={6} md={isEditable ? 4 : 2}>
          <Button
            className={`btn btn-sm ${isEditable ? 'btn-success' : 'btn-warning'} m-auto`}
            onClick={async () => await toggleEdit()}
          >
            {isEditable ? 'Guardar Edición' : 'Permitir Edición'}
          </Button>
        </Col>
        <Col xs={12} sm={6} md={isEditable ? 4 : 6} className="d-flex justify-content-end align-items-center mt-2">
          <div className="d-flex align-items-center mt-auto">
            <span className="me-2">Limite:</span>
            <Form.Control
              type="number"
              className="form-control-sm"
              defaultValue={limit}
              ref={limitRef}
              onChange={changesLimit}
              style={{ maxWidth: "60px" }}
              min={1}
            />
          </div>
        </Col>
        <Col xs={12} sm={6} md={2} className="text-end">
          <Button onClick={() => setOpen(true)} className="btn btn-primary btn-sm w-100 m-auto">
            {'Nuevo embarque'}
          </Button>
        </Col>
        <Col xs={12} sm={6} md={2} className="text-end">
          <Button onClick={() => setCargueMasivo(true)} className="btn btn-primary btn-sm w-100 m-auto">
            {'Cargue masivo'}
          </Button>
        </Col>
      </Row>

      <table className="table table-striped table-bordered table-sm mt-2">
        <thead>
          <tr>
            <th className="text-custom-small text-center">ID</th>
            <th className="text-custom-small text-center">Sem</th>
            <th className="text-custom-small text-center">Cliente</th>
            <th className="text-custom-small text-center">Booking</th>
            <th className="text-custom-small text-center">BL</th>
            <th className="text-custom-small text-center">Naviera</th>
            <th className="text-custom-small text-center">Buque</th>
            <th className="text-custom-small text-center">Destino</th>
            <th className="text-custom-small text-center">Viaje</th>
            <th className="text-custom-small text-center">Sae</th>
            <th className="text-custom-small text-center">Anuncio</th>
            <th className="text-custom-small text-center">Fecha cargue</th>
            <th className="text-custom-small text-center">Fecha descargue</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => {
            return (
              <tr key={row.id}>
                <td className="text-custom-small text-center">{row.id}</td>
                <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-semana1`}
                    name={`${row.id}-semana`}
                    id={`${row.id}-semana`}
                    disabled={!isEditable}
                    style={{ width: "60px", margin: "auto" }}
                    defaultValue={row?.semana?.consecutivo}  // Valor por defecto
                    onBlur={() => handleDatalist(`${row.id}-semana`, `semana`, row.id)}
                    className="custom-input"
                  />
                  <datalist id={`${row.id}-semana1`}>
                    {semanas.map((item, index) => {

                      return (
                        <option key={index} value={item.consecutivo}>
                          {item.consecutivo}
                        </option>
                      );
                    })}
                  </datalist>
                </td>
                <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-cliente1`}
                    name={`${row.id}-cliente`}
                    id={`${row.id}-cliente`}
                    disabled={!isEditable}
                    style={{ width: "50px", margin: "auto" }}
                    defaultValue={row?.cliente?.cod}  // Valor por defecto
                    onBlur={() => handleDatalist(`${row.id}-cliente`, `cliente`, row.id)}
                    className="form-control custom-select custom-input"
                  />
                  <datalist id={`${row.id}-cliente1`}>
                    {clientes.map((item, index) => {
                      return (
                        <option key={index} value={item.cod}>
                          {item.cod}
                        </option>
                      );
                    })}
                  </datalist>
                </td>
                <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "booking", e.target.innerText)}>{row?.booking}</td>
                <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "bl", e.target.innerText)}>{row?.bl}</td>
                <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-naviera1`}
                    name={`${row.id}-naviera`}
                    id={`${row.id}-naviera`}
                    disabled={!isEditable}
                    defaultValue={row?.Naviera?.navieras}  // Valor por defecto
                    onBlur={() => handleDatalist(`${row.id}-naviera`, `naviera`, row.id)}
                    className="form-control custom-input"
                  />
                  <datalist id={`${row.id}-naviera1`}>
                    {navieras.map((item, index) => {
                      return (
                        <option key={index} value={item.navieras}>
                          {item.navieras}
                        </option>
                      );
                    })}
                  </datalist>
                </td>
                <td className="text-custom-small text-center">
                  <input
                    list={`${row.id}-buque1`}
                    name={`${row.id}-buque`}
                    id={`${row.id}-buque`}
                    disabled={!isEditable}
                    defaultValue={row?.Buque?.buque}  // Valor por defecto
                    onBlur={() => handleDatalist(`${row.id}-buque`, `buque`, row.id)}
                    className="form-control custom-input"
                  />
                  <datalist id={`${row.id}-buque1`}>
                    {buques.map((item, index) => {
                      if (item.id_naviera == row.id_naviera) return (
                        <option key={index} value={item.buque}>
                          {item.buque}
                        </option>
                      );
                    })}
                  </datalist>
                </td>
                <td className="text-custom-small text-center" >
                  <input
                    list={`${row.id}-destino1`}
                    name={`${row.id}-destino`}
                    id={`${row.id}-destino`}
                    disabled={!isEditable}
                  
                    defaultValue={row?.Destino?.cod}  // Valor por defecto
                    onBlur={() => handleDatalist(`${row.id}-destino`, `destino`, row.id)}
                    className="form-control custom-input"
                    style={{ width: "50px", margin: "auto" }}
                  />
                  <datalist id={`${row.id}-destino1`}>
                    {destinos.map((item, index) => {
                      return (
                        <option key={index} value={item.cod}>
                          {item.cod}
                        </option>
                      );
                    })}
                  </datalist>
                </td>
                <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "viaje", e.target.innerText)}>{row?.viaje}</td>
                <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "sae", e.target.innerText)}>{row?.sae}</td>
                <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "anuncio", e.target.innerText)}>{row?.anuncio}</td>
                <td className="text-custom-small text-center">
                  {isEditable ? (
                    <input
                      type="date"
                      defaultValue={row?.fecha_zarpe?.slice(0, 10)}  // Valor por defecto (YYYY-MM-DD)
                      onBlur={(e) => handleCellEdit(row.id, "fecha_zarpe", e.target.value)}
                      className="date-input custom-input"
                      style={{ width: "auto", padding: "0", boxSizing: "border-box" }}
                    />
                  ) : (
                    row?.fecha_zarpe?.slice(0, 10)  // Mostrar solo la fecha en modo no editable
                  )}
                </td>
                <td className="text-custom-small text-center">
                  {isEditable ? (
                    <input
                      type="date"
                      defaultValue={row?.fecha_arribo?.slice(0, 10)}  // Valor por defecto (YYYY-MM-DD)
                      onBlur={(e) => handleCellEdit(row.id, "fecha_arribo", e.target.value)}
                      className="date-input custom-input"
                      style={{ width: "auto", padding: "0", boxSizing: "border-box" }}
                    />
                  ) : (
                    row?.fecha_arribo?.slice(0, 10)  // Mostrar solo la fecha en modo no editable
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />

      {cargueMasivo && <CargueMasivo setOpenMasivo={setCargueMasivo}
        titulo={"Embarques"}
        endPointCargueMasivo={endPoints.Embarques.create + "/masivo"}
        encabezados={{
          id_semana: null,
          id_cliente: null,
          id_naviera: null,
          id_buque: null,
          viaje: null,
          id_destino: null,
          booking: null,
          bl: null,
          anuncio: null,
          sae: null,
          habilitado: null,
        }}
      />}
      {open &&
        <NuevoEmbarque
          crear={crearEmbarques}
          //listas={listas}
          actualizar={actualizarEmbarques}
          setOpen={setOpen}
          setAlert={setAlert}
          element={null}
          semana={semana}
          encabezados={{
            "Id": "id",
            "Sem": "id_semana",
            "Cliente": "id_cliente",
            "Booking": "booking",
            "Naviera": "id_naviera",
            "Buque": "id_buque",
            "Bill of Loading": "bl",
            "Fecha zarpe": "fecha_zarpe",
            "Fecha arribo": "fecha_arribo	",
            "Observaciones": "observaciones	",
          }}
        />}
    </>
  );
};

export default ListadoEmbarques;
