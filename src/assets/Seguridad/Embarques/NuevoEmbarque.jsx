import React, { useRef, useState, useEffect } from "react";
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from "@components/shared/Formularios/Formularios.module.css";
import { listarNavieras } from "@services/api/navieras";
import { listarClientes } from "@services/api/clientes";
import { listarBuques } from "@services/api/buques";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { listarDestinos } from "@services/api/destinos";

function NuevoEmbarque({ setAlert, element, setOpen, actualizar, crear }) {

    const encabezados = [
        { label: "Sem", field: "id_semana", col: 3, required: true },
        { label: "Cliente", field: "id_cliente", col: 3, required: true },
        { label: "Booking", field: "booking", col: 3, required: true },
        { label: "Bill of Loading", field: "bl", col: 3, required: false },
        { label: "Naviera", field: "id_naviera", col: 3, required: true },
        { label: "Buque", field: "id_buque", col: 3, required: true },
        { label: "Destino", field: "id_destino", col: 3, required: true },
        { label: "Viaje", field: "viaje", col: 3, required: true },
        { label: "Sae", field: "sae", col: 3, required: true },
        { label: "Anuncio", field: "anuncio", col: 3, required: true },
        { label: "Fecha zarpe", field: "fecha_zarpe", col: 3, type: 'date', required: false },
        { label: "Fecha arribo", field: "fecha_arribo", col: 3, type: 'date', required: true },
        { label: "Observaciones", field: "observaciones", col: 12, required: false },
    ];

    const formRef = useRef();
    const [listas, setListas] = useState({});

    const listar = async () => {
        const formData = new FormData(formRef.current);
        const semanas = await filtrarSemanaRangoMes(1,1);
        const naviera = await listarNavieras();
        const destino = await listarDestinos();
        let buques = await listarBuques();
        const cliente = await listarClientes();

        buques = buques.filter(item => item.id_naviera == formData.get('id_naviera'));

        setListas({
            'Sem': semanas.map(item => ({ id: item.id, nombre: item.semana })),
            'Cliente': cliente.map(item => ({ id: item.id, nombre: item.razon_social })),
            'Naviera': naviera.map(item => ({ id: item.id, nombre: item.navieras })),
            'Buque': buques.map(item => ({ id: item.id, nombre: item.buque })),
            'Destino': destino.map(item => ({ id: item.id, nombre: item.destino })),
        });
    };

    useEffect(() => {
        listar();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        let objeto = {};
        let validar = true;

        encabezados.forEach((item) => {
            const value = formData.get(item.field);
            objeto[item.field] = value;
            // Solo validar los campos que son requeridos
            if (item.required && !value) {
                validar = false;
            }
        });

        if (!validar) {
            return alert("Error, todas las casillas requeridas deben estar diligenciadas");
        }

        if (element) {
            const id = objeto.id;
            delete objeto.id;
            actualizar(id, objeto);
        } else {
            objeto["activo"] = true;
            crear(objeto);
        }

        setOpen(false);
        setAlert({
            active: true,
            mensaje: element ? "El item ha sido actualizado con éxito" : "El item ha sido creado con éxito",
            color: "success",
            autoClose: true
        });
    };

    return (
        <div className={styles.fondo}>
            <div className={styles.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">{element == null ? "Nuevo embarque" : "Editar embarque"}</span>
                        <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-12">
                                <Form ref={formRef} onSubmit={handleSubmit}>
                                    <Row>
                                        {encabezados.map((item, key) => (
                                            <Col key={key} md={item.col} >
                                                <Form.Group  className="mb-0" controlId={item.field}>
                                                    <Form.Label className='mt-1 mb-1'>{`${item.label}:`}</Form.Label>
                                                    {!listas[item.label] ? (
                                                        <Form.Control
                                                            type={item.type || "text"}
                                                            name={item.field}
                                                            readOnly={item.readOnly || false}
                                                            size="sm"
                                                        />
                                                    ) : (
                                                        <Form.Control
                                                            as="select"
                                                            name={item.field}
                                                            size="sm"
                                                            defaultValue=""
                                                            onChange={listar}
                                                        >
                                                            <option value=""></option>
                                                            {listas[item.label].map((option, idx) => (
                                                                <option key={idx} value={option.id}>
                                                                    {option.nombre}
                                                                </option>
                                                            ))}
                                                        </Form.Control>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                    <div className="mt-3 d-flex justify-content-end">
                                        <Button type="submit" variant={element ? "warning" : "success"}>
                                            {element ? "Guardar" : "Crear nuevo"}
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NuevoEmbarque;
