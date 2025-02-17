import Paginacion from '@components/shared/Tablas/Paginacion';
import { paginarRechazos } from '@services/api/rechazos';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import { BsSendCheckFill } from "react-icons/bs";


const Rechazos = () => {

    const formRef = useRef();
    const tablaRef = useRef();
    const [tableData, setTableData] = useState([]);
    const [pagination, setPagination] = useState(1);
    const [limit, setLimit] = useState(100);
    const [total, setTotal] = useState();




    useEffect(() => {
        listar();
    }, []);

    const listar = async () => {

        const formData = new FormData(formRef.current);
        const body = {
            semana: formData.get("semana") || "",
            productor: formData.get("productor") || "",
            contenedor: formData.get("contenedor") || "",
            producto: formData.get("producto") || "",
        };
        const res = await paginarRechazos(pagination, limit, body);
        setLimit(100);
        setTableData(res.data);
        setTotal(res.total);
        console.log(res.data);
    };



    return (

        <>
            <h2 className="mb-2">{"Rechazos"}</h2>
            <div className="line"></div>
            {/* Filtros */}
            <Form ref={formRef} className="">
                <Row xs={1} sm={2} md={4} lg={6} className="">

                    {/* Semana*/}
                    <Col>
                        <Form.Group className="mb-0" controlId="semana">
                            <Form.Label className='mt-1 mb-1'>Sem</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" controlId='semana' name="semana" placeholder="Ingrese la semana" />
                        </Form.Group>
                    </Col>
                    {/* Cliente */}
                    <Col>
                        <Form.Group className="mb-0" controlId="cliente">
                            <Form.Label className='mt-1 mb-1'>Productor</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" controlId='productor' name="productor" placeholder="Ingrese Cliente" />
                        </Form.Group>
                    </Col>

                    {/* Contenedor */}
                    <Col>
                        <Form.Group className="mb-0" controlId="contenedor">
                            <Form.Label className='mt-1 mb-1'>Contenedor</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" controlId='contenedor' name="contenedor" placeholder="DUMY0000001" />
                        </Form.Group>
                    </Col>
                    {/*Producto*/}
                    <Col>
                        <Form.Group className="mb-0" controlId="producto">
                            <Form.Label className='mt-1 mb-1'>Producto</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" controlId="producto" name="producto" placeholder="Ingrese el Producto" />
                        </Form.Group>
                    </Col>

                </Row>
            </Form>


            {/* Tabla */}
            <table ref={tablaRef} className="table table-striped table-bordered table-sm mt-3">
                <thead>
                    <tr>
                        <th className="text-custom-small text-center">Semana</th>
                        <th className="text-custom-small text-center d-none d-md-table-cell">Productor</th>
                        <th className="text-custom-small text-center">Contenedor</th>

                        <th className="text-custom-small text-center">Producto</th>
                        <th className="text-custom-small text-center d-none d-md-table-cell">Pallet</th>
                        <th className="text-custom-small text-center">Cajas</th>
                        <th className="text-custom-small text- d-none d-md-table-cell">Motivo</th>
                        <th className="text-custom-small text- d-none d-md-table-cell"></th>
                    </tr>
                </thead>
                <tbody>

                    {tableData.map((item, key) => {
                        return (
                            <tr key={key}>
                                <td className="text-custom-small text-center">{item?.Contenedor?.Listados[0]?.Embarque?.semana?.consecutivo}</td>
                                <td className="text-custom-small text-center d-none d-md-table-cell">{item?.almacene?.nombre}</td>
                                <td className="text-custom-small text-center d-none d-md-table-cell">{item?.Contenedor?.contenedor}</td>
                                <td className="text-custom-small text-center">{item?.combo?.nombre}</td>
                                <td className="text-custom-small text-center">{item?.serial_palet}</td>
                                <td className="text-custom-small text-center">{item?.cantidad}</td>
                                <td className="text-custom-small text-center d-none d-md-table-cell">{item?.MotivoDeRechazo?.motivo_rechazo}</td>
                                <td className="text-custom-small text-center d-md-table-cell">

                                    {!item?.habilitado && <FaEdit
                                        size={15} // Tamaño del icono
                                        color="#676767" // Color del icono
                                        style={{
                                            cursor: "pointer", // Hace que sea clickeable
                                        }}
                                    />}
                                    {!item?.habilitado && <BsSendCheckFill
                                        size={15} // Tamaño del icono
                                        color="#676767" // Color del icono
                                        style={{
                                            cursor: "pointer", // Hace que sea clickeable
                                            margin: "0 0 0 15px",
                                                   }}
                                    />}

                                </td>
                            </tr>
                        );
                    })}




                </tbody>
            </table>

            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
        </>
    );
};

export default Rechazos;
