
import { useRef } from 'react';


//CSS
import styles from "../styles/Login.module.css";


export default function Login() {
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    const submitHanlder = (event) => {
        event.preventDefault();
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        };
    }

    return (
        <>
            <div className={styles.padre}>
                <form className={styles.hijo} onSubmit={submitHanlder}>

                    <div className="mb-3">
                        <label htmlFor="usuario">Usuario</label>
                        <input
                            id='username'
                            type="text"
                            className="form-control"
                            placeholder="ingresar usuario"
                            ref={usernameRef}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id='password'
                            type="password"
                            className="form-control"
                            placeholder="Ingresar contraseña"
                            ref={passwordRef}
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

                        
                            <button type='submit' className="btn btn-primary">
                                Iniciar sesión
                            </button>
                 
                    </div>
                    <p className="forgot-password text-right">
                        ¿Olvidaste tu contraseña?
                    </p>
                </form>
            </div>
        </>
    );

}