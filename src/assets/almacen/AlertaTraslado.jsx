import React from "react";
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

//Components
import SecondLayout from "layout/SecondLayout";

//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function AlertaTraslado() {
  return (
    <>
        <Container className={styles.contenedorPadre}>
          {[
            'warning',
            'warning',
          ].map((variant) => (
            <Alert className={styles.alert} key={variant} variant={variant}>
              <div>Traslado 001 emitido por almacen Villa Grande pendente por recibir</div>
              <button type="button" class="btn btn-success btn-sm">Recibir</button>
            </Alert>
          ))}
        </Container>
    </>
  )
}