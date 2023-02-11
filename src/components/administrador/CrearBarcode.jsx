import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import styles from '@styles/admin/etiquetas.module.css';

//Services
import endPoints from '@services/api';

//Hooks
import useBarcodes from "@hooks/useBarcodes";

//Components
import { Button, Form, InputGroup, Table } from 'react-bootstrap';
import { listarAlmacenes } from '@services/api/almacenes';
import { listarEtiquetas } from '@services/api/etiquetas';

import Barcode from 'react-barcode';


//CSS


export default function CrearBardcode() {

    const formRef = useRef();
    const { generarSCC18 } = useBarcodes();

    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductor] = useState([]);
    const [codigos, setCodigos] = useState([]);

    useEffect(() => {
        listarAlmacenes().then((res) => setAlmacenes(res));
        listarEtiquetas().then((res) => setProductor(res));
    }, []);

    const generarCodigos = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const id_producto = formData.get('producto');
        let inicial = formData.get('inicial');
        let final = formData.get('final');
        const ibm = formData.get('almacen');
        let producto = productos.find((item) => item.id == id_producto);
        producto = { ...producto, inicial, final, ibm };
        const resCodigos = generarSCC18(producto, inicial, final, ibm);
        console.log(resCodigos);
        setCodigos(resCodigos);
    };


    const descargarBarcodes = async () => {
        const formData = new FormData(formRef.current);
        const id_producto = formData.get('producto');
        let inicial = formData.get('inicial');
        let final = formData.get('final');
        const ibm = formData.get('almacen');
        let producto = productos.find((item) => item.id == id_producto);
        producto = { ...producto, inicial, final, ibm };
        localStorage.setItem("productCODES", JSON.stringify(producto));
        const resCodigos = generarSCC18(producto, inicial, final, ibm);
        setCodigos(resCodigos);
        window.open(endPoints.document.barcodes);
    };


    const barcode = (codigo) => {
        return <Barcode value={codigo} format="CODE128C" ean128={true}
            height={20}
            displayValue={false}
        />;
    };
    return (
        <>
            <form ref={formRef} onSubmit={generarCodigos} className={styles.container}>

                <InputGroup size="sm" >
                    <InputGroup.Text id="inputGroup-sizing-sm">Productor</InputGroup.Text>
                    <Form.Select size="sm"
                        id='almacen'
                        name='almacen'
                    >
                        {almacenes.map((item, index) => {
                            return (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            );
                        })}
                    </Form.Select>
                </InputGroup>

                <InputGroup size="sm" >
                    <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
                    <Form.Select size="sm"
                        id='producto'
                        name='producto'
                    >
                        {productos.map((item, index) => {
                            return (
                                <option key={index} value={item.id}>{item.producto}</option>
                            );
                        })}
                    </Form.Select>
                </InputGroup>

                <InputGroup size="sm">
                    <InputGroup.Text id="inputGroup-sizing-sm">Etiqueta inicial</InputGroup.Text>
                    <Form.Control
                        min={0}
                        max={9999}
                        type="number"
                        id='inicial'
                        name='inicial'
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                        required
                    />
                </InputGroup>

                <InputGroup size="sm" >
                    <InputGroup.Text id="inputGroup-sizing-sm">Etiqueta final</InputGroup.Text>
                    <Form.Control
                        min={0}
                        max={9999}
                        type="number"
                        id='final'
                        name='final'
                        aria-label="Small"
                        aria-describedby="inputGroup-sizing-sm"
                        required
                    />
                </InputGroup>

                <Button type="submit" variant='success' size="sm">
                    Generar codigos
                </Button>

                <Button onClick={() => descargarBarcodes()} variant='warning' size="sm">
                    Descargar barcodes
                </Button>
            </form>

            <div className='mt-4'>
                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Almacén</th>
                            <th>Codigo</th>
                            <th>Barcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {codigos.map((codigo, index) => {
                            return (
                                <tr key={index}>
                                    <td>{index}</td>
                                    <td>{codigo.slice(-8, -5)}</td>
                                    <td>{codigo}</td>
                                    <td>
                                        {barcode(codigo)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </>
    );
}