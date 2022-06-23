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


export default function Movimientos() {

    const [combos, setCombos] = useState([1]);

    function addCombo() {
        setCombos([...combos, combos.length + 1]);
    }

    return (
        <>
            <Container>

                <h2>Exportación</h2>
                <div className={styles.contenedor1}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Movimiento</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

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
            
                {combos.map((item, key) => (
                    
                    <div  item={item} key={key} className={styles.contenedor2}>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Combo</InputGroup.Text>
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
                ))}

                <div className={styles.contenedor3}>
                    <div>
                        <Button onClick={addCombo} variant="primary" size="sm">
                            Añadir producto
                        </Button>
                    </div>

                    <div>
                        <Button variant="success" size="sm">
                            Exportar
                        </Button>
                    </div>

                </div>
            </Container>
        </>
    );
}