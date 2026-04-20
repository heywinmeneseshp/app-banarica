import React, { useState, useEffect, useRef } from 'react';
// Services
import {
    actualizarEmpresa,
    actualizarModulo,
    encontrarEmpresa,
    encontrarModulo,
    encontrarEmailConfig,
    actualizarEmailConfig
} from '@services/api/configuracion';
import { runPasswordPolicy } from '@services/api/auth';
// Bootstrap
import { Container, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from "@hooks/useAuth";
import useAlert from '@hooks/useAlert';
// CSS
import styles from '@styles/NuevoCombo.module.css';
import styles1 from '@styles/Config.module.css';

const DEFAULT_EMAIL_FORM = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    email_correo: '',
    password_correo: '',
    email_from_name: 'Bana Rica'
};

const normalizarFechaInput = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        if (value.includes('T')) {
            return value.slice(0, 10);
        }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 10);
};

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

    // Email config states
    const [emailConfigRaw, setEmailConfigRaw] = useState({});
    const [emailFormData, setEmailFormData] = useState(DEFAULT_EMAIL_FORM);
    const [showEmailPassword, setShowEmailPassword] = useState(false);

    const normalizarEmailConfig = (data = {}) => ({
        ...DEFAULT_EMAIL_FORM,
        ...data,
        smtp_port: parseInt(data.smtp_port, 10) || DEFAULT_EMAIL_FORM.smtp_port,
        smtp_secure:
            typeof data.smtp_secure === 'boolean'
                ? data.smtp_secure
                : data.smtp_secure !== 'false' && data.smtp_secure !== false,
    });

    useEffect(() => {
        const init = async () => {
            try {
                const parsedUser = user || {};
                setUsuario(parsedUser);
                const username = parsedUser?.username || "";

                console.log('Cargando configuracion para usuario:', username);

                const results = await Promise.allSettled([
                    encontrarModulo("Seguridad"),
                    encontrarModulo("Semana"),
                    encontrarEmpresa(),
                    username ? encontrarModulo(username) : Promise.resolve([{}]),
                    encontrarModulo("Correos_alerta"),
                    encontrarEmailConfig(),
                ]);

                const [segResult, semResult, empResult, userResult, corrResult, emailResult] =
                    results;

                let moduloSeguridad = {};
                let moduloSemana = {};
                let empresaData = {};
                let userConfig = {};
                let moduloCorreos = {};
                let emailConfigData = {};

                if (segResult.status === 'fulfilled') {
                    [moduloSeguridad = {}] = segResult.value || [];
                } else {
                    console.warn('No se pudo cargar Seguridad:', segResult.reason?.message);
                }

                if (semResult.status === 'fulfilled') {
                    [moduloSemana = {}] = semResult.value || [];
                } else {
                    console.warn('No se pudo cargar Semana:', semResult.reason?.message);
                }

                if (empResult.status === 'fulfilled') {
                    empresaData = empResult.value || {};
                } else {
                    console.warn('No se pudo cargar Empresa:', empResult.reason?.message);
                }

                if (userResult.status === 'fulfilled') {
                    [userConfig = {}] = userResult.value || [];
                } else {
                    console.warn('No se pudo cargar Config Usuario:', userResult.reason?.message);
                }

                if (corrResult.status === 'fulfilled') {
                    [moduloCorreos = {}] = corrResult.value || [];
                } else {
                    console.warn('No se pudo cargar Correos:', corrResult.reason?.message);
                }

                if (emailResult.status === 'fulfilled') {
                    [emailConfigData = {}] = emailResult.value || [];
                } else {
                    console.warn('No se pudo cargar Email config:', emailResult.reason?.message);
                }

                setSecurityCheck(Boolean(moduloSeguridad.habilitado));
                setEmailConfigRaw(emailConfigData || {});
                setSemana(moduloSemana || {});
                setEmpresa(empresaData || {});

                if (userConfig?.detalles) {
                    try {
                        setConfigUsuario(JSON.parse(userConfig.detalles) || {});
                    } catch (parseError) {
                        console.warn('Error al parsear configuracion del usuario:', parseError);
                        setConfigUsuario({});
                    }
                } else {
                    setConfigUsuario({});
                }

                let correosFinal = "";
                if (moduloCorreos.detalles) {
                    correosFinal = moduloCorreos.detalles;
                } else if (moduloCorreos.email_reporte) {
                    correosFinal = moduloCorreos.email_reporte;
                }
                setCorreosAlerta(correosFinal);
            } catch (error) {
                console.error("Error inesperado al cargar datos de configuracion:", error);
            }
        };

        init();
    }, [user]);

    useEffect(() => {
        setRazonSocial(empresa?.razonSocial || "");
        setNombreComercial(empresa?.nombreComercial || "");
        setNit(empresa?.nit || "");
        setPantalla_inicio(configUsuario?.inicio || "Dashboard Contenedores");
        setSemana_actual(semana?.semana_actual || "");
        setSemana_siguiente(semana?.semana_siguiente || "");
        setSemana_previa(semana?.semana_previa || "");
        setAnho_actual(semana?.anho_actual || "");
        setFechaInicioSemana1(normalizarFechaInput(semana?.fecha_inicio_semana_1));
        setTotalSemanasAnho(semana?.total_semanas_anho || 52);
        setCorreosAlerta(correosAlerta || "");
    }, [empresa, semana, configUsuario, correosAlerta]);

    useEffect(() => {
        setEmailFormData(normalizarEmailConfig(emailConfigRaw));
    }, [emailConfigRaw]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const segRes = await actualizarModulo({
                modulo: "Seguridad",
                habilitado: securityCheck,
            });
            if (!segRes) throw new Error('Error al actualizar Seguridad');

            const semRes = await actualizarModulo({
                modulo: "Semana",
                semana_siguiente,
                semana_previa,
                anho_actual,
                fecha_inicio_semana_1: fechaInicioSemana1,
                total_semanas_anho: totalSemanasAnho,
            });
            if (!semRes) throw new Error('Error al actualizar Semana');

            const corrRes = await actualizarModulo({
                modulo: "Correos_alerta",
                detalles: correosAlerta,
            });
            if (!corrRes) throw new Error('Error al actualizar Correos de alerta');

            const empRes = await actualizarEmpresa({
                razonSocial,
                nombreComercial,
                nit,
            });
            if (!empRes) throw new Error('Error al actualizar datos de empresa');

            if (usuario) {
                const configUser = JSON.stringify({ ...configUsuario, inicio: pantalla_inicio });
                const userRes = await actualizarModulo({
                    modulo: usuario.username,
                    detalles: configUser,
                });
                if (!userRes) throw new Error('Error al actualizar configuracion del usuario');
            }

            try {
                const emailRes = await actualizarEmailConfig(
                    normalizarEmailConfig(emailFormData)
                );
                if (!emailRes) {
                    throw new Error('Error al actualizar configuracion de email');
                }
            } catch (emailError) {
                console.error('Error al guardar la configuracion de email:', emailError);
                setAlert(
                    emailError?.response?.data?.message ||
                        'La configuracion general se guardo, pero la configuracion de email no se pudo guardar.',
                    'warning'
                );
                setIsLoading(false);
                return;
            }

            setAlert('Configuracion guardada correctamente', 'success');
            setIsLoading(false);
            setOpen(false);
        } catch (error) {
            console.error('Error al guardar la configuracion:', error);
            setAlert(
                error?.response?.data?.message || error.message || 'Error al guardar la configuracion',
                'danger'
            );
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
                        <h6>Configuracion</h6>
                        <div className="line"></div>

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

                        {isSuperAdmin && (
                            <div className={styles1.input_group}>
                                <span>Razon Social:</span>
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
                                            <span>Recordatorios: {passwordPolicyResult.reminded || 0}</span>
                                            <span>Bloqueados: {passwordPolicyResult.blocked || 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Container>

                    <Container className="border rounded p-3 mb-3">
                        <h6 className="mb-3">Configuracion de Email SMTP</h6>
                        <div className="d-flex flex-column gap-2">
                            <div className="row">
                                <div className="col-md-6">
                                    <span>SMTP Host:</span>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            id="smtp_host"
                                            name="smtp_host"
                                            type="text"
                                            value={emailFormData.smtp_host}
                                            onChange={(e) =>
                                                setEmailFormData({
                                                    ...emailFormData,
                                                    smtp_host: e.target.value
                                                })
                                            }
                                        />
                                    </InputGroup>
                                </div>
                                <div className="col-md-3">
                                    <span>Puerto:</span>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            id="smtp_port"
                                            name="smtp_port"
                                            type="number"
                                            value={emailFormData.smtp_port}
                                            onChange={(e) =>
                                                setEmailFormData({
                                                    ...emailFormData,
                                                    smtp_port: parseInt(e.target.value, 10) || 465
                                                })
                                            }
                                        />
                                    </InputGroup>
                                </div>
                                <div className="col-md-3">
                                    <span>SSL/TLS:</span>
                                    <Form.Check
                                        type="switch"
                                        id="smtp_secure"
                                        label={emailFormData.smtp_secure ? "SSL" : "TLS"}
                                        checked={emailFormData.smtp_secure}
                                        onChange={(e) =>
                                            setEmailFormData({
                                                ...emailFormData,
                                                smtp_secure: e.target.checked
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <span>Correo:</span>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            id="email_correo"
                                            name="email_correo"
                                            type="email"
                                            value={emailFormData.email_correo}
                                            onChange={(e) =>
                                                setEmailFormData({
                                                    ...emailFormData,
                                                    email_correo: e.target.value
                                                })
                                            }
                                        />
                                    </InputGroup>
                                </div>
                                <div className="col-md-6">
                                    <span>Password:</span>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            id="password_correo"
                                            name="password_correo"
                                            type={showEmailPassword ? "text" : "password"}
                                            value={emailFormData.password_correo}
                                            onChange={(e) =>
                                                setEmailFormData({
                                                    ...emailFormData,
                                                    password_correo: e.target.value
                                                })
                                            }
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                                        >
                                            {showEmailPassword ? "Ocultar" : "Ver"}
                                        </button>
                                    </InputGroup>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <span>Nombre Remitente:</span>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            id="email_from_name"
                                            name="email_from_name"
                                            type="text"
                                            value={emailFormData.email_from_name}
                                            onChange={(e) =>
                                                setEmailFormData({
                                                    ...emailFormData,
                                                    email_from_name: e.target.value
                                                })
                                            }
                                        />
                                    </InputGroup>
                                </div>
                            </div>
                        </div>
                    </Container>

                    <div className={styles.contenedor3}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-success btn-sm form-control">
                            {isLoading ? 'Guardando...' : 'Guardar configuracion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
