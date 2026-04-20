import React, { useState, useEffect, useRef } from 'react';
// Services
import { actualizarEmpresa, actualizarModulo, encontrarEmpresa, encontrarModulo } from '@services/api/configuracion';
import { runPasswordPolicy } from '@services/api/auth';
// Bootstrap
import { Container, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from "@hooks/useAuth";
import useAlert from '@hooks/useAlert';
// CSS
import styles from '@styles/NuevoCombo.module.css';
import styles1 from '@styles/Config.module.css';

export default function Configuracion({ setOpen }) {
    const formRef = useRef();
    const { user } = useAuth();
    const { setAlert } = useAlert();
    const [securityCheck, setSecurityCheck] = useState(false);
    const [semana, setSemana] = useState({});
    const [empresa, setEmpresa] = useState({});
    const [usuario, setUsuario] = useState(null);
    const [configUsuario, setConfigUsuario] = useState({});
    const [correosAlerta, setCorreosAlerta] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para inputs controlados
    const [razonSocial, setRazonSocial] = useState("");
    const [nombreComercial, setNombreComercial] = useState("");
    const [nit, setNit] = useState("");
    const [pantalla_inicio, setPantalla_inicio] = useState("");
    const [semana_actual, setSemana_actual] = useState("");
    const [semana_siguiente, setSemana_siguiente] = useState("");
    const [semana_previa, setSemana_previa] = useState("");
    const [anho_actual, setAnho_actual] = useState("");
    const [fechaInicioSemana1, setFechaInicioSemana1] = useState("");
    const [totalSemanasAnho, setTotalSemanasAnho] = useState("");
    const [isRunningPasswordPolicy, setIsRunningPasswordPolicy] = useState(false);
    const [passwordPolicyResult, setPasswordPolicyResult] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const parsedUser = user || {};
                setUsuario(parsedUser);
                const username = parsedUser?.username || "";

                console.log('Cargando configuración para usuario:', username);

                // Usar Promise.allSettled para no fallar si una API falla
                const results = await Promise.allSettled([
                    encontrarModulo("Seguridad"),
                    encontrarModulo("Semana"),
                    encontrarEmpresa(),
                    username ? encontrarModulo(username) : Promise.resolve([{}]),
                    encontrarModulo("Correos_alerta"),
                ]);

                // Procesar resultados
                const [segResult, semResult, empResult, userResult, corrResult] = results;

                let moduloSeguridad = {};
                let moduloSemana = {};
                let empresaData = {};
                let userConfig = {};
                let moduloCorreos = {};

                // Seguridad
                if (segResult.status === 'fulfilled') {
                    [moduloSeguridad = {}] = segResult.value || [];
                    console.log('✓ Seguridad cargada');
                } else {
                    console.warn('✗ No se pudo cargar Seguridad:', segResult.reason?.message);
                }

                // Semana
                if (semResult.status === 'fulfilled') {
                    [moduloSemana = {}] = semResult.value || [];
                    console.log('✓ Semana cargada');
                } else {
                    console.warn('✗ No se pudo cargar Semana:', semResult.reason?.message);
                }

                // Empresa
                if (empResult.status === 'fulfilled') {
                    empresaData = empResult.value || {};
                    console.log('✓ Empresa cargada');
                } else {
                    console.warn('✗ No se pudo cargar Empresa:', empResult.reason?.message);
                }

                // Config Usuario
                if (userResult.status === 'fulfilled') {
                    [userConfig = {}] = userResult.value || [];
                    console.log('✓ Config Usuario cargada');
                } else {
                    console.warn('✗ No se pudo cargar Config Usuario:', userResult.reason?.message);
                }

                // Correos
                if (corrResult.status === 'fulfilled') {
                    [moduloCorreos = {}] = corrResult.value || [];
                    console.log('✓ Correos cargados:', moduloCorreos);
                    console.log('   - detalles:', moduloCorreos.detalles);
                    console.log('   - email_reporte:', moduloCorreos.email_reporte);
                } else {
                    console.warn('✗ No se pudo cargar Correos:', corrResult.reason?.message);
                }

                setSecurityCheck(Boolean(moduloSeguridad.habilitado));
                setSemana(moduloSemana || {});
                setEmpresa(empresaData || {});
                
                // Validar y parsear configuración del usuario
                if (userConfig && userConfig.detalles) {
                    try {
                        setConfigUsuario(JSON.parse(userConfig.detalles) || {});
                    } catch (parseError) {
                        console.warn('Error al parsear configuración del usuario:', parseError);
                        setConfigUsuario({});
                    }
                } else {
                    setConfigUsuario({});
                }
                
                // Validar correos de alerta - puede venir en detalles o email_reporte
                let correosFinal = "";
                if (moduloCorreos.detalles) {
                    correosFinal = moduloCorreos.detalles;
                } else if (moduloCorreos.email_reporte) {
                    correosFinal = moduloCorreos.email_reporte;
                }
                setCorreosAlerta(correosFinal);
                console.log('Correos finales cargados:', correosFinal);

            } catch (error) {
                console.error("Error inesperado al cargar datos de configuración:", error);
            }
        };

        init();
    }, [user]);

    // Sincronizar estados con los datos cargados
    useEffect(() => {
        console.log('Sincronizando estados. Empresa:', empresa, 'Semana:', semana, 'Config Usuario:', configUsuario, 'Correos:', correosAlerta);
        setRazonSocial(empresa?.razonSocial || "");
        setNombreComercial(empresa?.nombreComercial || "");
        setNit(empresa?.nit || "");
        setPantalla_inicio(configUsuario?.inicio || "Dashboard Contenedores");
        setSemana_actual(semana?.semana_actual || "");
        setSemana_siguiente(semana?.semana_siguiente || "");
        setSemana_previa(semana?.semana_previa || "");
        setAnho_actual(semana?.anho_actual || "");
        setFechaInicioSemana1(semana?.fecha_inicio_semana_1 || "");
        setTotalSemanasAnho(semana?.total_semanas_anho || 52);
        setCorreosAlerta(correosAlerta || "");
        console.log('Estados sincronizados');
    }, [empresa, semana, configUsuario, correosAlerta]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Actualizar módulo de seguridad
            const segRes = await actualizarModulo({
                modulo: "Seguridad",
                habilitado: securityCheck,
            });
            if (!segRes) throw new Error('Error al actualizar Seguridad');

            // Actualizar módulo de semana
            const semRes = await actualizarModulo({
                modulo: "Semana",
                semana_siguiente: semana_siguiente,
                semana_previa: semana_previa,
                anho_actual: anho_actual,
                fecha_inicio_semana_1: fechaInicioSemana1,
                total_semanas_anho: totalSemanasAnho,
            });
            if (!semRes) throw new Error('Error al actualizar Semana');

            // Actualizar correos de alerta
            const corrRes = await actualizarModulo({
                modulo: "Correos_alerta",
                detalles: correosAlerta,
            });
            if (!corrRes) throw new Error('Error al actualizar Correos de alerta');

            // Actualizar datos de la empresa
            const empRes = await actualizarEmpresa({
                razonSocial: razonSocial,
                nombreComercial: nombreComercial,
                nit: nit,
            });
            if (!empRes) throw new Error('Error al actualizar datos de empresa');

            // Configuración del usuario
            if (usuario) {
                const configUser = JSON.stringify({ ...configUsuario, inicio: pantalla_inicio });
                const userRes = await actualizarModulo({
                    modulo: usuario.username,
                    detalles: configUser,
                });
                if (!userRes) throw new Error('Error al actualizar configuración del usuario');
            }

            // Éxito
            setAlert('Configuración guardada correctamente', 'success');
            setIsLoading(false);
            setOpen(false);
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            setAlert(error.message || 'Error al guardar la configuración', 'danger');
            setIsLoading(false);
        }
    };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleRunPasswordPolicy = async () => {
        try {
            setIsRunningPasswordPolicy(true);
            setPasswordPolicyResult(null);

            const response = await runPasswordPolicy();
            const summary = response?.data || {};

            setPasswordPolicyResult(summary);
            setAlert(
                `Politica ejecutada. Revisados: ${summary.reviewed || 0}, recordatorios: ${
                    summary.reminded || 0
                }, bloqueados: ${summary.blocked || 0}`,
                'success',
            );
        } catch (error) {
            setAlert(
                error?.response?.data?.message ||
                    'No fue posible ejecutar la politica de contrasenas',
                'danger',
            );
        } finally {
            setIsRunningPasswordPolicy(false);
        }
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
                                    value={pantalla_inicio}
                                    onChange={(e) => setPantalla_inicio(e.target.value)}
                                    required
                                >
                                   
                                    <option value="Dashboard Contenedores">Dashboard Contenedores</option>
                                    <option value="Dashboard Inspeccionados">Dashboard Inspeccionados</option>
                                     <option value="Dashboard Combustible">Dashboard Combustible</option>
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
                                        value={razonSocial}
                                        onChange={(e) => setRazonSocial(e.target.value)}
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
                                        value={nombreComercial}
                                        onChange={(e) => setNombreComercial(e.target.value)}
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
                                        value={nit}
                                        onChange={(e) => setNit(e.target.value)}
                                    />
                                </InputGroup>

                                {/* Combustible */}

                                <span>Alerta combustible:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="Correos_alerta"
                                        name="Correos_alerta"
                                        type="text"
                           
                                        placeholder="usuario@correo.com,usuario2@correo.com,..."
                                        className={styles1.input_semana}
                                        value={correosAlerta}
                                        onChange={(e) => setCorreosAlerta(e.target.value)}
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
                                            value={semana_actual}
                                            readOnly
                                            disabled
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
                                            max={Number(totalSemanasAnho) || 53}
                                            value={semana_previa}
                                            onChange={(e) => setSemana_previa(e.target.value)}
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
                                            max={Number(totalSemanasAnho) || 53}
                                            value={semana_siguiente}
                                            onChange={(e) => setSemana_siguiente(e.target.value)}
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
                                        value={anho_actual}
                                        onChange={(e) => setAnho_actual(e.target.value)}
                                    />
                                </InputGroup>

                                <span>Lunes sem. 1:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="fecha_inicio_semana_1"
                                        name="fecha_inicio_semana_1"
                                        type="date"
                                        required
                                        value={fechaInicioSemana1}
                                        onChange={(e) => setFechaInicioSemana1(e.target.value)}
                                    />
                                </InputGroup>

                                <span>Total semanas:</span>
                                <InputGroup size="sm">
                                    <Form.Control
                                        id="total_semanas_anho"
                                        name="total_semanas_anho"
                                        type="number"
                                        min={52}
                                        max={53}
                                        required
                                        value={totalSemanasAnho}
                                        onChange={(e) => setTotalSemanasAnho(e.target.value)}
                                    />
                                </InputGroup>

                                <span>Politica clave:</span>
                                <div className="d-flex flex-column gap-2 align-items-start">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        disabled={isRunningPasswordPolicy}
                                        onClick={handleRunPasswordPolicy}
                                    >
                                        {isRunningPasswordPolicy
                                            ? 'Ejecutando revision...'
                                            : 'Ejecutar revision de contrasenas'}
                                    </button>

                                    {passwordPolicyResult && (
                                        <div className="d-flex flex-wrap gap-3 small text-muted">
                                            <span>Revisados: {passwordPolicyResult.reviewed || 0}</span>
                                            <span>
                                                Recordatorios: {passwordPolicyResult.reminded || 0}
                                            </span>
                                            <span>Bloqueados: {passwordPolicyResult.blocked || 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Container>

                    <div className={styles.contenedor3}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`btn btn-success btn-sm form-control`}>
                            {isLoading ? 'Guardando...' : 'Guardar configuración'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
