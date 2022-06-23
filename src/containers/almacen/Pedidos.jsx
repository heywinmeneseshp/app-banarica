import React from "react";
import { useState } from 'react';

//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';


//Components
import NuevoAlmacenPedido from "@components/almacen/NuevoAlmacenPedido.jsx";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Pedidos() {

  const [deposits, setDeposits] = useState([1]);


  function addDeposit() {
    setDeposits([...deposits, deposits.length + 1]);
  }

  return (
    <>
        <Container className={styles.contenedorPadre}>

          <h2>+ Crear pedido</h2>

          <div className={styles.contenedor1}>

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

          {deposits.map((item, key) => (
            <NuevoAlmacenPedido item={item} key={key} />
          ))}

          <div className={styles.contenedor3}>
            <div>
              <Button className={styles.button} onClick={addDeposit} variant="info" size="sm">
                Agregar Almacén
              </Button>
            </div>

            <div>
              <Button className={styles.button} variant="success" size="sm">
                Cargar productos
              </Button>
            </div>

          </div>
        </Container>
    </>
  );
}