import React, { useState, useEffect, useRef } from 'react';
// Services
import { actualizarEmpresa, actualizarModulo, encontrarEmpresa, encontrarModulo } from '@services/api/configuracion';
// Bootstrap
import { Container, Form, InputGroup } from 'react-bootstrap';
// CSS
import styles from '@styles/NuevoCombo.module.css';
import styles1 from '@styles/Config.module.css';

export default function Configuracion({ setOpen }) {
    const formRef = useRef();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [semana, setSemana] = useState({});
    const [empresa, setEmpresa] = useState({});
    const [usuario, setUsuario] = useState(null);
    const [configUsuario, setConfigUsuario] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('usuario');
        var username = null;
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUsuario(parsedUser);
                username = parsedUser.username;
            } catch (error) {
                console.error('Error al parsear usuario desde localStorage:', error);
            }
        }

        // Cargar configuraciones desde API
        Promise.all([
            encontrarModulo("Seguridad"),
            encontrarModulo("Semana"),
            encontrarEmpresa(),
            encontrarModulo(username),
        ]).then(([moduloSeguridad, moduloSemana, empresaData, userConfig]) => {
            setSecurityCheck(moduloSeguridad[0]?.habilitado || false);
            setSemana(moduloSemana[0] || {});
            setEmpresa(empresaData || {});
            setConfigUsuario(JSON.parse(userConfig[0].detalles) || {});
        }).catch(error => {
            console.error('Error al cargar datos de configuración:', error);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);

        try {
            // Actualizar módulo de seguridad
            await actualizarModulo({
                modulo: "Seguridad",
                habilitado: securityCheck,
            });

            // Actualizar módulo de semana
            await actualizarModulo({
                modulo: "Semana",
                semana_actual: formData.get('actual'),
                semana_siguiente: formData.get('siguiente'),
                semana_previa: formData.get('anterior'),
                anho_actual: formData.get('anho_actual'),
            });

            // Actualizar datos de la empresa
            await actualizarEmpresa({
                razonSocial: formData.get('razon_social'),
                nombreComercial: formData.get('nombre_comercial'),
                nit: formData.get('nit'),
            });

            // Configuración del usuario
            const configUser = JSON.stringify({ ...configUsuario, inicio: formData.get('pantalla_inicio') });
            if (usuario) {
                await actualizarModulo({
                    modulo: usuario.username,
                    detalles: configUser,
                });
            }

            // Cerrar ventana
            setOpen(false);
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            setOpen(false);
        }
    };

    const closeWindow = () => {
        setOpen(false);
    };

    const changeSecurity = () => {
        setSecurityCheck(prevState => !prevState);
    };

    const isSuperAdmin = usuario?.id_rol === "Super administrador";

    return (
        <div className={styles.tableros}>
            <div className={styles.padre}>
                <div className={styles.ex}>
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={closeWindow}
                        onKeyDown={closeWindow}
                        className={styles.x}>
                        X
                    </span>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className={styles.formulario}>
                    <Container className="mt-3 mb-4">
                        <h6>Configuración</h6>
                        <div className="line"></div>

                        {/* Pantalla de inicio */}
                        <div className={styles1.input_group}>
                            <span>Pantalla de inicio:</span>
                            <InputGroup className="mb-3" size="sm">
                                <Form.Select
                                    name="pantalla_inicio"
                                    id="pantalla_inicio"
                               
                                >
                                    <option selected={"Dashboard Combustible" == configUsuario?.inicio} >Dashboard Combustible</option>
                                    <option selected={"Dashboard Contenedores" == configUsuario?.inicio}>Dashboard Contenedores</option>
                                </Form.Select>
                            </InputGroup>
                        </div>

                        {/* Configuraciones específicas del Super Administrador */}
                        {isSuperAdmin && (
                            <div className={styles1.input_group}>
                                {/* Razón Social */}
                                <span>Razón Social:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="razon_social"
                                        name="razon_social"
                                        type="text"
                                        className={styles1.input_semana}
                                        defaultValue={empresa?.razonSocial || ''}
                                    />
                                </InputGroup>

                                {/* Nombre Comercial */}
                                <span>Nombre Comercial:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="nombre_comercial"
                                        name="nombre_comercial"
                                        type="text"
                                        className={styles1.input_semana}
                                        defaultValue={empresa?.nombreComercial || ''}
                                    />
                                </InputGroup>

                                {/* NIT */}
                                <span>NIT:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="nit"
                                        name="nit"
                                        type="text"
                                        className={styles1.input_semana}
                                        defaultValue={empresa?.nit || ''}
                                    />
                                </InputGroup>

                                {/* Seguridad */}
                                <span>Seguridad:</span>
                                <InputGroup size="sm">
                                    <input
                                        type="checkbox"
                                        name="seguridad"
                                        id="seguridad"
                                        checked={securityCheck}
                                        onChange={changeSecurity}
                                    />
                                </InputGroup>

                                {/* Configuración de semana */}
                                <span>Semana:</span>
                                <div className={styles1.input_group_semana}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text>Actual</InputGroup.Text>
                                        <Form.Control
                                            id="actual"
                                            name="actual"
                                            type="number"
                                            max={52}
                                            min={0}
                                            defaultValue={semana?.semana_actual || ''}
                                        />
                                    </InputGroup>

                                    <InputGroup size="sm">
                                        <InputGroup.Text>Previas</InputGroup.Text>
                                        <Form.Control
                                            id="anterior"
                                            name="anterior"
                                            type="number"
                                            min={0}
                                            max={semana?.semana_actual || 52}
                                            defaultValue={semana?.semana_previa || ''}
                                        />
                                    </InputGroup>

                                    <InputGroup size="sm">
                                        <InputGroup.Text>Siguientes</InputGroup.Text>
                                        <Form.Control
                                            id="siguiente"
                                            name="siguiente"
                                            type="number"
                                            min={0}
                                            max={52 - (semana?.semana_actual || 0)}
                                            defaultValue={semana?.semana_siguiente || ''}
                                        />
                                    </InputGroup>
                                </div>

                                {/* Año actual */}
                                <span>Año:</span>
                                <InputGroup size="sm">
                                    <InputGroup.Text>Actual</InputGroup.Text>
                                    <Form.Control
                                        id="anho_actual"
                                        name="anho_actual"
                                        type="number"
                                        min={0}
                                        max={9999}
                                        defaultValue={semana?.anho_actual || ''}
                                    />
                                </InputGroup>
                            </div>
                        )}
                    </Container>

                    <div className={styles.contenedor3}>
                        <button
                            type="submit"
                            className={`btn btn-success btn-sm form-control`}>
                            Guardar configuración
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
