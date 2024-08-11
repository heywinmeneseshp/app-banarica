import { useState } from 'react';
import { Form, Col, Row } from 'react-bootstrap';

const ListadoContenedores = () => {
  const [tableData, setTableData] = useState([
    { id: 1, fecha: '', sem: '', booking: '', destino: '', finca: '', contenedor: 'Item 1', botella: '', termografo: '', producto: 'Producto A', cajas: '', pallets: '', pesoBruto: '', pesoNeto: '' },
    { id: 2, fecha: '', sem: '', booking: '', destino: '', finca: '', contenedor: 'Item 2', botella: '', termografo: '', producto: 'Producto B', cajas: '', pallets: '', pesoBruto: '', pesoNeto: '' },
    // Agrega más filas según sea necesario
  ]);

  const [isEditable, setIsEditable] = useState(false);

  const productos = [
    { name: 'Producto A' },
    { name: 'Producto B' },
    { name: 'Producto C' },
    // Agrega más productos según sea necesario
  ];

  const fincas = [
    'Finca 1',
    'Finca 2',
    'Finca 3',
    // Agrega más fincas según sea necesario
  ];

  const bookings = [
    'Booking 1',
    'Booking 2',
    'Booking 3',
    // Agrega más bookings según sea necesario
  ];

  const handleCellEdit = (id, field, value) => {
    const updatedData = tableData.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  const handleInputChange = (id, field, event) => {
    const value = event.target.value;
    handleCellEdit(id, field, value);
  };

  const toggleEdit = () => {
    setIsEditable(!isEditable);
  };

  return (

    <>
      {/* Filtros */}
      <Form className="">
        <Row xs={1} sm={2} md={4} lg={6} className="">

          {/* Sem */}
          <Col>
            <Form.Group className="mb-0" controlId="sem">
              <Form.Label className='mt-2 mb-1'>Sem</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Sem" />
            </Form.Group>
          </Col>

          {/* Cliente */}
          <Col>
            <Form.Group className="mb-0" controlId="cliente">
              <Form.Label className='mt-2 mb-1'>Cliente</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Cliente" />
            </Form.Group>
          </Col>

          {/* Booking */}
          <Col>
            <Form.Group className="mb-0" controlId="booking">
              <Form.Label className='mt-2 mb-1'>Booking</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Booking" />
            </Form.Group>
          </Col>

          {/* Naviera */}
          <Col>
            <Form.Group className="mb-0" controlId="naviera">
              <Form.Label className='mt-2 mb-1'>Naviera</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Naviera" />
            </Form.Group>
          </Col>

          {/* Destino */}
          <Col>
            <Form.Group className="mb-0" controlId="destino">
              <Form.Label className='mt-2 mb-1'>Destino</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Destino" />
            </Form.Group>
          </Col>

          {/* Anuncio */}
          <Col>
            <Form.Group className="mb-0" controlId="anuncio">
              <Form.Label className='mt-2 mb-1'>Anuncio</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Anuncio" />
            </Form.Group>
          </Col>

          {/* Viaje */}
          <Col>
            <Form.Group className="mb-0" controlId="viaje">
              <Form.Label className='mt-2 mb-1'>Viaje</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Viaje" />
            </Form.Group>
          </Col>

          {/* Buque */}
          <Col>
            <Form.Group className="mb-0" controlId="buque">
              <Form.Label className='mt-2 mb-1'>Buque</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese Buque" />
            </Form.Group>
          </Col>

          {/* SAE */}
          <Col>
            <Form.Group className="mb-0" controlId="sae">
              <Form.Label className='mt-2 mb-1'>SAE</Form.Label>
              <Form.Control className='form-control-sm' type="text" placeholder="Ingrese SAE" />
            </Form.Group>
          </Col>

          {/* Fecha Cargue */}
          <Col>
            <Form.Group className="mb-0" controlId="fechaCargue">
              <Form.Label className='mt-2 mb-1'>Fecha Cargue</Form.Label>
              <Form.Control className='form-control-sm' type="date" />
            </Form.Group>
          </Col>

          {/* Fecha Descargue */}
          <Col>
            <Form.Group className="mb-0" controlId="fechaDescargue">
              <Form.Label className='mt-2 mb-1'>Fecha Descargue</Form.Label>
              <Form.Control className='form-control-sm' type="date" />
            </Form.Group>
          </Col>


          <Col>
            <button className={`btn  mt-30px w-100 btn-sm btn-success`} >
              {'Descargar excel'}
            </button>

          </Col>
        </Row>
      </Form>


      {/* Botones de Control */}
      <Row className="mb-2 mt-3">
        <Col className="d-flex justify-content-start">
          <button
            className={`btn btn-sm m-1 ${isEditable ? 'btn-danger' : 'btn-warning'}`}
            onClick={toggleEdit}
          >
            {isEditable ? 'Bloquear Edición' : 'Permitir Edición'}
          </button>

          {isEditable && (
            <button className="btn btn-sm m-1 btn-success">
              {'Guardar Edición'}
            </button>
          )}
        </Col>

        <Col className="d-flex justify-content-end">
          <button className="btn btn-sm m-1 btn-primary">
            {'Nuevo embarque'}
          </button>

          <button className="btn btn-sm m-1 btn-primary">
            {'Cargue masivo'}
          </button>
        </Col>
      </Row>

      {/* Tabla */}
      <table className="table table-striped table-bordered table-sm">
        <thead>
          <tr>
            <th className="text-custom-small text-center">ID</th>
            <th className="text-custom-small text-center">Fecha</th>
            <th className="text-custom-small text-center">Sem</th>
            <th className="text-custom-small text-center">Booking</th>
            <th className="text-custom-small text-center">Destino</th>
            <th className="text-custom-small text-center">Finca</th>
            <th className="text-custom-small text-center">Contenedor</th>
            <th className="text-custom-small text-center">Botella</th>
            <th className="text-custom-small text-center">Termografo</th>
            <th className="text-custom-small text-center">Producto</th>
            <th className="text-custom-small text-center">Cajas</th>
            <th className="text-custom-small text-center">Pallets</th>
            <th className="text-custom-small text-center">Peso Bruto</th>
            <th className="text-custom-small text-center">Peso Neto</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map(row => (
            <tr key={row.id}>
              <td className="text-custom-small text-center">{row.id}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "fecha", e.target.innerText)}>{row.fecha}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "sem", e.target.innerText)}>{row.sem}</td>
              <td className="text-custom-small text-center">
                <input
                  list="bookings"
                  value={row.booking}
                  disabled={!isEditable}
                  onChange={(e) => handleInputChange(row.id, "booking", e)}
                  className="form-control custom-input"
                />
                <datalist id="bookings">
                  {bookings.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "destino", e.target.innerText)}>{row.destino}</td>
              <td className="text-custom-small text-center">
                <input
                  list="fincas"
                  value={row.finca}
                  disabled={!isEditable}
                  onChange={(e) => handleInputChange(row.id, "finca", e)}
                  className="form-control custom-input"
                />
                <datalist id="fincas">
                  {fincas.map((item, index) => (
                    <option key={index} value={item} />
                  ))}
                </datalist>
              </td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "contenedor", e.target.innerText)}>{row.contenedor}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "botella", e.target.innerText)}>{row.botella}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "termografo", e.target.innerText)}>{row.termografo}</td>
              <td className="text-custom-small text-center">
                <input
                  list="productos"
                  value={row.producto}
                  disabled={!isEditable}
                  onChange={(e) => handleInputChange(row.id, "producto", e)}
                  className="form-control custom-input"
                />
                <datalist id="productos">
                  {productos.map((item, index) => (
                    <option key={index} value={item.name} />
                  ))}
                </datalist>
              </td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "cajas", e.target.innerText)}>{row.cajas}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "pallets", e.target.innerText)}>{row.pallets}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "pesoBruto", e.target.innerText)}>{row.pesoBruto}</td>
              <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "pesoNeto", e.target.innerText)}>{row.pesoNeto}</td>
            </tr>
          ))}
        </tbody>
      </table>


    </>
  );
};

export default ListadoContenedores;
