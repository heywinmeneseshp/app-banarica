import React, { useState, useEffect } from 'react';
//Services
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
//Boostrap
import { Container, Form, InputGroup } from 'react-bootstrap';
//Components
//CSS
import styles from '@styles/NuevoCombo.module.css';
import styles1 from '@styles/Config.module.css';
import { useRef } from 'react';

export default function Configuracion({ setOpen }) {
    const formRef = useRef();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [semana, setSemana] = useState(null);

    useEffect(() => {
        encontrarModulo("Seguridad").then(res => setSecurityCheck(res[0].habilitado));
        encontrarModulo("Semana").then(res => setSemana(res[0]));
    }, []);

    let styleBoton = { color: "success", text: "Guardar configuración" };

    const closeWindow = () => {
        setOpen(false);
    }; 

    function changeSecurity() {
        setSecurityCheck(!securityCheck);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        try {
            actualizarModulo({
                "modulo": "Seguridad",
                "habilitado": securityCheck
            });
            actualizarModulo({
                "modulo": "Semana",
                "semana_actual": formData.get('actual'),
                "semana_siguiente": formData.get('siguiente'),
                "semana_previa": formData.get('anterior'),
                "anho_actual": formData.get('anho_actual')
            });
            setOpen(false);
        } catch (e) {
            setOpen(false);
        }

    };

    return (
        <div>

            <div className={styles.tableros}>
                <div className={styles.padre}>
                    <div className={styles.ex}><span role="button" tabIndex={0} onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit} className={styles.formulario}>


                        <Container className='mt-3 mb-4'>
                            <h6>Configuración</h6>
                            <div className='line'></div>

                            <div className={styles1.input_group}>
                                <span className='mr-3' >Segurdiad:</span>
                                <InputGroup size="sm">
                                    <input onChange={changeSecurity} type="checkbox" name="seguridad" id="seguridad" value={1} checked={securityCheck} />
                                </InputGroup>

                                <span>Semana:</span>
                                <span className={styles1.input_group_semana}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Actual</InputGroup.Text>
                                        <Form.Control
                                            id="actual"
                                            name='actual'
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            className={styles1.input_semana}
                                            type='number'
                                            max={52}
                                            min={0}
                                            defaultValue={semana?.semana_actual}
                                        />
                                    </InputGroup>

                                    <InputGroup size="sm">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Previas</InputGroup.Text>
                                        <Form.Control
                                            id="anterior"
                                            name='anterior'
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            className={styles1.input_semana}
                                            min={0}
                                            max={semana?.semana_actual}
                                            type='number'
                                            defaultValue={semana?.semana_previa}
                                        />
                                    </InputGroup>

                                    <InputGroup size="sm">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Siguientes</InputGroup.Text>
                                        <Form.Control
                                            id="siguiente"
                                            name="siguiente"
                                            aria-label="Small"
                                            className={styles1.input_semana}
                                            aria-describedby="inputGroup-sizing-sm"
                                            type='number'
                                            min={0}
                                            max={52 - semana?.semana_actual}
                                            defaultValue={semana?.semana_siguiente}
                                        />
                                    </InputGroup>

                                </span>

                                <span>Año:</span>
                                <span className={styles1.input_group_semana}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Actual</InputGroup.Text>
                                        <Form.Control
                                            id="anho_actual"
                                            name='anho_actual'
                                            aria-label="Small"
                                            className={styles1.input_semana}
                                            aria-describedby="inputGroup-sizing-sm"
                                            type='number'
                                            min={0}
                                            max={9999}
                                            defaultValue={semana?.anho_actual}
                                        />
                                    </InputGroup>
                                </span>
                            </div>

                        </Container>

                        <div className={styles.contenedor3}>


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