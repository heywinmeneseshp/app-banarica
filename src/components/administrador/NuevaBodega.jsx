import React from 'react';

//Components



//CSS
import styles from '@styles/NuevaBodega.module.css';

export default function NuevaBodega() {
    return (
        <div>
            <form className={styles.formulario}>
              
                <div className={styles.grupo}>
                    <label htmlFor="Username">Código</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="usuario"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Almacén</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="correo"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Razon social</label>
                    <div>
                        <input type="text" className="form-control form-control-sm w-100" id="contraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Teléfono</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label htmlFor="Username">Dirección</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="rcontraseña"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <br />
                    <div>
                        <button type="button" className="btn btn-success btn-sm form-control form-control-sm">Crear almacén</button>
                    </div>
                </div>

            </form>



        </div>
    );
}