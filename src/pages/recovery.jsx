import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    changePasswordWithToken,
    requestPasswordRecovery,
} from '@services/api/auth';
import { encontrarEmpresa } from '@services/api/configuracion';
import styles from '@styles/Login.module.css';
import background from '@public/images/background.jpg';

export default function Recovery() {
    const router = useRouter();
    const usernameRef = useRef(null);
    const tokenRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isRequesting, setIsRequesting] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const recoveryToken = typeof router.query.token === 'string' ? router.query.token.trim() : '';
    const hasRecoveryToken = Boolean(recoveryToken);

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        if (tokenRef.current) {
            tokenRef.current.value = recoveryToken;
        }

        if (hasRecoveryToken) {
            setStatus({
                type: 'success',
                message: 'Token detectado. Ya puedes definir tu nueva contrasena.',
            });
        }
    }, [hasRecoveryToken, recoveryToken, router.isReady]);

    useEffect(() => {
        const loadCompany = async () => {
            try {
                const empresa = await encontrarEmpresa();
                setCompanyName(empresa?.nombreComercial || empresa?.razonSocial || '');
            } catch (error) {
                setCompanyName('');
            }
        };

        loadCompany();
    }, []);

    const handleRecoveryRequest = async (event) => {
        event.preventDefault();

        const username = usernameRef.current?.value?.trim() || '';

        if (!username) {
            setStatus({ type: 'error', message: 'Ingresa tu usuario para continuar.' });
            return;
        }

        try {
            setIsRequesting(true);
            const response = await requestPasswordRecovery(username);
            setStatus({
                type: 'success',
                message:
                    response?.message ||
                    'Se envio el correo de recuperacion. Revisa tu bandeja de entrada.',
            });
        } catch (error) {
            setStatus({
                type: 'error',
                message:
                    error?.response?.data?.message ||
                    'No fue posible enviar el correo de recuperacion.',
            });
        } finally {
            setIsRequesting(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();

        const token = tokenRef.current?.value?.trim() || '';
        const password = passwordRef.current?.value || '';
        const confirmPassword = confirmPasswordRef.current?.value || '';

        if (!token) {
            setStatus({ type: 'error', message: 'Falta el token de recuperacion.' });
            return;
        }

        if (password.length < 6) {
            setStatus({
                type: 'error',
                message: 'La nueva contrasena debe tener al menos 6 caracteres.',
            });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Las contrasenas no coinciden.' });
            return;
        }

        try {
            setIsChanging(true);
            const response = await changePasswordWithToken(token, password);
            setStatus({
                type: 'success',
                message:
                    response?.message ||
                    'Contrasena actualizada correctamente. Ya puedes iniciar sesion.',
            });
            if (passwordRef.current) {
                passwordRef.current.value = '';
            }
            if (confirmPasswordRef.current) {
                confirmPasswordRef.current.value = '';
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message:
                    error?.response?.data?.message ||
                    'No fue posible actualizar la contrasena.',
            });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <>
            <Image
                src={background}
                alt="background"
                fill
                className={styles.background}
                style={{ objectFit: 'cover' }}
                priority
            />

            <div className={styles.padre}>
                <div className={styles.card}>
                    <div className={styles.brand}>
                        <p className={styles.eyebrow}>{companyName || ' '}</p>
                        <h1 className={styles.title}>Recupera tu contrasena</h1>
                        <p className={styles.subtitle}>
                            Solicita el enlace con tu usuario y, cuando abras el correo, actualiza
                            tu clave desde aqui.
                        </p>
                    </div>

                    {!hasRecoveryToken && (
                        <form className={styles.form} onSubmit={handleRecoveryRequest}>
                            <p className={styles.sectionTitle}>Solicitar recuperacion</p>
                            <div className="mb-3">
                                <label className="mb-2" htmlFor="recovery-username">Usuario</label>
                                <input
                                    id="recovery-username"
                                    name="recovery-username"
                                    type="text"
                                    className="form-control"
                                    placeholder="Ingresa tu usuario"
                                    ref={usernameRef}
                                    disabled={isRequesting}
                                />
                            </div>

                            <div className="d-grid mb-4">
                                <button
                                    type="submit"
                                    className={`btn btn-primary ${styles.submitButton}`}
                                    disabled={isRequesting}
                                >
                                    {isRequesting ? 'Enviando...' : 'Enviar correo de recuperacion'}
                                </button>
                            </div>
                        </form>
                    )}

                    {status.message && (
                        <div
                            className={`alert ${
                                status.type === 'error' ? 'alert-danger' : 'alert-success'
                            } py-2`}
                            role="alert"
                        >
                            {status.message}
                        </div>
                    )}

                    {hasRecoveryToken && (
                        <>
                            <div className={styles.divider}></div>

                            <form className={styles.form} onSubmit={handlePasswordChange}>
                                <p className={styles.sectionTitle}>Cambiar contrasena</p>
                                <input
                                    id="recovery-token"
                                    name="recovery-token"
                                    type="hidden"
                                    ref={tokenRef}
                                />

                                <div className="mb-3">
                                    <label className="mb-2" htmlFor="new-password">
                                        Nueva contrasena
                                    </label>
                                    <input
                                        id="new-password"
                                        name="new-password"
                                        type="password"
                                        className="form-control"
                                        placeholder="Nueva contrasena"
                                        ref={passwordRef}
                                        disabled={isChanging}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="mb-2" htmlFor="confirm-password">
                                        Confirmar contrasena
                                    </label>
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type="password"
                                        className="form-control"
                                        placeholder="Repite la nueva contrasena"
                                        ref={confirmPasswordRef}
                                        disabled={isChanging}
                                    />
                                </div>

                                <div className={styles.actions}>
                                    <Link href="/login" className={styles.linkButton}>
                                        Volver al inicio de sesion
                                    </Link>
                                </div>

                                <div className="d-grid">
                                    <button
                                        type="submit"
                                        className={`btn btn-primary ${styles.submitButton}`}
                                        disabled={isChanging}
                                    >
                                        {isChanging ? 'Actualizando...' : 'Actualizar contrasena'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
