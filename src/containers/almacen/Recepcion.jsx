import React from "react";
import { useState } from 'react';

//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import { Alert } from "react-bootstrap";

//Components
import SecondLayout from "layout/SecondLayout";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Recepcion() {

  const [products, setProducts] = useState([1]);

  function addProduct() {
    setProducts([...products, products.length + 1]);
  }

  return (
    <>
        <Container className={styles.contenedorPadre}>

          <Alert className={styles.alert} key="warning" variant="warning">
            <div classNeme={styles.alertText} >Pedido No. <b>001028</b> pendiente por recibir</div>
            <button type="button" className="btn btn-success btn-sm">Ver pedido</button>
          </Alert>

          <h2>+ Recepción de artículos</h2>
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
              <InputGroup.Text id="inputGroup-sizing-sm">Pedido</InputGroup.Text>
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
              <div className={styles.contenedor2} >

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
            <div>
              <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                Añadir producto
              </Button>
            </div>

            <div className={styles.contDosBotones}>
              <Button className={styles.button} variant="warning" size="sm">
                Modificar
              </Button>

              <Button className={styles.button} variant="success" size="sm">
                Cargar productos
              </Button>
            </div>

          </div>
        </Container>
    </>
  );
}