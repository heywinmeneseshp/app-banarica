import React, { useState, useEffect } from 'react';
//Services
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
//Boostrap
import { Container } from 'react-bootstrap';
//Components
//CSS
import styles from '@styles/NuevoCombo.module.css';

export default function Configuracion({ setOpen }) {
    const [securityCheck, setSecurityCheck] = useState(false);

    useEffect(() => {
        encontrarModulo("Seguridad").then(res => setSecurityCheck(res[0].habilitado));
    }, []);



    let styleBoton = { color: "success", text: "Guardar configuración" };

    const closeWindow = () => {
        setOpen(false);
    }; console.log;

    function changeSecurity() {
        setSecurityCheck(!securityCheck);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            actualizarModulo({
                "modulo": "Seguridad",
                "habilitado": securityCheck
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

                    <form onSubmit={handleSubmit} className={styles.formulario}>


                        <Container className='mt-3 mb-4'>
                            <h6>Habilitar módulos</h6>
                            <div className='line'></div>
                            <div className='d-flex aling-items-center'>
                                <span className='m-3 mt-0 mb-0'>Segurdiad:</span>
                                <input onChange={changeSecurity} type="checkbox" name="seguridad" id="seguridad" value={1} checked={securityCheck} />
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