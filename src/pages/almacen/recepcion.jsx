import React from "react";
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

//Components
import SecondLayout from "layout/SecondLayout";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function recepcion() {
  return (
    <>
      <SecondLayout>
        <Container className={styles.contenedorPadre}>

          <h2>+ Recepción</h2>
          <div className={styles.contenedor1}>

            <InputGroup size="sm" className="mb-3">
              <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
              <Form.Control
                aria-label="Small"
                aria-describedby="inputGroup-sizing-sm"
              />
            </InputGroup>

            <InputGroup size="sm" className="mb-3">
              <InputGroup.Text id="inputGroup-sizing-sm">Remisión</InputGroup.Text>
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

          <div className={styles.contenedor3}>
            <div>
              <Button variant="primary" size="sm">
                Añadir producto
              </Button>
            </div>

            <div>
              <Button variant="success" size="sm">
                Cargar productos
              </Button>
            </div>

          </div>
        </Container>
      </SecondLayout>
    </>
  )
}