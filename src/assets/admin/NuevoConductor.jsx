import React from 'react';

//Components


//CSS
import styles from '@styles/NewUser.module.css'

export default function NuevoConductor() {
    return (
        <div>
            <form className={styles.formulario}>
                <div className={styles.grupo}>
                    <label for="Username">Código</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="usuario"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Conductor</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="correo"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Razón social</label>
                    <div>
                        <select className="form-select form-select-sm">
                            <option>Hurgo Transporte SAS</option>
                            <option>Transmonsa SAS</option>
                            <option>Envia SA</option>
                        </select>
                    </div>
                </div>


                <div className={styles.grupo}>
                    <label for="Username">Correo</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Télefono</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <br />
                    <div>
                        <button type="button" className="btn btn-success btn-sm form-control form-control-sm">Crear conductor</button>
                    </div>
                </div>

            </form>



        </div>
    )
}