import React, { useEffect, useRef } from 'react';

//Components

//CSS
import styles from '@styles/admin/etiquetas.module.css';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { actualizarEtiqueta, crearEtiqueta } from '@services/api/etiquetas';

export default function NuevaEtiqueta({ setOpen, etiqueta }) {
    const formRef = useRef(null);

    useEffect(() => {
    }, []);

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const producto = formData.get("producto");
        const gnl = formData.get('gnl');
        const detSup = formData.get('detalle_sup');
        const detInf = formData.get('detalle_inf');
        const ean13 = formData.get('ean13');

        const body = {
            'producto': producto,
            'gnl': gnl,
            'ean13': ean13,
            'detalle_superior': detSup,
            'detalle_inferior': detInf
        };
        console.log(etiqueta);
        if (!etiqueta) {
            await crearEtiqueta(body);
        } else {
            console.log("------");
            await actualizarEtiqueta(etiqueta.id, body);
        }
        closeWindow();
    };
    return (
        <div>
            <div className={styles.tableros}>
                <div className={styles.padre}>
                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={() => closeWindow()} onKeyDown={closeWindow} className={styles.x}>X</span></div>
                    <form ref={formRef} onSubmit={handleSubmit} className={styles.container2}>

                        <InputGroup size="sm" >
                            <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
                            <Form.Control
                                id='producto'
                                name='producto'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={etiqueta ? etiqueta.producto : null}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">EAN13</InputGroup.Text>
                            <Form.Control
                                id='gnl'
                                name='gnl'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={etiqueta ? etiqueta.gnl : null}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">GNL</InputGroup.Text>
                            <Form.Control
                                id='ean13'
                                name='ean13'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={etiqueta ? etiqueta.gnl.substr(0,9) : null}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Detalle superior</InputGroup.Text>
                            <Form.Control
                                id='detalle_sup'
                                name='detalle_sup'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={etiqueta ? etiqueta.detalle_superior : null}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Detallle inferior</InputGroup.Text>
                            <Form.Control
                                id='detalle_inf'
                                name='detalle_inf'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={etiqueta ? etiqueta.detalle_inferior : null}
                            />
                        </InputGroup>



                        <Button type='submit' variant={etiqueta ? "warning" : "success"} size="sm">
                            {etiqueta ? "Editar Etiqueta" : "Crear Etiqueta"}
                        </Button>

                    </form>

                </div>
            </div>
        </div>
    );
}