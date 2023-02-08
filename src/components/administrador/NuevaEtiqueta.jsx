import React, { useRef } from 'react';

//Components

//CSS
import styles from '@styles/admin/etiquetas.module.css';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { crearEtiqueta } from '@services/api/etiquetas';

export default function NuevaEtiqueta({ setOpen, item }) {
    const formRef = useRef(null);

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

        const body = {
            'producto' : producto,
            'gnl': gnl,
            'detalle_superior': detSup,
            'detalle_inferior': detInf
        };

        crearEtiqueta(body);
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
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">GLN</InputGroup.Text>
                            <Form.Control
                                id='gnl'
                                name='gnl'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Detalle superior</InputGroup.Text>
                            <Form.Control
                                id='detalle_sup'
                                name='detalle_sup'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Detallle inferior</InputGroup.Text>
                            <Form.Control
                                id='detalle_inf'
                                name='detalle_inf'
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                            />
                        </InputGroup>



                        <Button type='submit' variant={item ? "warning" : "success"} size="sm">
                            {item ? "Editar Etiqueta" : "Crear Etiqueta"}
                        </Button>

                    </form>

                </div>
            </div>
        </div>
    );
}