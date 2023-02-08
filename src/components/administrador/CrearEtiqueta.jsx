import React, { useEffect } from 'react';
import { useState } from 'react';
import styles from '@styles/admin/etiquetas.module.css';

//Components
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import NuevaEtiqueta from '@components/administrador/NuevaEtiqueta';
import { listarEtiquetas } from '@services/api/etiquetas';

//CSS


export default function CrearEtiqueta() {

    const [etiquetas, setEtiquetas] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        listarEtiquetas().then((res) => setEtiquetas(res));
    }, []);


    return (

        <>
            <div className={styles.container}>

                <InputGroup size="sm" >
                    <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
                    <Form.Control
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                    />
                </InputGroup>

                <InputGroup size="sm">
                    <InputGroup.Text id="inputGroup-sizing-sm">GLN</InputGroup.Text>
                    <Form.Control
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                    />
                </InputGroup>

                <Button onClick={() =>
                    setOpen(true)} variant="primary" size="sm">
                    Nueva Etiqueta
                </Button>

                <Button variant="success" size="sm">
                    Descargar Excel
                </Button>


            </div>


            {open && <NuevaEtiqueta setOpen={setOpen} />}

            <Table className='mt-4' striped bordered hover>
                <thead>
                    <tr>
                        <th >Cod.</th>
                        <th >Producto</th>
                        <th >GNL</th>
                        <th >Detalle superior</th>
                        <th >Detalle inferior</th>
                        <th ></th>
                    </tr>
                </thead>
                <tbody>

                    {etiquetas.map((item, index) => {
                        return (
                            <tr key={index}>
                                <td>{item?.id}</td>
                                <td>{item?.producto}</td>
                                <td>{item?.gnl}</td>
                                <td>{item?.detalle_superior}</td>
                                <td>{item?.detalle_inferior}</td>
                                <td></td>
                            </tr>
                        );
                    })
                    }
                </tbody>
            </Table>
        </>
    );
}