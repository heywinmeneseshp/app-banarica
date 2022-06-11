import React, { Component } from 'react';
import styles from "../styles/Login.module.css";


export default class Login extends Component {
    render() {
        return (
            <>
                <div className={styles.padre}>
                    <form className={styles.hijo}>
                        
                        <div className="mb-3">
                            <label>Usuario</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ingresar usuario"
                            />
                        </div>
                        <div className="mb-3">
                            <label>Contraseña</label>
                            <input
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
                                <label className="custom-control-label" htmlFor="customCheck1">
                                    Recordarme
                                </label>
                            </div>
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary">
                                Iniciar sesión
                            </button>
                        </div>
                        <p className={styles.olvide + " forgot-password text-right"}>
                            ¿Olvidaste tu <a href="#">contraseña?</a>
                        </p>
                    </form>
                </div>
            </>
        )
    }
}