import React, { useState, useEffect, useRef } from 'react';
// Services
import { actualizarEmpresa, actualizarModulo, encontrarEmpresa, encontrarModulo } from '@services/api/configuracion';
// Bootstrap
import { Container, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from "@hooks/useAuth";
// CSS
import styles from '@styles/NuevoCombo.module.css';
import styles1 from '@styles/Config.module.css';

export default function Configuracion({ setOpen }) {
    const formRef = useRef();
    const { user } = useAuth();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [semana, setSemana] = useState({});
    const [empresa, setEmpresa] = useState({});
    const [usuario, setUsuario] = useState(null);
    const [configUsuario, setConfigUsuario] = useState({});
    const [correosAlerta, setCorreosAlerta] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                const parsedUser = user || {};
                setUsuario(parsedUser);
                const username = parsedUser?.username || "";

                const [
                    [moduloSeguridad = {}],
                    [moduloSemana = {}],
                    empresaData = {},
                    [userConfig = {}],
                    [moduloCorreos = {}],
                ] = await Promise.all([
                    encontrarModulo("Seguridad"),
                    encontrarModulo("Semana"),
                    encontrarEmpresa(),
                    username ? encontrarModulo(username) : Promise.resolve([{}]),
                    encontrarModulo("Correos_alerta"),
                ]);

                setSecurityCheck(Boolean(moduloSeguridad.habilitado));
                console.log(moduloSemana);
                setSemana(moduloSemana);
                setEmpresa(empresaData);
                setConfigUsuario(JSON.parse(userConfig.detalles));
                setCorreosAlerta(moduloCorreos.detalles || "");

            } catch (error) {
                console.error("Error al cargar datos de configuración:", error);
            }
        };

        init();
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

            // Actualizar módulo de semana
            await actualizarModulo({
                modulo: "Correos_alerta_combustible",
                detalles: formData.get('Correos_alerta_combustible'),
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
                                    required
                                >
                                   
                                    <option selected={"Dashboard Contenedores" == configUsuario?.inicio}>Dashboard Contenedores</option>
                                    <option selected={"Dashboard Inspeccionados" == configUsuario?.inicio}>Dashboard Inspeccionados</option>
                                     <option selected={"Dashboard Combustible" == configUsuario?.inicio} >Dashboard Combustible</option>
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
                                        required
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
                                        required
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
                                        required
                                        className={styles1.input_semana}
                                        defaultValue={empresa?.nit || ''}
                                    />
                                </InputGroup>

                                {/* Combustible */}

                                <span>Alerta combustible:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="correos_alerta"
                                        name="correos_alerta"
                                        type="text"
                           
                                        placeholder="usuario@correo.com,usuario2@correo.com,..."
                                        className={styles1.input_semana}
                                        defaultValue={correosAlerta}
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
                                            max={53}
                                            min={0}
                                            required
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
                                            required
                                            max={semana?.semana_actual || 53}
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
                                            required
                                            max={53 - (semana?.semana_actual || 0)}
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
                                        min={2024}
                                        max={2099}
                                        required
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
