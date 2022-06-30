import React from 'react';
import Link from 'next/link';

//CSS
import styles from "../styles/Login.module.css";


export default function Login () {

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
                            <div className="btn btn-primary">
                                Iniciar sesión
                            </div>
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