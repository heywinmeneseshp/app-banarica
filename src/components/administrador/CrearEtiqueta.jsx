import React, { useEffect } from 'react';
import { useState } from 'react';
import editarPick from '@public/images/editar.png';


//Components
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import NuevaEtiqueta from '@components/administrador/NuevaEtiqueta';
import { listarEtiquetas } from '@services/api/etiquetas';

//CSS
import styles from '@styles/admin/etiquetas.module.css';
import styles2 from '@styles/informes/informes.module.css';
import Image from 'next/image';

export default function CrearEtiqueta() {

    const [etiquetas, setEtiquetas] = useState([]);
    const [etiqueta, setEtiqueta] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        listarEtiquetas().then((res) => setEtiquetas(res));
    }, [open]);

    function editarEtiqueta(item) {
        setEtiqueta(item);
        setOpen(true);
    }

    function nuevaEtiqueta () {
        setEtiqueta(null);
        setOpen(true);
    }

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

                <InputGroup size="sm">
                    <InputGroup.Text id="inputGroup-sizing-sm">EAN13</InputGroup.Text>
                    <Form.Control
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                    />
                </InputGroup>

                <Button onClick={() =>
                    nuevaEtiqueta()} variant="primary" size="sm">
                    Nueva Etiqueta
                </Button>

                <Button variant="success" size="sm">
                    Descargar Excel
                </Button>


            </div>


            {open && <NuevaEtiqueta setOpen={setOpen} etiqueta={etiqueta} />}

            <Table className='mt-4' striped bordered hover>
                <thead>
                    <tr>
                        <th >Cod.</th>
                        <th >Producto</th>
                        <th >GNL</th>
                        <th >EAN13</th>
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
                                <td>{item?.ean13}</td>
                                <td>{item?.detalle_superior}</td>
                                <td>{item?.detalle_inferior}</td>
                                <td>
                                    <span>
                                        <Image onClick={() => editarEtiqueta(item)} className={styles2.imagenEditar} width="20" height="20" src={editarPick} alt="editar" />
                                    </span>
                                </td>
                            </tr>
                        );
                    })
                    }
                </tbody>
            </Table>
        </>
    );
}