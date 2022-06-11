import React from 'react';

//Components



//CSS
import styles from '@styles/NewUser.module.css'

export default function NewUser() {
    return (
        <div>

            <form className={styles.formulario}>

                <div className={styles.grupo}>
                    <label for="Username">Usuario</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="usuario"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Correo</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="correo"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Contraseña</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Repite la contraseña</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Rol</label>
                    <div>
                        <select className="form-control form-control-sm">
                            <option>Super administrador</option>
                            <option>Administrador</option>
                            <option>Operador</option>
                        </select>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Repite la contraseña</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Finca</label>
                    <div>
                        <select className="form-control form-control-sm">
                            <option>Macondo</option>
                            <option>Villa Grande</option>
                            <option>Casa Grande</option>
                        </select>
                    </div>
                </div>

            </form>



        </div>
    )
}