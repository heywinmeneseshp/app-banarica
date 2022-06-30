import React from 'react';

//Components


//CSS
import styles from '@styles/NewUser.module.css';

export default function NuevoUsuario() {
    return (
        <div>
            <form className={styles.formulario}>
                <div className={styles.grupo}>
                    <label htmlFor="Username">Usuario</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="usuario"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Correo</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="correo"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Contraseña</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Repite la contraseña</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Rol</label>
                    <div>
                        <select className="form-select form-select-sm">
                            <option>Super administrador</option>
                            <option>Administrador</option>
                            <option>Operador</option>
                        </select>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Finca</label>
                    <div>
                        <select className="form-select form-select-sm">
                            <option>Macondo</option>
                            <option>Villa Grande</option>
                            <option>Casa Grande</option>
                        </select>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <br />
                    <div>
                        <button type="button" className="btn btn-success btn-sm form-control form-control-sm">Crear usuario</button>
                    </div>
                </div>

            </form>
        </div>
    );
}