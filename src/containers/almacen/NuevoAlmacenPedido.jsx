import React from "react";
import { useState } from 'react';

//Bootstrap
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

//Components

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function NuevoAlmacenPedido() {

  const [products, setProducts] = useState([1]);


  function addProduct() {
    setProducts([...products, products.length + 1]);
  }


  return (
    <>
        <section>
            <div className={styles.line}></div>

            <div className={styles.contenedor5}>

              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-sm">código alamcén</InputGroup.Text>
                <Form.Control
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>

              <Form.Select className={styles.select} size="sm">
                <option>Esperanza</option>
                <option>Lucia</option>
                <option>Pantoja</option>
              </Form.Select>

            </div>
           

            {
            products.map((item, key) => (
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

            <div className={styles.contenedor6}>
              <div>
                <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                  Agregar producto
                </Button>
              </div>
            </div>
          </section>
    </>
  );
}