import React from 'react';
import Link from 'next/link';
import { useContext } from 'react';
import AppContext from '@context/AppContext';

//CSS
import styles from "../styles/Login.module.css";


export default function Login () {
    const { handleLogin } = useContext(AppContext);
        return (
            <>
                <div className={styles.padre}>
                    <form className={styles.hijo}>
                        
                        <div className="mb-3">
                            <label htmlFor="usuario">Usuario</label>
                            <input
                                id='usuario'
                                type="text"
                                className="form-control"
                                placeholder="ingresar usuario"
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password">Contraseña</label>
                            <input
                            id='password'
                                type="password"
                                className="form-control"
                                placeholder="Ingresar contraseña"
                            />
                        </div>
                        <div className="mb-3">
                            <div className="custom-control custom-checkbox">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="customCheck1"
                                />
                                <div className="custom-control-label" htmlFor="customCheck1">
                                    Recordarme
                                </div>
                            </div>
                        </div>
                        <div className="d-grid">

                        <Link href="/">
                            <button onClick={handleLogin} type="submit" className="btn btn-primary">
                                Iniciar sesión
                            </button>
                        </Link>
                        </div>
                        <p className="forgot-password text-right">
                            ¿Olvidaste tu <Link href="">contraseña?</Link>
                        </p>
                    </form>
                </div>
            </>
        );
    
}