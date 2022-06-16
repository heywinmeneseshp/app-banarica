import React from "react";
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

//Components
import SecondLayout from "@layout/SecondLayout";


//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";


export default function traslado() {
  return (
    <>
      <SecondLayout>
        <Container className={styles.contenedor} >

         

            <div className={styles.contenedor1}>

              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-sm">Almacen</InputGroup.Text>
                <Form.Control
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>

              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-sm">Categoría</InputGroup.Text>
                <Form.Control
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>

              <InputGroup size="sm" className="mb-3">
                <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
                <Form.Control
                  aria-label="Small"
                  aria-describedby="inputGroup-sizing-sm"
                  className={styles.fecha}
                />
              </InputGroup>

            </div>

         
   


          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Almacen</th>
                <th>Código</th>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Unidades</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
              </tr>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
              </tr>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
              </tr>
            </tbody>
          </Table>
        </Container>
      </SecondLayout>
    </>
  )
}

