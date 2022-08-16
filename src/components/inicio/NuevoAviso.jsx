import React, { useRef } from 'react';

//Components
//Bootstrap
import { Form } from 'react-bootstrap';
//CSS
import styles from '@styles/NuevoAviso.module.css';
import { actualizarAvisos, agregarAviso } from '@services/api/avisos';

export default function NuevaCategoria({ setOpen, item, setAlert }) {
    const formRef = useRef(null);

    let styleBoton = { color: "success", text: "Agregar" };
    if (item) styleBoton = { color: "warning", text: "Editar" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        let data = {
            descripcion: formData.get('descripcion'),
        };
        if (item == null) {
            try {
                agregarAviso(data);
                setOpen(false);
                setAlert({
                    active: true,
                    mensaje: 'El aviso se ha agregado',
                    color: "success",
                    autoClose: true
                });
            } catch (e) {
                setOpen(false);
            }
        } else {
            actualizarAvisos(item.id, data);
            setOpen(false);
            setAlert({
                active: true,
                mensaje: 'El aviso se ha editado',
                color: "success",
                autoClose: true
            });
        }
    };
    return (
        <div>
            <div className={styles.tableros}>
                <div className={styles.padre}>
                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <div className={styles.grupo}>
                            <Form.Group>
                                <Form.Label htmlFor="descripcion">Descripción del aviso</Form.Label>
                                <Form.Control
                                    className={styles.input}
                                    id="descripcion"
                                    name='descripcion'
                                    placeholder="Escriba aquí su aviso..."
                                    defaultValue={item?.descripcion}
                                    />
                            </Form.Group>
                        </div>
                        <div className={styles.grupo}>
                            <br />
                            <div>
                                <button type="submit" className={"btn btn-" + styleBoton.color + " btn-sm form-control form-control-sm"}>{styleBoton.text}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}