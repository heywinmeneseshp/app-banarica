import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { Button, Modal } from 'react-bootstrap';
import endPoints from '@services/api';
import { loginWithCredentials, syncSessionFromProfile } from '@services/api/auth';
import { encontrarEmpresa } from '@services/api/configuracion';
import { useAuth } from '@hooks/useAuth';
import { clearSessionNotice, getSessionNotice } from 'utils/session';
import styles from '@styles/Login.module.css';
import background from '@public/images/background.jpg';

export default function Login() {
    const auth = useAuth();
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [sessionNotice, setSessionNoticeState] = useState('');
    const isLoggingIn = auth?.isLoggingIn ?? false;

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

    useEffect(() => {
        const message = getSessionNotice();
        if (message) {
            setSessionNoticeState(message);
            clearSessionNotice();
        }
    }, []);

    const submitHanlder = async (event) => {
        event.preventDefault();

        const username = usernameRef.current?.value?.trim() || '';
        const password = passwordRef.current?.value || '';

        if (!username || !password) {
            setErrorMessage('Ingresa usuario y contrasena.');
            return;
        }

        setErrorMessage('');

        if (typeof auth?.login === 'function') {
            await auth.login(username, password);
            return;
        }

        try {
            await loginWithCredentials(username, password);
            const res = await axios.get(endPoints.auth.profile);
            syncSessionFromProfile(res.data);
            window.location.href = '/';
        } catch (error) {
            setErrorMessage(
                error?.response?.data?.message ||
                    'No fue posible iniciar sesion. Verifica el usuario y la contrasena.',
            );
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
                        <h1 className={styles.title}>Inicia sesion</h1>
                        <p className={styles.subtitle}>
                            Accede con tu usuario y contrasena para continuar.
                        </p>
                    </div>

                    <form className={styles.form} onSubmit={submitHanlder}>
                        <div className="mb-3">
                            <label className="mb-2" htmlFor="usuario">Usuario</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="form-control"
                                placeholder="Ingresar usuario"
                                ref={usernameRef}
                                disabled={isLoggingIn}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="mb-2" htmlFor="password">Contrasena</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="form-control"
                                placeholder="Ingresar contrasena"
                                ref={passwordRef}
                                disabled={isLoggingIn}
                            />
                        </div>

                        {errorMessage && (
                            <div className="alert alert-danger py-2" role="alert">
                                {errorMessage}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Link href="/recovery" className={styles.linkButton}>
                                Olvide mi contrasena
                            </Link>
                        </div>

                        <div className="d-grid">
                            <button
                                type="submit"
                                className={`btn btn-primary ${styles.submitButton}`}
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? 'Ingresando...' : 'Iniciar sesion'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal
                show={Boolean(sessionNotice)}
                onHide={() => setSessionNoticeState('')}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Sesion finalizada</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">{sessionNotice}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setSessionNoticeState('')}>
                        Entendido
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
