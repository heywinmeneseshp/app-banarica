import { useState } from 'react';
import { Form, Col, Row } from 'react-bootstrap';


const Embarques = () => {
  const [tableData, setTableData] = useState([
    { id: 1, sem: '1', cliente: 'AFC', booking: 'BGA0392389', naviera: 'CMA', destino: 'AMBERES', anuncio: '91418', viaje: '0DRJDN1MA', booking2: 'BGA0392389', buque: 'CMA CGM AMERICA', sae: '6027722675072', fechaCargue: '10/01/2024', fechaDescargue: '26/01/2024' },
    { id: 2, sem: '1', cliente: 'AFC', booking: '64594039', naviera: 'Hapag Lloyd', destino: 'AMBERES', anuncio: '91421', viaje: '401N', booking2: '64594039', buque: '"CAPE ALTIUS"', sae: '6027722675248', fechaCargue: '5/01/2024', fechaDescargue: '23/01/2024' },
    { id: 3, sem: '1', cliente: 'AFC', booking: '66260706', naviera: 'Hapag Lloyd', destino: 'HAMBURGO', anuncio: '91426', viaje: '401N', booking2: '66260706', buque: '"CAPE ALTIUS"', sae: '6027722675334', fechaCargue: '5/01/2024', fechaDescargue: '29/01/2024' },
    { id: 4, sem: '1', cliente: 'AFC', booking: '64594039', naviera: 'Hapag Lloyd', destino: 'AMBERES', anuncio: '91425', viaje: '401N', booking2: '64594039', buque: '"CAPE ALTIUS"', sae: '6027722675144', fechaCargue: '5/01/2024', fechaDescargue: '23/01/2024' },
    { id: 5, sem: '1', cliente: 'AFC', booking: '66260706', naviera: 'Hapag Lloyd', destino: 'HAMBURGO', anuncio: '91427', viaje: '401N', booking2: '66260706', buque: '"CAPE ALTIUS"', sae: '6027722675294', fechaCargue: '5/01/2024', fechaDescargue: '29/01/2024' },
    { id: 6, sem: '1', cliente: 'SIIM', booking: 'BGA0392406', naviera: 'CMA', destino: 'DUNKERQUE', anuncio: '91417', viaje: '0DRJDN1MA', booking2: 'BGA0392406', buque: 'CMA CGM AMERICA', sae: '6027722674991', fechaCargue: '', fechaDescargue: '' },
    { id: 7, sem: '1', cliente: 'HHK', booking: 'SRC220066053', naviera: 'Seatrade', destino: 'VLISSINGEN', anuncio: '91428', viaje: 'AC24001EB', booking2: 'SRC220066053', buque: 'BALTIC KLIPPER', sae: '6027722675373', fechaCargue: '', fechaDescargue: '' },
    { id: 8, sem: '2', cliente: 'AFC', booking: 'BGA0393130', naviera: 'CMA', destino: 'AMBERES', anuncio: '91715', viaje: '0DRJFN1MA', booking2: 'BGA0393130', buque: 'CMA CGM FORT ROYAL', sae: '6027723026601', fechaCargue: '17/01/2024', fechaDescargue: '2/02/2024' },
    { id: 9, sem: '2', cliente: 'AFC', booking: '63595006', naviera: 'Hapag Lloyd', destino: 'AMBERES', anuncio: '91719', viaje: '402N', booking2: '63595006', buque: 'AS PENELOPE', sae: '6027723026619', fechaCargue: '12/01/2024', fechaDescargue: '31/01/2024' },
    { id: 10, sem: '2', cliente: 'AFC', booking: '68595013', naviera: 'Hapag Lloyd', destino: 'HAMBURGO', anuncio: '91722', viaje: '402N', booking2: '68595013', buque: 'AS PENELOPE', sae: '6027723026633', fechaCargue: '12/01/2024', fechaDescargue: '5/02/2024' },
    { id: 11, sem: '2', cliente: 'SIIM', booking: 'BGA0393239', naviera: 'CMA', destino: 'DUNKERQUE', anuncio: '91714', viaje: '0DRJFN1MA', booking2: 'BGA0393239', buque: 'CMA CGM FORT ROYAL', sae: '6027723026586', fechaCargue: '', fechaDescargue: '' },
    { id: 12, sem: '2', cliente: 'HHK', booking: 'SRC220066054', naviera: 'Seatrade', destino: 'VLISSINGEN', anuncio: '91724', viaje: 'AC24002EB', booking2: 'SRC220066054', buque: 'Luzon Strait', sae: '6027723026665', fechaCargue: '', fechaDescargue: '' },
    { id: 13, sem: '2', cliente: 'SIIM', booking: 'SMR230054029', naviera: 'Seatrade', destino: 'VLISSINGEN', anuncio: '91726', viaje: 'AC23049', booking2: 'SMR230054029', buque: 'Luzon Strait', sae: '6027723026681', fechaCargue: '', fechaDescargue: '' },
    { id: 14, sem: '2', cliente: 'AFC', booking: '63595006', naviera: 'Hapag Lloyd', destino: 'AMBERES', anuncio: '91720', viaje: '402N', booking2: '63595006', buque: 'AS PENELOPE', sae: '6027723026626', fechaCargue: '12/01/2024', fechaDescargue: '31/01/2024' }
  ]);



  const [isEditable, setIsEditable] = useState(false);

  const handleCellEdit = (id, field, value) => {
    const updatedData = tableData.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };


  const toggleEdit = () => {
    setIsEditable(!isEditable);
  };

  return (<>
      <h2 className="mb-2">Embarques</h2>
 <div className="line"></div>
    {/* Filtros */}
    <Form className="mb-3">
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
    <Row className="mb-2 mt-4">
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
          <th className="text-custom-small text-center">Sem</th>
          <th className="text-custom-small text-center">Cliente</th>
          <th className="text-custom-small text-center">Booking</th>
          <th className="text-custom-small text-center">Naviera</th>
          <th className="text-custom-small text-center">Destino</th>
          <th className="text-custom-small text-center">Anuncio</th>
          <th className="text-custom-small text-center">Viaje</th>
          <th className="text-custom-small text-center">Buque</th>
          <th className="text-custom-small text-center">SAE</th>
          <th className="text-custom-small text-center">Fecha cargue</th>
          <th className="text-custom-small text-center">Fecha descargue</th>
        </tr>
      </thead>
      <tbody>
        {tableData.map(row => (
          <tr key={row.id}>
            <td className="text-custom-small text-center">{row.id}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "sem", e.target.innerText)}>{row.sem}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "cliente", e.target.innerText)}>{row.cliente}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "booking", e.target.innerText)}>{row.booking}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "naviera", e.target.innerText)}>{row.naviera}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "destino", e.target.innerText)}>{row.destino}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "anuncio", e.target.innerText)}>{row.anuncio}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "viaje", e.target.innerText)}>{row.viaje}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "buque", e.target.innerText)}>{row.buque}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "sae", e.target.innerText)}>{row.sae}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "fechaCargue", e.target.innerText)}>{row.fechaCargue}</td>
            <td className="text-custom-small text-center" contentEditable={isEditable} onBlur={(e) => handleCellEdit(row.id, "fechaDescargue", e.target.innerText)}>{row.fechaDescargue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
  );
};

export default Embarques;
