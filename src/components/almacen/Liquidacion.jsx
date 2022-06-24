import React from "react";
import { useState } from "react";

//Boostrap
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';


//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";
import { Container } from "react-bootstrap";


export default function Liquidacion() {

    const [products, setProducts] = useState([1]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    return (
        <>
            <Container>

                <h2>Liquidación</h2>
                <div className={styles.contenedor1}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

                    <Form.Select className={styles.select} size="sm">
                        <option>Deterioro</option>
                        <option>Robo</option>
                        <option>Siniestro</option>
                    </Form.Select>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Fecha</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            type="date"
                            className={styles.fecha}
                        />
                    </InputGroup>

                </div>

                {products.map((item, key) => (
                    <div item={item} key={key}>

                        <div className={styles.contenedor2}>

                            <InputGroup size="sm" className="mb-3">
                                <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                                <Form.Control
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                />
                            </InputGroup>

                            <InputGroup size="sm" className="mb-3">
                                <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                <Form.Control
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                />
                            </InputGroup>

                            <InputGroup size="sm" className="mb-3">
                                <InputGroup.Text id="inputGroup-sizing-sm">Cantidad</InputGroup.Text>
                                <Form.Control
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                />

                            </InputGroup>
                        </div>
                    </div>
                ))}


                <div className={styles.contenedor3}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />

                    </InputGroup>

                </div>

                <div className={styles.contenedor3}>
                    <div>
                        <Button onClick={addProduct} variant="primary" size="sm">
                            Añadir producto
                        </Button>
                    </div>

                    <Button variant="success" size="sm">
                        Liquidar
                    </Button>

                </div>
            </Container>
        </>
    );
}